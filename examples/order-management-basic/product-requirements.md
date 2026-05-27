# Product Requirements Document
# Order Management — Basic Tier

## 1. 개요

고객이 주문을 생성하고, 아이템을 추가하며, 주문을 확정하거나 취소할 수 있는 단일 BC 주문 관리 시스템.

**학습 목표 패턴**: 자식 Entity를 포함하는 단일 Aggregate Root, 선형 상태 전이, 기본 VO 패턴.

---

## 2. 범위 (Scope)

### 포함

- `Order` Aggregate Root가 `OrderItem` Entity 컬렉션을 소유
- 주문 생성, 아이템 추가/제거
- 주문 확정 (PENDING → CONFIRMED)
- 주문 취소 (PENDING 또는 CONFIRMED → CANCELLED)
- 배송 상태 플래그 (CONFIRMED → SHIPPED, 실제 배송 연동 없음)

### 제외

- 결제 처리
- 실제 배송 / 배송사 연동
- 재고 또는 재고 예약
- 인증/인가
- 알림
- 통계/분석

---

## 3. 액터 (Actors)

| 역할 | 설명 |
|------|------|
| **Customer** | 주문을 생성하고 상태를 확인하는 주요 사용자 |

---

## 4. 도메인 이벤트 (Domain Events)

| 이벤트 | 트리거 |
|--------|--------|
| `OrderPlaced` | 새 주문이 PENDING 상태로 시스템에 등록됨 |
| `ItemAddedToOrder` | PENDING 상태에서 아이템이 추가됨 |
| `OrderConfirmed` | 주문이 이행을 위해 확정됨 |
| `OrderCancelled` | 배송 전 주문이 취소됨 |
| `OrderShipped` | 주문이 배송 상태로 전환됨 (상태 플래그) |

---

## 5. 상태 머신 (State Machine)

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

- `PENDING`: 초기 상태. 아이템 추가/제거 가능.
- `CONFIRMED`: 확정 상태. 배송 처리 가능.
- `SHIPPED`: 배송 완료 (최종 상태).
- `CANCELLED`: 취소 (최종 상태). PENDING 또는 CONFIRMED에서 전환 가능.

---

## 6. 핵심 비즈니스 규칙

1. 주문은 최소 1개 이상의 아이템을 가져야 확정 가능하다.
2. CONFIRMED 또는 SHIPPED 상태에서는 아이템을 추가/제거할 수 없다.
3. SHIPPED 상태에서는 취소할 수 없다.
4. `OrderItem`은 외부 코드에서 직접 접근하지 않고, 반드시 `Order`를 통해서만 조작한다.
5. 주문 총액(total)은 아이템 변경 시마다 재계산된다.

---

## 7. Value Objects

| VO | 검증 규칙 |
|----|-----------|
| `OrderId` | UUID |
| `OrderItemId` | UUID |
| `Money` | 음수 불가, 동일 통화 간 연산, 아이템 합산 |

---

## 8. BC 구성

| BC | 분류 | 설명 |
|----|------|------|
| **Order Management** | Core | 주문 생성, 상태 머신, 총액 계산 |

---

## 9. 핵심 학습 목표

- Aggregate Root와 자식 Entity: `Order`가 `OrderItem`을 소유; 외부 코드는 `OrderItem`에 직접 접근하지 않음
- Entity별 독립 ID VO: `OrderId` vs `OrderItemId`
- `Money` VO: 음수 불가 검증, 동일 통화 산술, 아이템 합산
- `Order` 상태 머신: PENDING → CONFIRMED → SHIPPED; CANCELLED는 PENDING/CONFIRMED에서 도달 가능
- `create()` vs `reconstitute()` 팩토리 분리 — 새 주문은 PENDING으로 시작, 복원된 주문은 저장된 상태 유지

---

## 10. Discovery Answers (Pre-baked)

1. **Primary/Secondary Users**: Customer / N/A
2. **Domain Events**: OrderPlaced, ItemAddedToOrder, OrderConfirmed, OrderCancelled, OrderShipped
3. **KPIs**: N/A (학습 프로젝트)
4. **Differentiation**: N/A (학습 프로젝트)
5. **Out of Scope**: 결제, 실제 배송, 재고 예약, 인증/인가, 알림, 통계
