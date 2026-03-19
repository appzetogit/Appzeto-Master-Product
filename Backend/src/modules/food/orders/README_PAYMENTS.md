# Food order payments — dual storage

## `food_orders` (FoodOrder)

- Field **`payment`** is a **denormalized snapshot** (`method`, `status`, `amountDue`, `razorpay`, `qr`, …).
- Keeps existing APIs and mobile/web clients unchanged.

## `food_order_payments` (FoodOrderPayment)

- **Append-only ledger** (one row per business event).
- Indexed by `orderId` + `createdAt` for history queries.

### Event kinds (`kind`)

| Kind | When |
|------|------|
| `order_placed` | After order is saved |
| `razorpay_order_created` | Razorpay order id issued |
| `online_payment_verified` | User verify-payment succeeds |
| `cod_collect_qr_created` | Partner generates COD collection link |
| `cod_marked_paid_on_delivery` | COD → `paid` on complete delivery |
| `payment_snapshot_sync` | Other delivery-complete payment sync (e.g. already prepaid) |
| `refund_*` | Reserved for future refund flows |

## Code map

| File | Role |
|------|------|
| `foodOrderPayment.model.js` | Mongoose schema + indexes |
| `foodOrderPayment.service.js` | `recordFoodOrderPaymentEvent`, `listFoodOrderPaymentsForUser` |
| `order.service.js` | `appendOrderPaymentLedger()` + hooks in create / verify / delivery / QR |
| `order.routes.user.js` | `GET /:orderId/payments` (auth) |

## API

- **`GET /v1/food/orders/:orderId/payments`** (USER JWT, same as other food order routes)  
  Returns `{ orderId, orderMongoId, payments: [...] }` for the authenticated customer.
