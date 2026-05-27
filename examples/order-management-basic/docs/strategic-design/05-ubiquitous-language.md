# Phase 5 — Ubiquitous Language

> BC: Order Management (Basic Tier)

---

## Core Terms

| Term | Definition | Caution: NOT ~ |
|------|------------|----------------|
| **Order** | A customer's purchase intent that has been officially received by the system. Tracked and managed by this BC from the moment of creation. | A shopping cart, a purchase intention |
| **OrderItem** | An individual product line contained inside an Order. Cannot exist independently without an Order. | An entity that exists independently outside an Order |
| **Confirmation** | A decision by operations to fulfill the order. Only applicable from PENDING. | Payment, a customer's order lookup |
| **Cancellation** | The act of halting fulfillment. Only possible from PENDING or CONFIRMED. | Refund or return (concepts outside this BC) |
| **Shipped** | A status flag meaning shipping has been dispatched. The terminal state for this BC. | Physical delivery completion, customer-receipt confirmation |

---

## Business Meaning of Domain Events

| Event | Meaning |
|-------|---------|
| **OrderPlaced** | The customer's purchase intent has been officially received. From this moment the Order becomes a trackable subject. |
| **ItemAddedToOrder** | An item was added to a PENDING order. The order total has changed. |
| **OrderConfirmed** | A fulfillment decision has been made. Customer-initiated modifications are no longer allowed. |
| **OrderCancelled** | Fulfillment has been halted. No further fulfillment action will be taken on this order. |
| **OrderShipped** | Shipping has been dispatched. No further state transitions occur in this BC. Cancellation is not allowed. |

---

## Same-Word-Different-Meaning

| Word | Meaning Inside This BC | Meaning Outside / In Everyday Language |
|------|------------------------|-----------------------------------------|
| **Cancel (Cancellation)** | A state transition allowed only from PENDING/CONFIRMED | A broader notion that also includes post-shipping returns and refund requests |
| **Confirm** | An operational fulfillment decision (OrderConfirmed) | A customer looking up or verifying their order |

---

## Frequently Confused Terms

| Confused Pair | How to Distinguish |
|---------------|--------------------|
| **Order vs. OrderItem** | "Modifying an order" almost always means adding/removing OrderItems. Outside of PENDING, items cannot be changed. |
| **Shipped vs. Delivered** | In this BC, SHIPPED is the terminal state. It is not distinguished from customer receipt (Delivered) — an intentional simplification in the Basic Tier. |

---

## Code Naming Guide

| Business Language | Code Identifier |
|-------------------|------------------|
| Create order | `Order.create()` |
| Restore order (from DB) | `Order.reconstitute()` |
| Confirm order | `order.confirm()` |
| Cancel order | `order.cancel()` |
| Ship order | `order.ship()` |
| Add item | `order.addItem()` |
| Remove item | `order.removeItem()` |
| Get total | `order.getTotalPrice()` |
