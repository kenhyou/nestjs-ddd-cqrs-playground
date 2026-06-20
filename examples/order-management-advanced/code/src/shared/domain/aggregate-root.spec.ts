import { AggregateRoot } from '@shared/domain/aggregate-root';
import { DomainEvent } from '@shared/domain/domain-event';

class TestAggregate extends AggregateRoot {
  save(event: DomainEvent): void {
    this.record(event);
  }
}

class TestEvent extends DomainEvent {
  readonly eventType = 'TestEvent';

  constructor(private readonly value: string) {
    super();
  }

  payload(): Record<string, unknown> {
    return {
      value: this.value,
    };
  }
}

describe('AggregateRoot', () => {
  it('should record events in order', () => {
    const aggregate = new TestAggregate();
    const e1 = new TestEvent('1');
    const e2 = new TestEvent('2');
    aggregate.save(e1);
    aggregate.save(e2);
    const events = aggregate.pullEvents();
    expect(events).toEqual([e1, e2]);
  });

  it('should pull events and clear the internal list', () => {
    const aggregate = new TestAggregate();
    const e1 = new TestEvent('1');
    const e2 = new TestEvent('2');
    aggregate.save(e1);
    aggregate.save(e2);
    aggregate.pullEvents();
    expect(aggregate.pullEvents()).toEqual([]);
  });

  it('returns a copy — mutating the result does not affect internal state', () => {
    const aggregate = new TestAggregate();
    const e1 = new TestEvent('1');
    aggregate.save(e1);
    const pulled = aggregate.pullEvents();
    pulled.push(new TestEvent('rogue'));

    const e2 = new TestEvent('2');
    aggregate.save(e2);
    expect(aggregate.pullEvents()).toEqual([e2]);
  });
});
