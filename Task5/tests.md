# Задание 5. Тест-кейсы

| Название | Тип | Компоненты | Предусловия |
| --- | --- | --- | --- |
| Успешный платёж | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Payment Service, Notification Service | Процесс и сервисы запущены; платёжные данные корректны; FraudCheck одобряет платёж; внешние проверки проходят; тестовые сбои не настроены. |
| Запрет антифрод-проверки | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Payment Service, Notification Service | Процесс и сервисы запущены; платёжные данные корректны; FraudCheck возвращает `denied`; тестовые сбои не настроены. |
| Подозрительный платёж | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Payment Service, Notification Service | Процесс и сервисы запущены; платёжные данные корректны; FraudCheck возвращает `suspicious`; тестовые сбои не настроены. |
| Ручная проверка: одобрение или отказ | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Tasklist, Payment Service, Notification Service | Процесс и форма развёрнуты; FraudCheck возвращает `manual_review_required`; оператор доступен в Tasklist; проверить оба значения `manual_decision`: `approved` и `denied`. |
| Ошибка антифрод- или внешней проверки | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Payment Service, Notification Service | Процесс и сервисы запущены; платёжные данные корректны; проверить варианты `failure_at=fraud_check` и `failure_at=external_checks`. |
| Истечение срока проверки | Сквозной (E2E) | Payment Orchestrator, Zeebe, FraudCheck Service, Tasklist, Payment Service, Notification Service | Процесс и сервисы запущены; проверить варианты: внешние проверки не завершаются за 30 секунд; оператор не принимает решение за 20 минут. |
| Ошибка списания | Сквозной (E2E) | Payment Orchestrator, Zeebe, Payment Service | Процесс и сервисы запущены; платёжные данные корректны; настроено `failure_at=debit`. |
| Ошибка перевода получателю | Сквозной (E2E) | Payment Orchestrator, Zeebe, Payment Service, Notification Service | Процесс и сервисы запущены; платёжные данные корректны; FraudCheck одобряет платёж; настроено `failure_at=transfer`. |
| Повтор после временной ошибки компенсации | Интеграционный | Zeebe, Payment Service | Процесс развёрнут; платёж перешёл к компенсации; проверить варианты с одним временным сбоем `REFUND_PAYER` и `ROLLBACK_PAYMENT_STATUS`. |
| Постоянная ошибка компенсации | Интеграционный | Zeebe, Payment Service | Процесс развёрнут; запущена компенсация; проверить варианты с постоянным сбоем `REFUND_PAYER` и `ROLLBACK_PAYMENT_STATUS`. |
