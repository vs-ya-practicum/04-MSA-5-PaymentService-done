import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

type TFraudResult = "approved" | "denied" | "suspicious" | "manual_review_required";
type TFailureAt = "none" | "fraud_check" | "external_checks" | "debit" | "transfer" | "refund" | "rollback";
type TManualDecision = "approved" | "denied";

type TPaymentScenario = {
    payment: {
        payer_id: string;
        payee_id: string;
        currency: string;
        amount: number;
    };
    test: {
        fraud_result: TFraudResult;
        failure_at: TFailureAt;
        transient_refund_failures?: number;
        transient_rollback_failures?: number;
    };
    manual_decision?: TManualDecision;
    checks: string;
    inspect_for: string;
};

type TPaymentAcceptedResponse = {
    payment_id: string;
    status: string;
};

const scenariosURL = new URL("./payment-scenarios.json", import.meta.url);
const paymentOrchestratorURL = (process.env.PAYMENT_ORCHESTRATOR_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const scenarios = JSON.parse(await readFile(scenariosURL, "utf8")) as Record<string, TPaymentScenario>;

async function main(): Promise<void> {
    const prompt = createInterface({ input: stdin, output: stdout });
    const scenarioEntries = Object.entries(scenarios);
    const runId = `${Date.now()}-${process.pid}`;
    let submissionNumber = 0;

    console.log("\nPayment process scenarios");
    console.log("-------------------------");
    scenarioEntries.forEach(([scenarioId], index) => {
        console.log(`${String(index + 1).padStart(2, " ")}. ${scenarioId}`);
    });
    console.log(" 0. Exit");

    while (true) {
        const selection = (await prompt.question("\nSelect a scenario number: ")).trim();

        if (selection === "0") {
            console.log("Exiting.");
            prompt.close();
            return;
        }

        const selectedNumber = Number(selection);
        const selectedScenario = Number.isInteger(selectedNumber) ? scenarioEntries[selectedNumber - 1] : undefined;

        if (!selectedScenario) {
            console.log(`Enter a number from 1 to ${scenarioEntries.length}, or 0 to exit.`);
            continue;
        }

        submissionNumber += 1;
        await submitScenario(selectedScenario, `${runId}-${submissionNumber}`);
    }
}

async function submitScenario(
    [scenarioId, scenario]: [string, TPaymentScenario],
    runId: string,
): Promise<void> {
    const paymentId = `test-${runId}-${scenarioId}`;
    const requestBody = {
        payment_id: paymentId,
        payer_id: scenario.payment.payer_id,
        payee_id: scenario.payment.payee_id,
        currency: scenario.payment.currency,
        amount: scenario.payment.amount,
        test: scenario.test,
    };

    console.log(`\nSubmitting: ${scenarioId}`);
    console.log(`Payment ID: ${paymentId}`);

    try {
        const response = await fetch(`${paymentOrchestratorURL}/test/payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(10_000),
        });
        const responseBody = await response.text();

        if (!response.ok) {
            console.error(`Request failed: HTTP ${response.status} ${responseBody}`);
            return;
        }

        const acceptedResponse = JSON.parse(responseBody) as TPaymentAcceptedResponse;

        if (acceptedResponse.status !== "accepted" || acceptedResponse.payment_id !== paymentId) {
            console.error(`Unexpected response: ${responseBody}`);
            return;
        }

        console.log("Request accepted.");
        console.log(`Checks: ${scenario.checks}`);
        console.log(`Inspect for: ${scenario.inspect_for}`);
        if (scenario.manual_decision !== undefined) {
            console.log(`Tasklist: http://localhost:8082 — select "${scenario.manual_decision}" on the manual review form.`);
        }
        console.log("Check the process instance in Operate for the actual outcome.");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Request failed: ${message}`);
    }
}

await main();
