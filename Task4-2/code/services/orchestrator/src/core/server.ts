import { Camunda8 } from "@camunda8/sdk";
import { createServer } from "node:http";
import { HttpAdapter } from "./http.adapter.js";
import { createPaymentsRoute } from "./payments.route.js";

export function startServer(): void {
    const port = Number(process.env.PORT ?? 3000);
    const zeebe = new Camunda8().getZeebeGrpcApiClient();
    const httpAdapter = new HttpAdapter(zeebe);
    const route = createPaymentsRoute(httpAdapter);
    const server = createServer(route);

    server.listen(port, "0.0.0.0", () => {
        console.info(`Payment Orchestrator listening on port ${port}.`);
    });
}
