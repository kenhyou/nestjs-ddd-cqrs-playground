---
name: Inventory Management
slug: inventory-management
core-aggregates: [Product, Stock, StockMovement, Warehouse]
learning-focus: Stock movement history, concurrency control, multi-warehouse stock reservation
---

# Inventory Management

## Overview

A system for registering Products and managing Stock per Warehouse. Stock changes such as replenishment, release, and adjustment are recorded as StockMovements so they can be traced. Higher tiers introduce concurrency control, transfers between warehouses, and stock reservation Saga patterns integrated with an order system.

DDD learning value: movement-history modeling, Quantity value objects with non-negative validation, concurrency-control choices such as optimistic versus pessimistic locking, and an advanced distributed-transaction pattern through stock reservation Saga.

## Universal Actors

- **Primary**: Warehouse manager who records stock in/out and checks stock levels.
- **Secondary**: System actor that receives stock-reservation requests from an order domain.

## Universal Domain Events

- ProductRegistered: a product master was registered.
- StockReplenished: stock was received.
- StockReleased: stock was shipped or consumed.
- StockAdjusted: physical inventory count adjusted stock.
- LowStockWarned: stock fell below threshold.
- StockReserved: stock was reserved by an order.
- StockReservationConfirmed: reservation was confirmed and stock was released.
- StockReservationCancelled: reservation was cancelled and available stock restored.
- StockTransferStarted: transfer between warehouses started.
- StockTransferCompleted: transfer between warehouses completed.
- WarehouseRegistered: a warehouse was registered.

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, linear state transition, basic VO pattern.

**Scope**: One Product Aggregate Root. Replenish, release, and adjust current stock quantity without movement history. Assume a single warehouse.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Warehouse manager
   - Secondary: N/A

2. **Domain Events (5-6)**:
   - ProductRegistered
   - StockReplenished
   - StockReleased
   - StockAdjusted
   - LowStockWarned

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - StockMovement history
   - Multiple warehouses
   - Concurrency control
   - Order integration and stock reservation
   - Notifications
   - Authentication/authorization
   - Statistics/analytics

### Suggested BC Candidate

- **Single BC**: `Product Inventory` -- product master plus current stock quantity.

### Key Learning Goals

- VO pattern: `ProductId`, `Quantity` with non-negative validation, and `Sku` format validation.
- Aggregate Root state transitions: `replenish(qty)`, `release(qty)`, `adjustTo(qty)`.
- Domain methods on Quantity such as add and subtract.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 1 BC, movement history, Domain Service.

**Scope**: Product and StockMovement Aggregates. Record StockMovement history whenever stock changes. Single warehouse. Learn optimistic locking.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Warehouse manager
   - Secondary: Auditor who reviews movement history

2. **Domain Events (7-8)**:
   - ProductRegistered
   - StockReplenished
   - StockReleased
   - StockAdjusted
   - LowStockWarned
   - StockMovementRecorded
   - StockMovementReversed

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Multiple warehouses
   - Order integration and stock reservation Saga
   - Notifications
   - Authentication/authorization
   - Statistics/analytics

### Suggested BC Candidates

- **Single BC**: `Inventory Management` -- Product and StockMovement collaborate in the same BC.
  - Product is the root for current stock.
  - StockMovement is an independent append-only Aggregate.
  - This is Aggregate separation, not BC separation.

### Key Learning Goals

- Coordinate two Aggregates in one Command Handler while considering transaction boundaries.
- Domain Service: `StockMovementRecorder` records history when Product changes.
- Optimistic locking through a version field on Product.
- Composite VO: `MovementType` enum plus reason code.
- Time-based movement-history queries.

---

## Tier: Advanced

**Target learning pattern**: Multi-BC, Domain Events, stock-reservation Saga, multi-warehouse, Eventual Consistency.

**Scope**: Product, Warehouse, and StockReservation Aggregates across 2-3 BCs. Receive stock-reservation requests from an order system and process them as a Saga. Support transfers between warehouses.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Warehouse manager
   - Secondary: System actor from the order domain
   - Tertiary: Auditor

2. **Domain Events (10-12)**:
   - ProductRegistered
   - WarehouseRegistered
   - StockReplenished
   - StockReleased
   - StockAdjusted
   - StockReserved
   - StockReservationConfirmed
   - StockReservationCancelled
   - StockReservationExpired
   - StockTransferStarted
   - StockTransferCompleted
   - LowStockWarned

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - UI/UX
   - Real external notification delivery; publish domain events only.
   - Authentication, although authorization can be modeled as domain policy.
   - Revenue/accounting integration

### Suggested BC Candidates

- **BC-1: Product Catalog** (Supporting) -- product master data such as SKU, name, and description.
- **BC-2: Warehouse Inventory** (Core) -- available/reserved stock per warehouse and movement history.
- **BC-3: Stock Reservation** (Core) -- reservation Saga: PENDING -> CONFIRMED/CANCELLED/EXPIRED. It may be separate from or combined with Warehouse Inventory depending on autonomy.

### Key Learning Goals

- Publish/subscribe Domain Events with `@nestjs/cqrs` EventBus.
- Saga / Process Manager: reserve stock, then auto-cancel if not confirmed in time.
- Eventual Consistency between Product Catalog and Warehouse Inventory.
- Anti-Corruption Layer when integrating with an external Order BC.
- Multi-Aggregate behavior through events and compensation rather than one large transaction.
- Ubiquitous Language distinction between available stock, reserved stock, and physical stock.
