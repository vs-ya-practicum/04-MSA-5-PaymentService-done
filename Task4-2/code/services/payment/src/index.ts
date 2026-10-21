import { Camunda8 } from "@camunda8/sdk";
import { EJobType, ETestFailureAt, ErrorCode } from "@task4-2/shared";

const zeebe = new Camunda8().getZeebeGrpcApiClient();
const refundedPayments = new Set<string>();
const rolledBackPayments = new Set<string>();
const remainingRefundFailures = new Map<string, number>();
const remainingRollbackFailures = new Map<string, number>();

function paymentId(variables: Record<string, unknown>): string {
  return typeof variables.payment_id === "string" ? variables.payment_id : "unknown";
}

function failureAt(variables: Record<string, unknown>): unknown {
  return variables.test_failure_at;
}

function transientFailureCount(variables: Record<string, unknown>, field: string): number {
  const value = variables[field];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function shouldSimulateTransientFailure(
  id: string,
  configuredFailureCount: number,
  remainingFailuresByPaymentId: Map<string, number>,
): boolean {
  const remainingFailures = remainingFailuresByPaymentId.get(id) ?? configuredFailureCount;

  if (remainingFailures === 0) {
    return false;
  }

  remainingFailuresByPaymentId.set(id, remainingFailures - 1);
  return true;
}

zeebe.createWorker({
  taskType: EJobType.DEBIT_PAYER_FUNDS,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);

    if (failureAt(job.variables) === ETestFailureAt.DEBIT) {
      console.info("Simulating debit failure.", { payment_id: id });
      return job.error({
        errorCode: ErrorCode.DEBIT_FAILED,
        errorMessage: "Simulated debit failure.",
        variables: {},
      });
    }

    console.info(`${EJobType.DEBIT_PAYER_FUNDS} completed.`, { payment_id: id });
    return job.complete();
  },
});

zeebe.createWorker({
  taskType: EJobType.TRANSFER_FUNDS_TO_PAYEE,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);

    if (failureAt(job.variables) === ETestFailureAt.TRANSFER) {
      console.info("Simulating a known transfer failure.", { payment_id: id });
      return job.error({
        errorCode: ErrorCode.TRANSFER_FAILED,
        errorMessage: "Simulated transfer did not take effect.",
        variables: {},
      });
    }

    console.info(`${EJobType.TRANSFER_FUNDS_TO_PAYEE} completed.`, { payment_id: id });
    return job.complete();
  },
});

zeebe.createWorker({
  taskType: EJobType.REFUND_PAYER,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);

    if (refundedPayments.has(id)) {
      console.info("Refund was already simulated.", { payment_id: id });
      return job.complete();
    }

    if (failureAt(job.variables) === ETestFailureAt.REFUND) {
      console.error("Simulating permanent refund failure.", { payment_id: id });
      return job.fail({ errorMessage: "Simulated permanent refund failure.", retries: 0 });
    }

    const configuredFailureCount = transientFailureCount(job.variables, "test_transient_refund_failures");
    if (shouldSimulateTransientFailure(id, configuredFailureCount, remainingRefundFailures)) {
      console.warn("Simulating transient refund failure.", { payment_id: id, retries_left: job.retries - 1 });
      return job.fail({
        errorMessage: "Simulated transient refund failure.",
        retries: job.retries - 1,
        retryBackOff: 1000,
      });
    }

    refundedPayments.add(id);
    console.info(`${EJobType.REFUND_PAYER} completed as an idempotent simulation.`, { payment_id: id });
    return job.complete();
  },
});

zeebe.createWorker({
  taskType: EJobType.ROLLBACK_PAYMENT_STATUS,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);

    if (rolledBackPayments.has(id)) {
      console.info("Payment status was already rolled back in the simulation.", { payment_id: id });
      return job.complete();
    }

    if (failureAt(job.variables) === ETestFailureAt.ROLLBACK) {
      console.error("Simulating permanent payment-status rollback failure.", { payment_id: id });
      return job.fail({ errorMessage: "Simulated permanent payment-status rollback failure.", retries: 0 });
    }

    const configuredFailureCount = transientFailureCount(job.variables, "test_transient_rollback_failures");
    if (shouldSimulateTransientFailure(id, configuredFailureCount, remainingRollbackFailures)) {
      console.warn("Simulating transient payment-status rollback failure.", {
        payment_id: id,
        retries_left: job.retries - 1,
      });
      return job.fail({
        errorMessage: "Simulated transient payment-status rollback failure.",
        retries: job.retries - 1,
        retryBackOff: 1000,
      });
    }

    rolledBackPayments.add(id);
    console.info(`${EJobType.ROLLBACK_PAYMENT_STATUS} completed as an idempotent simulation.`, { payment_id: id });
    return job.complete();
  },
});

console.info("Payment Service workers started.");
