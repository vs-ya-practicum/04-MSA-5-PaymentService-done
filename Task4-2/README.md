# Задание 4.2. Реализация процесса Camunda

## 1. Код сервиса и BPMN-процесса

- [Каталог с кодом сервисов и настройками проекта](code/)
- [Исполняемый BPMN-процесс](code/services/process/process.bpmn)
- [Форма ручной проверки](code/services/process/manual-review.form)

## 2. Docker Compose

- [Стек Camunda и контейнер развёртывания процесса](code/.delivery/configuration/compose/compose.yaml)
- [Payment Orchestrator](code/.delivery/configuration/compose/orchestrator.compose.yaml)
- [Worker-сервисы](code/.delivery/configuration/compose/workers.compose.yaml)
- [Dockerfile сервисов](code/.delivery/configuration/docker/Dockerfile)
- [Dockerfile развёртывания процесса](code/.delivery/configuration/docker/deploy-process.Dockerfile)

## 3. Скриншоты

- [Dashboard Operate](screenshots/01-dashboard.png)
- [Список экземпляров процесса в Operate](screenshots/02-processes.png)
- [История завершённого процесса и переменные в Operate](screenshots/03-process.png)
- [Завершённая ручная проверка в Tasklist](screenshots/04-manual-review.png)
- [Логи Payment Service](screenshots/05-payment-service.log.png)
