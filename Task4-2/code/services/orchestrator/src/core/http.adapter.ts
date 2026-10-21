import type { Camunda8 } from "@camunda8/sdk";
import { EFraudResult, EProcessMessageName, ETestFailureAt } from "@task4-2/shared";
import type { IncomingMessage, ServerResponse } from "node:http";

type TPaymentRequest = {
    payment_id: string;
    payer_id: string;
    payee_id: string;
    currency: string;
    amount: number;
};

type TPaymentTestSettings = {
    fraud_result: EFraudResult;
    failure_at: ETestFailureAt;
    transient_refund_failures: number;
    transient_rollback_failures: number;
};

type TTestPaymentVariables = TPaymentRequest & {
    test_fraud_result: EFraudResult;
    test_failure_at: ETestFailureAt;
    test_transient_refund_failures: number;
    test_transient_rollback_failures: number;
};

type TPaymentVariables = TPaymentRequest | TTestPaymentVariables;
type TZeebeClient = ReturnType<Camunda8["getZeebeGrpcApiClient"]>;

const fraudResults = Object.values(EFraudResult);
const failurePoints = Object.values(ETestFailureAt);
const testSettingsFields = new Set([
    "fraud_result",
    "failure_at",
    "transient_refund_failures",
    "transient_rollback_failures",
]);

export class HttpAdapter {
    public constructor(private readonly zeebe: TZeebeClient) { }

    public async handlePayment(request: IncomingMessage, response: ServerResponse): Promise<void> {
        await this.handlePaymentRequest(request, response, false);
    }

    public async handleTestPayment(request: IncomingMessage, response: ServerResponse): Promise<void> {
        await this.handlePaymentRequest(request, response, true);
    }

    public sendNotFound(response: ServerResponse): void {
        this.sendJson(response, 404, { error: "Route not found." });
    }

    private async handlePaymentRequest(
        request: IncomingMessage,
        response: ServerResponse,
        isTestRequest: boolean,
    ): Promise<void> {
        let payment: TPaymentVariables;

        try {
            payment = await this.readPaymentRequest(request, isTestRequest);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid request body.";
            this.sendJson(response, 400, { error: message });
            return;
        }

        try {
            await this.zeebe.publishStartMessage({
                name: EProcessMessageName.PAYMENT_INITIATED_FACT,
                correlationKey: payment.payment_id,
                messageId: payment.payment_id,
                timeToLive: 0,
                variables: payment,
            });

            console.info(`Published ${EProcessMessageName.PAYMENT_INITIATED_FACT}.`, { payment_id: payment.payment_id });
            this.sendJson(response, 202, { payment_id: payment.payment_id, status: "accepted" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not publish payment message.";
            console.error("Payment message publication failed.", { payment_id: payment.payment_id, message });
            this.sendJson(response, 503, { error: "Payment process is unavailable." });
        }
    }

    private async readPaymentRequest(request: IncomingMessage, isTestRequest: boolean): Promise<TPaymentVariables> {
        const chunks: Uint8Array[] = [];
        let bodySize = 0;

        for await (const chunk of request) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bodySize += buffer.length;

            if (bodySize > 16_384) {
                throw new Error("Request body exceeds 16 KB.");
            }

            chunks.push(buffer);
        }

        const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));

        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("Request body must be a JSON object.");
        }

        const payment = body as Record<string, unknown>;
        const paymentId = this.trimRequiredString(payment.payment_id, "payment_id");
        const payerId = this.trimRequiredString(payment.payer_id, "payer_id");
        const payeeId = this.trimRequiredString(payment.payee_id, "payee_id");
        const currency = this.trimRequiredString(payment.currency, "currency");

        if (typeof payment.amount !== "number" || !Number.isFinite(payment.amount) || payment.amount <= 0) {
            throw new Error("amount must be a positive number.");
        }

        const paymentRequest: TPaymentRequest = {
            payment_id: paymentId,
            payer_id: payerId,
            payee_id: payeeId,
            currency,
            amount: payment.amount,
        };

        if (!isTestRequest) {
            return paymentRequest;
        }

        const testSettings = this.readPaymentTestSettings(payment.test);
        return {
            payment_id: paymentRequest.payment_id,
            payer_id: paymentRequest.payer_id,
            payee_id: paymentRequest.payee_id,
            currency: paymentRequest.currency,
            amount: paymentRequest.amount,
            test_fraud_result: testSettings.fraud_result,
            test_failure_at: testSettings.failure_at,
            test_transient_refund_failures: testSettings.transient_refund_failures,
            test_transient_rollback_failures: testSettings.transient_rollback_failures,
        };
    }

    private readPaymentTestSettings(value: unknown): TPaymentTestSettings {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw new Error("test must be a JSON object.");
        }

        const settings = value as Record<string, unknown>;
        const unknownFields = Object.keys(settings).filter((field) => !testSettingsFields.has(field));

        if (unknownFields.length > 0) {
            throw new Error(`test contains unsupported fields: ${unknownFields.join(", ")}.`);
        }

        const fraudResult = settings.fraud_result ?? EFraudResult.APPROVED;
        if (typeof fraudResult !== "string" || !fraudResults.includes(fraudResult as EFraudResult)) {
            throw new Error(`test.fraud_result must be one of: ${fraudResults.join(", ")}.`);
        }

        const failureAt = settings.failure_at ?? ETestFailureAt.NONE;
        if (typeof failureAt !== "string" || !failurePoints.includes(failureAt as ETestFailureAt)) {
            throw new Error(`test.failure_at must be one of: ${failurePoints.join(", ")}.`);
        }

        return {
            fraud_result: fraudResult as EFraudResult,
            failure_at: failureAt as ETestFailureAt,
            transient_refund_failures: this.readNonNegativeInteger(
                settings.transient_refund_failures,
                "test.transient_refund_failures",
            ),
            transient_rollback_failures: this.readNonNegativeInteger(
                settings.transient_rollback_failures,
                "test.transient_rollback_failures",
            ),
        };
    }

    private readNonNegativeInteger(value: unknown, field: string): number {
        if (value === undefined) {
            return 0;
        }

        if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
            throw new Error(`${field} must be a non-negative integer.`);
        }

        return value;
    }

    private trimRequiredString(value: unknown, field: string): string {
        if (typeof value !== "string") {
            throw new Error(`${field} must be a non-empty string.`);
        }

        const trimmedValue = value.trim();

        if (trimmedValue.length === 0) {
            throw new Error(`${field} must be a non-empty string.`);
        }

        return trimmedValue;
    }

    private sendJson(response: ServerResponse, statusCode: number, body: object): void {
        response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(body));
    }
}
