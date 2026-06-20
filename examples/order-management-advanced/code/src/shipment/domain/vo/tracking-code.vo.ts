export class TrackingCode {
  private constructor(private readonly value: string) {}

  static create(trackingCode: string): TrackingCode {
    if (!trackingCode || trackingCode.trim().length === 0) {
      throw new Error('Invalid tracking code');
    }
    return new TrackingCode(trackingCode);
  }

  equals(other: TrackingCode): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
