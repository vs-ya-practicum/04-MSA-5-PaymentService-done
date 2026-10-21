import { Camunda8 } from "@camunda8/sdk";
import { EFraudResult, EJobType, ETestFailureAt, ErrorCode } from "@task4-2/shared";

const fraudResults = Object.values(EFraudResult);
const zeebe = new Camunda8().getZeebeGrpcApiClient();

function paymentId(variables: Record<string, unknown>): string {
  return typeof variables.payment_id === "string" ? variables.payment_id : "unknown";
}

function configuredFraudResult(variables: Record<string, unknown>): EFraudResult {
  const value = variables.test_fraud_result;
  return typeof value === "string" && fraudResults.includes(value as EFraudResult)
    ? value as EFraudResult
    : EFraudResult.APPROVED;
}

function failureAt(variables: Record<string, unknown>): unknown {
  return variables.test_failure_at;
}

zeebe.createWorker({
  taskType: EJobType.PERFORM_FRAUD_CHECK,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);

    if (failureAt(job.variables) === ETestFailureAt.FRAUD_CHECK) {
      console.info("Simulating fraud check failure.", { payment_id: id });
      return job.error({ errorCode: ErrorCode.CHECK_FAILED, errorMessage: "Simulated fraud check failure.", variables: {} });
    }

    const fraudResult = configuredFraudResult(job.variables);
    console.info(`${EJobType.PERFORM_FRAUD_CHECK} completed.`, { payment_id: id, fraud_result: fraudResult });
    return job.complete({ fraud_result: fraudResult });
  },
});

zeebe.createWorker({
  taskType: EJobType.PERFORM_EXTERNAL_CHECKS,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);
    const failChecks = failureAt(job.variables) === ETestFailureAt.EXTERNAL_CHECKS;
    const checks = [
      { name: "compliance", passed: !failChecks },
      { name: "restriction_control", passed: true },
    ];

    for (const check of checks) {
      console.info(`Simulated ${check.name} check ${check.passed ? "passed" : "failed"}.`, { payment_id: id });
    }

    const failedChecks = checks.filter((check) => !check.passed);

    if (failedChecks.length > 0) {
      const failedCheckNames = failedChecks.map((check) => check.name).join(", ");
      return job.error({
        errorCode: ErrorCode.CHECK_FAILED,
        errorMessage: `Simulated checks failed: ${failedCheckNames}.`,
        variables: {},
      });
    }

    return job.complete();
  },
});

console.info("FraudCheck Service workers started.");
