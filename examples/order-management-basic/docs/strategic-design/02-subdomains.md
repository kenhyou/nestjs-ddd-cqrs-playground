# Phase 2 — Subdomain Classification

---

## 최종 분류 (사용자 결정)

| 서브도메인 | 분류 | 설명 |
|-----------|------|------|
| **Order Lifecycle** | Core | 주문 생성, 확정, 취소 — 비즈니스 가치의 핵심 |
| **Order Item Composition** | Core | 주문 항목 구성 규칙 — 서비스 신뢰도를 좌우하는 항목 변경 정책 |
| **Order State Transition** | Supporting | 상태 전이 규칙 — Core를 올바르게 실행하기 위한 보조 역할 |
| **Order Total Calculation** | Generic | 총액 계산 — 범용 산술 연산 |

---

## 결정 근거

1. **OrderItem은 별도 서브도메인**: 항목 구성 규칙(확정 전 변경 허용, 확정 후 변경 불가)은 독립적인 관심사로 분리.
2. **State Transition은 Supporting**: 상태 전이 자체는 사용자가 서비스를 선택하는 이유가 아닌 보조 역할.

---

## 토론 주요 쟁점

- Domain Expert: OrderItem은 Order의 내부 언어이므로 별도 서브도메인 불필요
- Product Owner: OrderItem 구성 규칙이 서비스 신뢰도를 좌우하므로 Core로 분리 필요
- 사용자 최종 결정: **별도 서브도메인으로 분리**
