import { PaymentGateway, PaymentIntent } from '../../ports/payment-gateway';
import Stripe from 'stripe';

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2025-12-15.clover' });
  }

  async createPaymentIntent(params: { amount: number; currency: string; metadata?: Record<string, string> }): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
    });
    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status as PaymentIntent['status'],
      metadata: intent.metadata,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.confirm(paymentIntentId);
    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status as PaymentIntent['status'],
      metadata: intent.metadata,
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; amount: number; status: 'pending' | 'succeeded' | 'failed' }> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
    });
    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status as 'pending' | 'succeeded' | 'failed',
    };
  }
}
