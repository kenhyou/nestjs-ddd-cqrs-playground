# Strategic Design — Order Management (Basic Tier)

> Status: 완료

---

## 1. Domain Discovery

**Domain**: Order Management (Basic Tier)
**Actors**: Customer (Primary)
**Tier**: Basic — Single Aggregate Root, linear state machine, single BC

**Domain Events**: OrderPlaced / ItemAddedToOrder / OrderConfirmed / OrderCancelled / OrderShipped

**State Machine**:
```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

**Out of Scope**: 결제, 실제 배송, 재고 예약, 인증/인가, 알림, 통계

→ 상세: [01-discovery.md](01-discovery.md)

---

## 2. Subdomain Classification

| 서브도메인 | 분류 | 비고 |
|-----------|------|------|
| Order Lifecycle | Core | 주문 생성, 확정, 취소 |
| Order Item Composition | Core | 항목 구성 규칙 |
| Order State Transition | Supporting | Core를 보조하는 상태 전이 |
| Order Total Calculation | Generic | 범용 산술 연산 |

→ 상세: [02-subdomains.md](02-subdomains.md)

---

## 3. Bounded Contexts

**단일 BC: Order Management**

```
Order Management BC
└── Order (Aggregate Root)
    └── OrderItem (Child Entity)
```

- 불변식("아이템 1개 이상", "CONFIRMED 후 수정 불가")은 Order Aggregate가 단독으로 보호
- `OrderItem`은 반드시 `Order`를 통해서만 조작
- `customerId`: Basic Tier에서 단순 string 처리 (CustomerPort 미선언)

→ 상세: [03-bounded-contexts.md](03-bounded-contexts.md)

---

## 4. Context Map

**BC 간 관계**: 없음 (단일 BC)

**외부 관계**:

| 관계 | 패턴 |
|------|------|
| Client → Order BC | Open Host Service + Published Language |
| Order BC → Inventory/Payment/Shipment | Customer/Supplier + ACL (Intermediate 이후) |
| Order BC → Notification | Separate Ways |

→ 상세: [04-context-map.md](04-context-map.md)

---

## 5. Ubiquitous Language

**핵심 용어**:
- **Order**: 공식 접수된 구매 의사 — 장바구니가 아님
- **Confirmation**: 운영 측 이행 결정 — 결제나 고객의 내역 조회가 아님
- **Cancellation**: PENDING/CONFIRMED에서만 가능한 이행 중단 — 환불/반품 아님
- **Shipped**: 출고 진입 상태 플래그 — 물리적 배송 완료가 아님

**같은 단어, 다른 의미 주의**: "취소", "확인"

→ 상세: [05-ubiquitous-language.md](05-ubiquitous-language.md)

---

## 6. Reflection

**What changed in my thinking**

- **맞은 추측**: Order를 BC로 보는 것은 맞았다.
- **바뀐 추측**: OrderItem을 독립적인 BC로 생각했으나, Order의 일부(Child Entity)로 포함되었다. OrderItem은 Order 없이 독립적으로 존재할 수 없으며, 불변식("CONFIRMED 후 수정 불가" 등)을 원자적으로 보호하려면 같은 트랜잭션 경계 안에 있어야 한다는 것을 배웠다.
- **가장 큰 배움**: 설계 단계에서 Domain Expert, Solution Architect, Tech Lead, Product Owner 각 역할의 입장이 다르다는 것을 알게 되었다. 같은 문제를 바라보는 시각이 다르고, 그 차이에서 더 나은 설계가 나온다.
