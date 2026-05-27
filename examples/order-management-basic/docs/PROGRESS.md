# Order Management Basic — Progress

## Phase -1: Domain Design
- [x] Strategic Design (`docs/strategic-design/STRATEGIC.md`)
- [x] Tactical Design (`docs/DESIGN.md`)

## Phase 0: NestJS Project Setup
- [x] `nest new` 실행, 디렉토리 구조 생성
- [x] TypeORM, SQLite 의존성 설치

## Phase 1: Domain Layer
- [x] `OrderId`, `OrderItemId` VO 작성 및 테스트
- [x] `Money` VO 작성 및 테스트
- [x] `OrderStatus` enum 작성
- [x] `OrderItem` Entity 작성
- [x] `Order` Aggregate Root 작성 (`create`, `reconstitute`, 상태 전이 메서드)
- [x] Domain 단위 테스트 (NestJS/TypeORM import 없이)

## Phase 2: Application Layer
- [x] Command / Query 클래스 작성
- [x] Command Handler 작성 (CreateOrder, AddItem, ConfirmOrder, CancelOrder, ShipOrder)
- [x] Query Handler 작성 (GetOrder)
- [x] Repository Port (abstract class) 작성
- [x] Query Port (abstract class) 작성

## Phase 3: Infrastructure Layer
- [x] TypeORM Entity 작성
- [x] Mapper 작성 (Domain ↔ ORM)
- [x] TypeORM Repository 구현체 작성 (OrderRepository, OrderQuery)

## Phase 4: Presenter Layer
- [x] DTO 작성
- [x] Controller 작성

## Phase 5: Module 조립
- [x] `OrderModule` 작성 (Port ↔ 구현체 바인딩)
- [x] `AppModule` 연결

## Phase 6: E2E 테스트
- [x] Happy-path e2e 테스트
- [x] 불변식 위반 e2e 테스트 (SHIPPED 상태에서 cancel 시도)

## Basic Pass Criteria 체크
- [x] VO/Aggregate Root 테스트에 NestJS/TypeORM import 없음
- [x] Happy-path e2e 1개 이상
- [x] 불변식 위반 e2e 1개 이상
- [x] Query Handler에서 `reconstitute()` 미호출
- [x] Aggregate 경계와 불변식을 한 문장으로 설명 가능
  - **답변**: Order Aggregate는 Order와 OrderItem을 함께 보호하며, Order에는 하나 이상의 OrderItem이 있어야 한다.
