import type {
  PaymentGateway,
  PaymentIntent,
} from "../ports/payment-gateway.js";
import type { DomainError } from "../types/domain-error.type.js";
import type { Result } from "../types/result.types.js";
import { err, ok } from "../types/result.types.js";
export class PaymentService {
  private readonly gateway: PaymentGateway;

  constructor(gateway: PaymentGateway) {
    this.gateway = gateway;
  }

  async createPayment(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<PaymentIntent, DomainError>> {
    try {
      const intent = await this.gateway.createPaymentIntent({
        amount,
        currency,
        metadata,
      });
      return ok(intent);
    } catch (e) {
      return err({ type: "Unknown", message: (e as Error).message });
    }
  }

  async confirmPayment(
    paymentIntentId: string
  ): Promise<Result<PaymentIntent, DomainError>> {
    try {
      const intent = await this.gateway.confirmPayment(paymentIntentId);
      return ok(intent);
    } catch (e) {
      return err({ type: "Unknown", message: (e as Error).message });
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<
    Result<{ id: string; amount: number; status: string }, DomainError>
  > {
    try {
      const refund = await this.gateway.refundPayment(paymentIntentId, amount);
      return ok(refund);
    } catch (e) {
      return err({ type: "Unknown", message: (e as Error).message });
    }
  }
}
