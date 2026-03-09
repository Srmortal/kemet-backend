// PaymentGateway interface (port) for payment operations
// No provider-specific types allowed

export interface PaymentIntent {
  amount: number;
  currency: string;
  id: string;
  metadata?: Record<string, unknown>;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "succeeded"
    | "failed"
    | "canceled";
}

export interface PaymentGateway {
  confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<PaymentIntent>;

  refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<{
    id: string;
    amount: number;
    status: "pending" | "succeeded" | "failed";
  }>;
}
