import { PaymentGateway, PaymentIntent } from '../src/ports/payment-gateway';

describe('PaymentService', () => {
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let service: any;

  beforeEach(() => {
    paymentGateway = {
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      refundPayment: jest.fn(),
    };
    // Service will be implemented later, just mock for now
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PaymentService = require('../src/services/payment.service').PaymentService;
    service = new PaymentService(paymentGateway);
  });

  it('should create a payment intent if amount > 0', async () => {
    paymentGateway.createPaymentIntent.mockResolvedValue({
      id: 'pi_123',
      amount: 1000,
      currency: 'USD',
      status: 'requires_confirmation',
    });
    const intent = await service.createPayment(1000, 'USD');
    expect(paymentGateway.createPaymentIntent).toHaveBeenCalledWith({ amount: 1000, currency: 'USD' });
    expect(intent.status).toBe('requires_confirmation');
  });

  it('should not allow zero or negative payment', async () => {
    await expect(service.createPayment(0, 'USD')).rejects.toThrow('Invalid amount');
    await expect(service.createPayment(-5, 'USD')).rejects.toThrow('Invalid amount');
    expect(paymentGateway.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('should confirm a payment intent', async () => {
    paymentGateway.confirmPayment.mockResolvedValue({
      id: 'pi_123',
      amount: 1000,
      currency: 'USD',
      status: 'succeeded',
    });
    const result = await service.confirmPayment('pi_123');
    expect(paymentGateway.confirmPayment).toHaveBeenCalledWith('pi_123');
    expect(result.status).toBe('succeeded');
  });

  it('should refund a payment', async () => {
    paymentGateway.refundPayment.mockResolvedValue({
      id: 're_123',
      amount: 500,
      status: 'succeeded',
    });
    const result = await service.refundPayment('pi_123', 500);
    expect(paymentGateway.refundPayment).toHaveBeenCalledWith('pi_123', 500);
    expect(result.status).toBe('succeeded');
  });

  it('should handle payment gateway errors', async () => {
    paymentGateway.createPaymentIntent.mockRejectedValue(new Error('Gateway error'));
    await expect(service.createPayment(1000, 'USD')).rejects.toThrow('Gateway error');
  });
});
