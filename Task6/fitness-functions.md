# Задание 6. Fitness-функции

Функции автоматически сверяют данные сервисов с состоянием Saga в Zeebe и контролируют выполнение процесса.

<table style="font-size: 0.85em;">
  <thead>
    <tr>
      <th style="vertical-align: top;">Название функции</th>
      <th style="vertical-align: top;">Назначение</th>
      <th style="vertical-align: top;">Что проверяется</th>
      <th style="vertical-align: top;">Действие при нарушении</th>
      <th style="vertical-align: top;">Способ реализации</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align: top;"><code>PaymentStateConsistency</code></td>
      <td style="vertical-align: top;">Сверять состояние платежа между Payment Service, FraudCheck Service, Notification Service и Saga.</td>
      <td style="vertical-align: top;">Для одного <code>payment_id</code> результаты операций Payment Service совпадают с ходом Saga; результат и проверки FraudCheck совпадают с переменными процесса; уведомление использует итоговый <code>payment_outcome</code>. <code>completed</code> допустим только после успешного перевода, <code>refunded</code> — после успешных возврата и отката статуса, <code>failed_system</code> — после неуспешного списания без захвата средств.</td>
      <td style="vertical-align: top;">Создать инцидент и уведомить ответственного, указав <code>payment_id</code>, сервис, ожидаемое и фактическое состояния. Не менять состояние процесса автоматически.</td>
      <td style="vertical-align: top;">Плановая проверка запрашивает read-only API состояния операций каждого сервиса и сопоставляет ответы с переменными и историей экземпляра Zeebe по <code>payment_id</code>.</td>
    </tr>
    <tr>
      <td style="vertical-align: top;"><code>StuckSagaDetection</code></td>
      <td style="vertical-align: top;">Выявлять экземпляры Saga, остановившиеся на активном шаге.</td>
      <td style="vertical-align: top;">Активная сервисная задача не завершена в пределах настроенного для неё срока либо по экземпляру открыт инцидент. Ожидание проверок и ручного решения не считается зависанием до истечения соответствующего дедлайна: 30 секунд и 20 минут.</td>
      <td style="vertical-align: top;">Создать инцидент или уведомление с <code>payment_id</code>, активным шагом и временем ожидания; не продвигать процесс принудительно.</td>
      <td style="vertical-align: top;">Плановая проверка анализирует активные экземпляры, задачи и инциденты Zeebe; сроки исполнения сервисных задач задаются в конфигурации, сроки бизнес-ожиданий — в BPMN.</td>
    </tr>
    <tr>
      <td style="vertical-align: top;"><code>SagaCompensationIntegrity</code></td>
      <td style="vertical-align: top;">Проверять допустимость переходов Saga и полноту компенсации.</td>
      <td style="vertical-align: top;">Перевод получателю выполняется только после одобрения. Ошибка списания не запускает возврат. Если списание прошло, а платёж отклонён или перевод достоверно не состоялся, должны успешно завершиться возврат и откат статуса до <code>PAYMENT_REFUNDED</code>; <code>TRANSFER_FAILED</code> не фиксируется при неизвестном результате или уже состоявшемся переводе.</td>
      <td style="vertical-align: top;">Зафиксировать нарушение и оставить экземпляр на проблемном шаге или в инциденте; не устанавливать <code>refunded</code> и не пропускать компенсацию.</td>
      <td style="vertical-align: top;">Автоматически проверять историю экземпляра Zeebe и записи операций сервисов по <code>payment_id</code> на соответствие переходам и компенсационным правилам Saga.</td>
    </tr>
    <tr>
      <td style="vertical-align: top;"><code>BusinessDeadlineControl</code></td>
      <td style="vertical-align: top;">Контролировать бизнес-дедлайны проверок и ручного решения.</td>
      <td style="vertical-align: top;">Обе проверки завершились в пределах 30 секунд; решение ручной проверки получено в пределах 20 минут с момента активации задачи.</td>
      <td style="vertical-align: top;">По истечении срока процесс отклоняет платёж с <code>refund_reason=check_cutoff</code> или <code>manual_review_cutoff</code> и выполняет возврат с откатом статуса. Если переход по таймеру не произошёл, создать инцидент и уведомить ответственного.</td>
      <td style="vertical-align: top;">Дедлайны реализуются таймерами BPMN. Плановая проверка сверяет время активации и завершения ожидания, переход процесса, причину отклонения и ход компенсации по данным Zeebe.</td>
    </tr>
  </tbody>
</table>
