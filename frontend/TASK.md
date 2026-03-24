# FE-01 Frontend Web Task

- Owner: `tuanhm`
- Branch: `tuanhm`
- Service path: `frontend`

## Scope

- Build Next.js storefront for end users: browse artworks, cart, checkout, payment result, profile, and order history.
- Integrate frontend with gateway APIs under `/api/*` and JWT auth flow.
- Follow backend contracts for order/payment lifecycle and error handling with `correlationId`.
- Ensure responsive UI on desktop/mobile and production-ready loading/empty/error states.

## Micro Tasks (do in order)

- [x] F1 - Initialize Next.js TypeScript app structure and shared coding conventions.
- [x] F2 - Setup environment config (`NEXT_PUBLIC_API_BASE_URL`) and API client wrapper.
- [x] F3 - Implement auth module: register, login, logout, verify session.
- [x] F4 - Implement route guards and token handling for protected pages.
- [x] F5 - Build catalog listing page with search, filters, and pagination.
- [x] F6 - Build artwork detail page with gallery, metadata, price, and stock status.
- [x] F7 - Implement cart APIs integration: add/update/remove/list cart items.
- [x] F8 - Build cart UI with price summary, validation, and clear error messaging.
- [x] F9 - Implement address module using user profile APIs (CRUD + default address).
- [x] F10 - Build checkout flow to create order with `PENDING` state.
- [x] F11 - Implement order status tracking (`PENDING`, `AWAITING_PAYMENT`, `COMPLETED`, `FAILED`, `CANCELLED`).
- [x] F12 - Integrate payment creation flow and payment result page.
- [x] F13 - Implement polling/refresh strategy for payment and order status synchronization.
- [x] F14 - Build profile page and order history pages (`/orders/me`, `/orders/{orderId}`).
- [x] F15 - Add reusable loading skeletons, empty states, and global error boundary.
- [x] F16 - Add client-side validation and server error mapping for all critical forms.
- [x] F17 - Add frontend tests for core flows (auth, catalog, cart, checkout, payment).
- [x] F18 - Run end-to-end smoke scenario against local backend stack.
- [x] F19 - Update `frontend/README.md` with setup, env, scripts, and integration flow.

## Backend Coordination Tasks (mandatory)

- [x] C1 - Align auth contract with `auth-service` owner (`anhlt`): token shape, verify behavior, auth errors.
- [x] C2 - Align profile/address contract with `user-profile-service` owner (`anhlt`): payload validation and default address rule.
- [x] C3 - Align catalog contract with `catalog-service` owner (`datlt`): list/detail/filter response schema.
- [x] C4 - Align stock display contract with `inventory-service` owner (`datlt`): availability and out-of-stock behavior.
- [x] C5 - Align cart/order contract with `order-service` owner (`tuanhm`): cart item schema, order creation payload, status transitions.
- [x] C6 - Align payment contract with `payment-service` owner (`vubn`): payment states, success/failed handling, retry rules.
- [x] C7 - Confirm gateway route mapping and local integration path with root owner (`phucth`).
- [x] C8 - Verify API change process: OpenAPI update + team announcement before merge.

## Acceptance Criteria

- End-user can complete happy path: login -> browse artworks -> add cart -> checkout -> payment -> order completed.
- Frontend handles failure paths correctly (inventory failed, payment failed, unauthorized token).
- All integrated pages use real backend APIs via gateway without hardcoded mock data.
- UI is responsive and stable on desktop/mobile.
- Frontend README and API integration notes are complete and easy to run locally.

## Mandatory System Notes

- Frontend must follow backend contracts in `system-analysis-design.md` and `project.md`.
- Error handling must surface `correlationId` for support/debug tracing.
- No sensitive data (token/secrets) in logs or client-side persistent storage beyond required session handling.
- Any contract mismatch must be resolved by syncing with service owner before frontend merge.
