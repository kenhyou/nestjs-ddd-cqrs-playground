# Phase 1 — Domain Discovery

> Source: PRD (order-management-basic), Tier: Basic

---

## 1. Actors

| 역할 | 설명 |
|------|------|
| **Customer** (Primary) | 주문을 생성하고 상태를 확인하는 주요 사용자 |

---

## 2. Domain Events

| 이벤트 | 트리거 |
|--------|--------|
| `OrderPlaced` | 새 주문이 PENDING 상태로 시스템에 등록됨 |
| `ItemAddedToOrder` | PENDING 상태에서 아이템이 추가됨 |
| `OrderConfirmed` | 주문이 이행을 위해 확정됨 |
| `OrderCancelled` | 배송 전 주문이 취소됨 |
| `OrderShipped` | 주문이 배송 상태로 전환됨 (상태 플래그) |

---

## 3. KPIs

N/A (학습 프로젝트)

---

## 4. Differentiation

N/A (학습 프로젝트)

---

## 5. Out of Scope

- 결제 처리
- 실제 배송 / 배송사 연동
- 재고 또는 재고 예약
- 인증/인가
- 알림
- 통계/분석

---

## 6. State Machine

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

---

## 7. Business Rules

1. 주문은 최소 1개 이상의 아이템을 가져야 확정 가능
2. CONFIRMED/SHIPPED 상태에서는 아이템 추가/제거 불가
3. SHIPPED 상태에서는 취소 불가
4. OrderItem은 반드시 Order를 통해서만 조작
5. 주문 총액은 아이템 변경 시마다 재계산
