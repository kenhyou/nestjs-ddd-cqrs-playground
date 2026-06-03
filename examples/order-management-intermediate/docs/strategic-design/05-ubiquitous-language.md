# Phase 5 — Ubiquitous Language

**Decision date**: 2026-05-29

## BC-1: Order — Glossary

| Term | Identifier | Meaning | Used as |
|---|---|---|---|
| Order | `Order` | The unit in which a customer registers the intent to buy goods in the system. The Aggregate Root that holds the entire lifecycle. | Aggregate Root |
| Order Item | `OrderItem` | An individual product line inside an Order. Cannot exist independently outside the Order. | Entity (owned by Order) |
| Order Status | `OrderStatus` | One of four states: PENDING / CONFIRMED / SHIPPED / CANCELLED. Indicates where the Order currently is. | VO (enum) |
| Order Total | `OrderTotal` | The sum of `price × quantity` over all OrderItems. Recomputed only inside the Order. | Computed property or `Money` VO |
| Cancel Order | `cancelOrder` / `OrderCancelled` | The act by which a customer or Operator withdraws the order intent before fulfillment. Allowed only from PENDING or CONFIRMED. | State-transition method / Domain Event |
| Confirm Order | `confirmOrder` / `OrderConfirmed` | The act by which the Customer confirms the order as a target for fulfillment. PENDING → CONFIRMED. (Interpretation A decided) | State-transition method / Domain Event |
| Ship | `shipOrder` / `OrderShipped` | Records that the goods have left the warehouse. CONFIRMED → SHIPPED. A status flag in this tier. | State-transition method / Domain Event |
| Shippability | `isReadyToShip` | A property that judges, from the Order's perspective, whether the Order may transition to the shipping stage. A concept that translates Payment vocabulary into Order language. | Derived property |

## BC-2: Payment — Glossary

| Term | Identifier | Meaning | Used as |
|---|---|---|---|
| Payment | `Payment` | A single payment attempt made for a specific Order. The Aggregate Root holding payment method, amount, and status. | Aggregate Root |
| Request Payment | `requestPayment` / `PaymentRequested` | The act of starting payment processing after the Order is confirmed. Enters the REQUESTED state. | State-transition method / Domain Event |
| Payment Succeeded | `PaymentSucceeded` | The event where the payment is actually approved. REQUESTED → SUCCEEDED. | Domain Event |
| Payment Failed | `PaymentFailed` | The event where the payment is rejected or ends in error. REQUESTED → FAILED. In this scope, a pre-approval cancellation (void) is also expressed as this state. | Domain Event |
| Refund | `issueRefund` / `RefundIssued` | A state transition allowed only on a Payment in the SUCCEEDED state. The event where money returns to the customer. SUCCEEDED → REFUNDED. | State-transition method / Domain Event |
| Payment Status | `PaymentStatus` | One of four states: REQUESTED / SUCCEEDED / FAILED / REFUNDED. | VO (enum) |
| Order Reference | `orderId` | The value identifying which Order a Payment is linked to. A plain ID column, with no direct reference to the Order object. | Plain column |

## Polysemy Map

Makes explicit the cases where the same word is used with a different meaning in the two BCs.

| Word | Meaning in Order BC | Meaning in Payment BC | Recommended naming |
|---|---|---|---|
| **Cancel** | The business act of withdrawing the entire order intent. Initiated by a customer or Operator command. | The act of stopping a transaction before payment approval (industry term: void). In this project it is absorbed into `PaymentFailed`. | Order: `cancelOrder` / `OrderCancelled` <br/> Payment: no separate "cancel" state — FAILED covers this meaning |
| **Refund** | Knows only the *causal relationship* "a flow that reverses a paid order." Distinct from the Order CANCELLED event. | A state transition allowed only on a SUCCEEDED Payment. A monetary-return act. **Payment owns this word.** | Order: only receives the `RefundIssued` event; no `refund` method inside Order <br/> Payment: `issueRefund` / `RefundIssued` |
| **Approve** | The Customer "confirming" the order (`OrderConfirmed`). | The card company or PSP "approving" the amount (`PaymentSucceeded`). A mechanical result. | Order: `confirm` / Payment: `succeed`. Do not mix the two words. |

## Anti-Vocabulary

### Must not appear inside the Order BC

`PaymentStatus`, `PaymentRequested`, `PaymentFailed`, `PaymentSucceeded`, `REFUNDED`, `issueRefund`.

→ Order does not know Payment's internal states. When Payment vocabulary is needed, it enters translated through a Port.

### Must not appear inside the Payment BC

`OrderStatus`, `OrderItem`, `OrderTotal`, `confirmOrder`, `shipOrder`.

→ Payment does not know Order's fulfillment flow. It holds only the `orderId` identifier.

### Translation Vocabulary Rule

`PaymentSucceeded` (Payment language) → **`isReadyToShip`** (Order language).

- Moving the Payment-language statement "the payment succeeded" into Order language yields "this order now meets the conditions to transition to shipping."
- `PaymentStatusQueryPort` is the boundary of this translation.
- The Port's return type is not Payment's `PaymentStatus` enum but a read model defined on the Order side, or a boolean domain concept.

## Event Naming Notes

| Event | Publishing BC | Note |
|---|---|---|
| `OrderPlaced` | Order | Natural. The event "an order was received." |
| `OrderConfirmed` | Order | Order-BC only. If this name appears in the Payment BC, raise an alarm immediately. |
| `OrderCancelled` | Order | An expression of Customer/Operator intent. Not a financial event. |
| `OrderShipped` | Order | Published by Order in this Intermediate tier only. **In the Advanced tier it may be split into `ShipmentDispatched` (Shipment BC)** — be conscious of this from now. |
| `PaymentRequested` | Payment | Payment-BC only. |
| `PaymentSucceeded` | Payment | Payment-BC only. Order can know it only through the Port. |
| `PaymentFailed` | Payment | Payment-BC only. Includes the void (pre-approval cancellation) meaning. |
| `RefundIssued` | Payment | The passive past tense "Issued" matches the field language. The event of a completed refund. |

## Cross-Cutting Vocabulary Rules

1. **Event names use only the publishing BC's vocabulary**: `Order*` belongs to the Order BC, `Payment*` / `Refund*` to the Payment BC. When another BC receives an event, it translates it into its own language.
2. **A Port's return type uses the caller BC's vocabulary**: `PaymentStatusQueryPort` does not return `PaymentStatus` as-is but converts it to Order's read model.
3. **Polysemous words are named separately per BC**: even for the same word ("cancel", "refund", "approve"), the English identifier differs per BC.
4. **State enums stay inside their BC**: neither `OrderStatus` nor `PaymentStatus` may be exposed outside its own BC.
