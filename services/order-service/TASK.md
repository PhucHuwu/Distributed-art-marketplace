# SVC-07 Order Service Task

- Owner: `tuanhm`
- Branch: `tuanhm`
- Service path: `services/order-service`

## Scope

- Implement cart APIs: add/update/remove items.
- Implement order creation endpoint with initial `PENDING` status.
- Publish `order.created` on successful order creation.
- Consume inventory/payment events and update order lifecycle.
- Persist status history.
- Create Prisma schema and migration for schema `orders`.

## Micro Tasks (do in order)

- [x] O1 - Initialize service structure and config validation.
- [x] O2 - Setup Prisma datasource for schema `orders`.
- [x] O3 - Create models: `carts`, `cart_items`, `orders`, `order_items`, `order_status_histories`.
- [x] O4 - Create first migration.
- [x] O5 - Implement `GET /orders/cart`.
- [x] O6 - Implement `POST /orders/cart/items`.
- [x] O7 - Implement `PUT /orders/cart/items/{id}`.
- [x] O8 - Implement `DELETE /orders/cart/items/{id}`.
- [x] O9 - Implement `POST /orders` to create order with `PENDING`.
- [x] O10 - Snapshot shipping address and pricing at order creation.
- [x] O11 - Publish `order.created` after order creation success.
- [x] O12 - Consume `inventory.reserved` and move to `AWAITING_PAYMENT`.
- [x] O13 - Consume `inventory.failed` and move to `FAILED`.
- [x] O14 - Consume `payment.success` and move to `COMPLETED` then publish `order.completed`.
- [x] O15 - Consume `payment.failed` and move to `FAILED` then publish `order.failed`.
- [x] O16 - Persist status changes into `order_status_histories`.
- [x] O17 - Add idempotency guard for event consumer by `eventId`.
- [x] O18 - Implement `GET /orders/{orderId}` and `GET /orders/me`.
- [x] O19 - Add `GET /health` endpoint.
- [x] O20 - Integrate OpenAPI spec generation for order endpoints.
- [x] O21 - Expose Swagger UI route for API testing.
- [x] O22 - Add structured logging with `correlationId`.
- [x] O23 - Add tests for cart flow and full lifecycle transitions.
- [x] O24 - Update service README with run, env, events, endpoints, and Swagger URL.

## Acceptance Criteria

- Lifecycle transitions follow design (`PENDING`, `AWAITING_PAYMENT`, `COMPLETED`, `FAILED`, `CANCELLED`).
- Order history is recorded correctly.
- Event publish/consume flow is idempotent and traceable.
- Swagger UI is available and documents all order APIs.
- Service has healthcheck endpoint and structured logs with `correlationId`.

## Mandatory System Notes

- Do not directly modify inventory/payment schema data.
- Use events as the main cross-service synchronization mechanism.
- Keep order totals and snapshots consistent at creation time.
- Swagger reference: follow `SWAGGER_GUIDELINE.md`.
