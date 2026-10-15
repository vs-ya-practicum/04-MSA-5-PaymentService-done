# Таблица переходов платёжной операции

| **Исходное состояние** | **Переходное состояние** | **Событие** |
| --- | --- | --- |
| Начальное состояние | `1. PAYMENT_INITIATED` | `PaymentInitiatedFact` |
| `1. PAYMENT_INITIATED` | `2. PAYER_FUNDS_DEBITED` | `PayerFundsDebitedFact` |
| `2. PAYER_FUNDS_DEBITED` | `3. PAYMENT_AWAITING_CHECK_RESULTS` | `AntifraudCheckStartedFact` |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `5. PAYMENT_APPROVED` | `PaymentApprovedFact` |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `5. PAYMENT_APPROVED` | Истёк cut-off time ожидания результата проверки. |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `7. PAYMENT_REJECTED_FRAUDCHECK` | `PaymentRejectedByFraudCheckFact` |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `4. PAYMENT_AWAITING_MANUAL_REVIEW_DECISION` | `ManualReviewRequiredFact` |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `8. PAYMENT_REJECTED_SUSPICIOUS` | `SuspiciousPaymentDetectedFact` |
| `3. PAYMENT_AWAITING_CHECK_RESULTS` | `9. PAYMENT_FAILED_SYSTEM` | `PaymentFailedEvent` |
| `4. PAYMENT_AWAITING_MANUAL_REVIEW_DECISION` | `5. PAYMENT_APPROVED` | `ManualReviewDecisionFact` — решение оператора: одобрено. |
| `4. PAYMENT_AWAITING_MANUAL_REVIEW_DECISION` | `7. PAYMENT_REJECTED_FRAUDCHECK` | `ManualReviewDecisionFact` — решение оператора: отклонено. |
| `4. PAYMENT_AWAITING_MANUAL_REVIEW_DECISION` | `5. PAYMENT_APPROVED` | Истекли 20 минут ожидания решения оператора. |
| `5. PAYMENT_APPROVED` | `6. PAYMENT_COMPLETED` | `PaymentCompletedFact` |
| `5. PAYMENT_APPROVED` | `9. PAYMENT_FAILED_SYSTEM` | `PaymentFailedEvent` |
| `7. PAYMENT_REJECTED_FRAUDCHECK` | `10. PAYMENT_REFUNDED` | `PaymentRefundedFact` |
| `8. PAYMENT_REJECTED_SUSPICIOUS` | `10. PAYMENT_REFUNDED` | `PaymentRefundedFact` |
| `9. PAYMENT_FAILED_SYSTEM` | `10. PAYMENT_REFUNDED` | `PaymentRefundedFact` |
