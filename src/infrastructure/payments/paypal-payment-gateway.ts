import { PaymentGateway, PaymentIntent } from '../../ports/payment-gateway';
import paypal from '@paypal/checkout-server-sdk';

export class PayPalPaymentGateway implements PaymentGateway {
  private client: paypal.core.PayPalHttpClient;

  constructor(clientId: string, clientSecret: string, sandbox = true) {
    const environment = sandbox
      ? new paypal.core.SandboxEnvironment(clientId, clientSecret)
      : new paypal.core.LiveEnvironment(clientId, clientSecret);
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createPaymentIntent(params: { amount: number; currency: string; metadata?: Record<string, unknown> }): Promise<PaymentIntent> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
          ...(params.metadata ? { custom_id: JSON.stringify(params.metadata) } : {}),
        },
      ],
    });

    const response = await this.client.execute(request);
    const order = response.result;

    return {
      id: order.id,
      amount: parseFloat(order.purchase_units[0].amount.value),
      currency: order.purchase_units[0].amount.currency_code,
      status: this.mapStatus(order.status),
      metadata: order,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const request = new paypal.orders.OrdersCaptureRequest(paymentIntentId);
    request.requestBody({ payment_source: {} as any });

    const response = await this.client.execute(request);
    const order = response.result;
    const capture = order.purchase_units[0].payments.captures[0];

    return {
      id: order.id,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      status: this.mapStatus(capture.status),
      metadata: order,
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; amount: number; status: 'pending' | 'succeeded' | 'failed' }> {
    // Get order to find capture ID
    const getOrderRequest = new paypal.orders.OrdersGetRequest(paymentIntentId);
    const orderResponse = await this.client.execute(getOrderRequest);
    const order = orderResponse.result;
    const captureId = order.purchase_units[0].payments.captures[0].id;

    const refundRequest = new paypal.payments.CapturesRefundRequest(captureId);
    let refundBody: any = {};
    if (amount !== undefined) {
      refundBody = {
        amount: {
          value: amount.toFixed(2),
          currency_code: order.purchase_units[0].payments.captures[0].amount.currency_code,
        },
        invoice_id: order.purchase_units[0].payments.captures[0].invoice_id || '',
        note_to_payer: '',
      };
      refundRequest.requestBody(refundBody);
    } else {
      const capture = order.purchase_units[0].payments.captures[0];
      refundRequest.requestBody({
        amount: {
          value: capture.amount.value,
          currency_code: capture.amount.currency_code,
        },
        invoice_id: capture.invoice_id || '',
        note_to_payer: '',
      });
    }

    const refundResponse = await this.client.execute(refundRequest);
    const refund = refundResponse.result;

    return {
      id: refund.id,
      amount: parseFloat(refund.amount.value),
      status: this.mapRefundStatus(refund.status),
    };
  }

  private mapStatus(status: string): PaymentIntent['status'] {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'requires_payment_method':
        return 'requires_payment_method';
      case 'approved':
      case 'requires_confirmation':
        return 'requires_confirmation';
      case 'completed':
      case 'succeeded':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'canceled';
      default:
        return 'failed';
    }
  }

  private mapRefundStatus(status: string): 'pending' | 'succeeded' | 'failed' {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'completed':
      case 'succeeded':
        return 'succeeded';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'failed';
    }
  }
}