import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { PaymentGateway } from "@shared/ports/payment-gateway";

describe("PaymentService", () => {
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
    const PaymentService =
      require("@shared/services/payment.service").PaymentService;
    service = new PaymentService(paymentGateway);
  });

  it("should create a payment intent if amount > 0", async () => {
    paymentGateway.createPaymentIntent.mockResolvedValue({
      id: "pi_123",
      amount: 1000,
      currency: "USD",
      status: "requires_confirmation",
    });
    const result = await service.createPayment(1000, "USD");
    expect(paymentGateway.createPaymentIntent).toHaveBeenCalledWith({
      amount: 1000,
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("requires_confirmation");
    }
  });

  it("should not allow zero or negative payment", async () => {
    const zeroResult = await service.createPayment(0, "USD");
    const negativeResult = await service.createPayment(-5, "USD");

    expect(zeroResult.ok).toBe(false);
    if (!zeroResult.ok) {
      expect(zeroResult.error.type).toBe("ValidationError");
    }

    expect(negativeResult.ok).toBe(false);
    if (!negativeResult.ok) {
      expect(negativeResult.error.type).toBe("ValidationError");
    }

    expect(paymentGateway.createPaymentIntent).not.toHaveBeenCalled();
  });

  it("should validate amount is positive", async () => {
    const result = await service.createPayment(0, "USD");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ValidationError");
    }
  });

  it("should reject negative amounts", async () => {
    const result = await service.createPayment(-100, "USD");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ValidationError");
    }
  });

  it("should confirm a payment intent", async () => {
    paymentGateway.confirmPayment.mockResolvedValue({
      id: "pi_123",
      amount: 1000,
      currency: "USD",
      status: "succeeded",
    });
    const result = await service.confirmPayment("pi_123");
    expect(paymentGateway.confirmPayment).toHaveBeenCalledWith("pi_123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("succeeded");
    }
  });

  it("should refund a payment", async () => {
    paymentGateway.refundPayment.mockResolvedValue({
      id: "re_123",
      amount: 500,
      status: "succeeded",
    });
    const result = await service.refundPayment("pi_123", 500);
    expect(paymentGateway.refundPayment).toHaveBeenCalledWith("pi_123", 500);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("succeeded");
    }
  });

  it("should handle payment gateway errors", async () => {
    paymentGateway.createPaymentIntent.mockRejectedValue(
      new Error("Gateway error")
    );
    const result = await service.createPayment(1000, "USD");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("Unknown");
      expect(result.error.message).toBe("Gateway error");
    }
  });
});
