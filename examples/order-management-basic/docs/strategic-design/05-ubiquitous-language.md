# Phase 5 — Ubiquitous Language

> BC: Order Management (Basic Tier)

---

## 핵심 용어

| 용어 | 정의 | 주의: ~가 아님 |
|------|------|---------------|
| **Order** | 고객의 구매 의사가 시스템에 공식 접수된 것. 생성 순간부터 이 BC에서 추적·관리됨 | 장바구니, 구매 의향 |
| **OrderItem** | Order 안에 포함된 개별 상품 단위. Order 없이 독립 존재 불가 | Order 밖에서 독립적으로 존재하는 개체 |
| **Confirmation** | 운영 측이 이행하겠다고 내린 의사 결정. PENDING 상태에서만 적용 | 결제, 고객의 주문 내역 조회 |
| **Cancellation** | 이행을 중단하는 행위. PENDING 또는 CONFIRMED에서만 가능 | 환불, 반품 (이 BC 밖의 개념) |
| **Shipped** | 출고 처리가 완료된 상태 플래그. 이 BC의 최종 상태 | 물리적 배송 완료, 고객 수령 확인 |

---

## 도메인 이벤트의 비즈니스적 의미

| 이벤트 | 의미 |
|--------|------|
| **OrderPlaced** | 고객의 구매 의사가 공식 접수됨. 이 순간부터 Order는 추적 가능한 대상이 됨 |
| **ItemAddedToOrder** | PENDING 상태의 주문에 항목이 추가됨. 주문 총액이 변경됨 |
| **OrderConfirmed** | 이행 결정이 내려짐. 이후 고객의 임의 변경 불가 영역으로 진입 |
| **OrderCancelled** | 이행이 중단됨. 이 주문에 대한 이행 행위는 더 이상 없음 |
| **OrderShipped** | 출고 처리 완료. 이 BC에서 이후 상태 전이 없음. 취소 불가 |

---

## 같은 단어, 다른 의미 (Same-Word-Different-Meaning)

| 단어 | 이 BC 안의 의미 | BC 밖 / 일상 언어의 의미 |
|------|----------------|--------------------------|
| **취소 (Cancellation)** | PENDING/CONFIRMED에서만 허용되는 상태 전이 | 배송 후 반품, 환불 요청까지 포함하는 광의의 취소 |
| **확인 (Confirm)** | 운영 측의 이행 의사 결정 (OrderConfirmed) | 고객이 주문 내역을 조회·확인하는 행위 |

---

## 자주 혼동되는 용어

| 혼동 쌍 | 구분 기준 |
|---------|-----------|
| **Order vs. OrderItem** | "주문 수정"이라고 할 때 실제 의미는 거의 항상 OrderItem 추가/제거. PENDING이 아닌 상태에서는 항목 변경 불가 |
| **Shipped vs. Delivered** | 이 BC에서 SHIPPED는 최종 상태. 고객 수령(Delivered)과 구분 없음 — Basic Tier의 의도적 단순화 |

---

## 코드 네이밍 가이드

| 비즈니스 언어 | 코드 식별자 |
|--------------|-------------|
| 주문 생성 | `Order.create()` |
| 주문 복원 (DB에서) | `Order.reconstitute()` |
| 주문 확정 | `order.confirm()` |
| 주문 취소 | `order.cancel()` |
| 주문 출고 | `order.ship()` |
| 항목 추가 | `order.addItem()` |
| 항목 제거 | `order.removeItem()` |
| 총액 조회 | `order.getTotalPrice()` |
