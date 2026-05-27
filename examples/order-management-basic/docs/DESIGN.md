# Order Management Basic — Domain Design

## Domain Overview

고객이 주문을 생성하고 아이템을 추가하며, 배송 전에는 취소 신청할 수 있는 주문 관리 시스템.

**핵심 시나리오**:
- 고객이 주문을 생성하고 아이템을 추가한다
- 주문이 배송 전이면 취소할 수 있다
- 주문을 확정하고 배송 처리한다

---

## Aggregate / Entity

| 이름 | 종류 | 책임 |
|------|------|------|
| **Order** | Aggregate Root | 주문의 상태와 아이템을 관리한다 |
| **OrderItem** | Child Entity (Order 소유) | 아이템의 속성을 관리한다 |

---

## Value Objects

| VO | 포함하는 값 | 검증 규칙 |
|----|-------------|-----------|
| `OrderId` | string (UUID) | 유효한 UUID |
| `OrderItemId` | string (UUID) | 유효한 UUID |
| `Money` | amount, currency | 음수 불가, 동일 통화 간 연산, 아이템 합산 |

---

## State Transitions

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

| 전이 | 조건 |
|------|------|
| PENDING → CONFIRMED | 아이템 최소 1개 이상 |
| PENDING → CANCELLED | 없음 |
| CONFIRMED → SHIPPED | 없음 |
| CONFIRMED → CANCELLED | 없음 |
| SHIPPED → (any) | 불가 — 최종 상태 |

---

## Use Cases

| Action | Type | Input | Output |
|--------|------|-------|--------|
| 주문 생성 | Command | customerId, items | void |
| 아이템 추가 | Command | OrderId, item | void |
| 주문 확정 | Command | OrderId | void |
| 주문 취소 | Command | OrderId | void |
| 배송 처리 | Command | OrderId | void |
| 주문 확인 | Query | OrderId | Order |

---

## Expected API Endpoints

| Method | Path | Use Case |
|--------|------|----------|
| POST | `/orders` | 주문 생성 |
| POST | `/orders/:id/items` | 아이템 추가 |
| POST | `/orders/:id/confirm` | 주문 확정 |
| POST | `/orders/:id/cancel` | 주문 취소 |
| POST | `/orders/:id/ship` | 배송 처리 |
| GET | `/orders/:id` | 주문 확인 |

---

## Aggregate Decisions

| Aggregate Root | 한 트랜잭션에서 보호하는 불변식 | 이 경계인 이유 |
|----------------|-------------------------------|----------------|
| Order | (1) 확정 시 아이템 최소 1개 이상 (2) 총액 = 아이템 가격 합산 (변경 시마다 자동 유지) | OrderItem은 Order 없이 존재하지 않음. 불변식을 원자적으로 보호하려면 같은 트랜잭션 경계 안에 있어야 함 |

---

## Consistency Boundaries per Use Case

| Use Case | 수정되는 Aggregate | 일관성 종류 | 비고 |
|----------|--------------------|-------------|------|
| 주문 생성 | Order | strong | 단일 Aggregate, 단일 트랜잭션 |
| 아이템 추가 | Order | strong | 단일 Aggregate, 단일 트랜잭션 |
| 주문 확정 | Order | strong | 상태 전이 + 총액 재계산 |
| 주문 취소 | Order | strong | 상태 전이만 |
| 배송 처리 | Order | strong | 상태 전이만 |
| 주문 확인 | — | — | Query, Aggregate 수정 없음 |
