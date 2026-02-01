// PaymentGateway interface (port) for payment operations
// No provider-specific types allowed

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'failed' | 'canceled';
  metadata?: Record<string, unknown>;
}

export interface PaymentGateway {
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentIntent>;

  confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;

  refundPayment(paymentIntentId: string, amount?: number): Promise<{
    id: string;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed';
  }>;
}
