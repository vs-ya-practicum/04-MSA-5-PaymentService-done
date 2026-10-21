# Standalone Camunda Hub

The four configuration files are copied unchanged from the [official Camunda 8.10 Docker Compose distribution](https://github.com/camunda/camunda-distributions/releases/tag/docker-compose-8.10). The included `.env` pins Hub to `8.10.2` and Identity to `8.10.1`.

## Start

With Docker Desktop running, open PowerShell in `engineering/model/task4/2/02-realization` and run:

```powershell
docker compose -p camunda-hub --env-file .delivery/camunda-hub/.env -f .delivery/camunda-hub/docker-compose-hub.yaml up -d
```

Open <http://localhost:8070> and sign in with `demo` / `demo`. Create a project and import `services/process/process.bpmn` using the file picker.

This setup includes Hub, WebSockets, Identity, Keycloak, two PostgreSQL databases, and Mailpit. It uses the distribution's local development credentials. It does not start an Orchestration Cluster.

## Stop

```powershell
docker compose -p camunda-hub --env-file .delivery/camunda-hub/.env -f .delivery/camunda-hub/docker-compose-hub.yaml down
```

Database data remains in Docker volumes.

See the [official configuration documentation](https://docs.camunda.io/docs/self-managed/quickstart/developer-quickstart/docker-compose/configuration/).
