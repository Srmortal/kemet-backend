import { PaymentGateway, PaymentIntent } from '../ports/payment-gateway';

export class PaymentService {
  private gateway: PaymentGateway;

  constructor(gateway: PaymentGateway) {
    this.gateway = gateway;
  }

  async createPayment(amount: number, currency: string, metadata?: Record<string, unknown>): Promise<PaymentIntent> {
    if (amount <= 0) throw new Error('Invalid amount');
    return this.gateway.createPaymentIntent({ amount, currency, metadata });
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    return this.gateway.confirmPayment(paymentIntentId);
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; amount: number; status: string }> {
    return this.gateway.refundPayment(paymentIntentId, amount);
  }
}
