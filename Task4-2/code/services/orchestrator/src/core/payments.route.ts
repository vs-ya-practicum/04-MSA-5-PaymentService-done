import type { IncomingMessage, ServerResponse } from "node:http";
import { HttpAdapter } from "./http.adapter.js";

export function createPaymentsRoute(httpAdapter: HttpAdapter) {
    return (request: IncomingMessage, response: ServerResponse): void => {
        if (request.method === "POST" && request.url === "/payments") {
            void httpAdapter.handlePayment(request, response);
            return;
        }

        if (request.method === "POST" && request.url === "/test/payments") {
            void httpAdapter.handleTestPayment(request, response);
            return;
        }

        httpAdapter.sendNotFound(response);
    };
}
