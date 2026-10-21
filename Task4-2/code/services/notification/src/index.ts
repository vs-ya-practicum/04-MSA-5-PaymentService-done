import { Camunda8 } from "@camunda8/sdk";
import { EJobType } from "@task4-2/shared";

const zeebe = new Camunda8().getZeebeGrpcApiClient();

function paymentId(variables: Record<string, unknown>): string {
  return typeof variables.payment_id === "string" ? variables.payment_id : "unknown";
}

zeebe.createWorker({
  taskType: EJobType.NOTIFY_SECURITY_SYSTEM,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);
    console.info(`${EJobType.NOTIFY_SECURITY_SYSTEM} completed as a simulation.`, { payment_id: id });
    return job.complete();
  },
});

zeebe.createWorker({
  taskType: EJobType.SEND_PAYMENT_STATUS_NOTIFICATION,
  taskHandler: async (job) => {
    const id = paymentId(job.variables);
    const outcome = job.variables.payment_outcome;
    console.info(`${EJobType.SEND_PAYMENT_STATUS_NOTIFICATION} completed as a simulation.`, {
      payment_id: id,
      payment_outcome: outcome,
    });
    return job.complete();
  },
});

console.info("Notification Service workers started.");
