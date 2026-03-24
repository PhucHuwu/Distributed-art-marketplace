# Event Envelope Contract v1

## Standard envelope

All published domain events must follow this envelope:

```json
{
  "eventId": "uuid",
  "eventType": "order.created",
  "occurredAt": "2026-03-24T10:00:00.000Z",
  "producer": "order-service",
  "correlationId": "uuid",
  "version": "v1",
  "payload": {}
}
```

## Field requirements

- `eventId`: required UUID, unique per event message.
- `eventType`: required string, kebab/domain based type name.
- `occurredAt`: required ISO-8601 timestamp.
- `producer`: required service name.
- `correlationId`: required trace id reused across the saga flow.
- `version`: required contract version, default `v1`.
- `payload`: required object, domain-specific data only.

## Safety and compatibility

- Do not include password, raw token, or secret in `payload`.
- Additive changes in `payload` are allowed in `v1`.
- Breaking changes require new `version` and migration plan.

## Idempotency rule

- Consumers must deduplicate by `eventId`.
- Duplicate events must be acknowledged safely without reprocessing side effects.
