# Phase 4 — Context Map

---

## 구조 요약

Basic Tier는 단일 BC이므로 BC 간 관계 없음. 외부 시스템은 모두 Out of Scope (mocked).

```
[Client]
    │  Open Host Service (REST API / Published Language)
    ▼
[Order Management BC]
    │          │          │          │
[Identity]  [Inventory] [Payment] [Shipment]
 (mocked)    (mocked)   (mocked)   (mocked)
```

---

## 관계 정의

| 관계 | 패턴 | 처리 방식 |
|------|------|-----------|
| Client → Order BC | Open Host Service + Published Language | REST API, DTO가 Published Language 역할 |
| Order BC → Inventory | Customer/Supplier + ACL (미래) | Intermediate 이후 — 현재 생략 |
| Order BC → Payment | Customer/Supplier + ACL (미래) | Intermediate 이후 — 현재 생략 |
| Order BC → Notification | Separate Ways | 이벤트만 발행, 구독자 없음 |

---

## 사용자 결정

**`customerId`: 단순 string 처리**

- Basic Tier에서 `CustomerPort` 미선언
- Intermediate 전환 시 필요해지면 그때 Port 추가
- 근거: 외부 고객 속성이 Order 도메인으로 유입되지 않는 동안은 ACL 불필요

---

## 미래 확장 시 주의사항

- Inventory/Payment 연동 시 → `application/ports/`에 Port(abstract class) 선언 필요
- `Item` 어휘: 이 BC에서는 "주문 행", Inventory BC에서는 "재고 단위" — ACL에서 번역 필요
