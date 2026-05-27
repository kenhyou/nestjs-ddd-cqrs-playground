# BC 경계 토론 — Order vs OrderItem 분리 여부

> Phase 3 토론 기록

---

## 쟁점

OrderItem을 Order와 같은 BC에 둘 것인가, 별도 BC로 분리할 것인가?

## 역할별 입장

| 역할 | 입장 | 핵심 근거 |
|------|------|-----------|
| Domain Expert | 단일 BC | 동일 언어 공동체, OrderItem은 Order 없이 의미 없음 |
| Solution Architect | 단일 BC | 불변식(아이템 1개 이상, CONFIRMED 후 수정 불가)은 같은 트랜잭션 경계에서만 강제 가능 |
| Tech Lead | 단일 BC | 분리 시 forwardRef 순환 의존 위험, 운영 오버헤드 증가 |
| Product Owner | 단일 BC | 같은 팀, 같은 릴리스 주기 — 분리하면 릴리스 결합만 생김 |

## 사용자 최종 결정

**단일 BC (Order Management)**

> "OrderItem은 Order라고 하는 경계 내에서 관리되는 것이 맞다고 생각합니다."

## 부가 학습 포인트

- `forwardRef()`는 NestJS 문법이지만, 그 정신은 DDD의 BC 단방향 의존 원칙을 코드 레벨에서 구체화한 것
- `Item`이라는 어휘는 미래 Inventory/Catalog BC와 충돌 가능 — 언어 경계 인식 필요
