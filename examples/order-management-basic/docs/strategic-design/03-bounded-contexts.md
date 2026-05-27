# Phase 3 — Bounded Context Identification

---

## 최종 BC 구성 (사용자 결정)

| BC 이름 | 분류 | 책임 |
|---------|------|------|
| **Order Management** | Core | 주문 생성, 아이템 구성, 상태 전이, 총액 계산 |

---

## 내부 구조

```
Order Management BC
└── Order (Aggregate Root)
    └── OrderItem (Child Entity)
```

- `OrderItem`은 `Order`를 통해서만 조작된다 — 외부에서 직접 접근 불가
- 상태 전이(PENDING → CONFIRMED → SHIPPED / CANCELLED)는 Order Aggregate 내부에서 보호
- 총액 계산은 아이템 변경 시마다 Order 내부에서 재계산

---

## 사용자 결정 근거

> "OrderItem은 Order라고 하는 경계 내에서 관리되는 것이 맞다고 생각합니다."

4개 역할 전원이 단일 BC를 권장한 핵심 이유:
- 불변식("아이템 1개 이상", "CONFIRMED 후 수정 불가")은 같은 트랜잭션 경계 안에서만 원자적으로 강제 가능
- 분리 시 BC 간 순환 의존 발생 → `forwardRef()` 필요 → 설계 안티패턴

---

## 어휘 경계 주의사항

- `Item`: 이 BC에서는 "특정 Order에 속한 주문 행"을 의미
- 미래 Inventory/Catalog BC에서 `Item`은 "재고 단위" 또는 "상품 마스터"를 의미 — 언어 충돌 주의

---

## 토론 기록

→ [debates/bc-boundary-order-item.md](debates/bc-boundary-order-item.md)
