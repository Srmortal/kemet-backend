import { createTransport } from "nodemailer";
import type { BookingEmailDetails } from "#app/infrastructure/models/email.model.js";
import logger from "#app/shared/utils/metrics/logger.js";
import type { DomainError } from "../types/domain-error.type.js";
import type { Result } from "../types/result.types.js";
import { err, ok } from "../types/result.types.js";

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendBookingConfirmationEmail = async (
  details: BookingEmailDetails
): Promise<Result<{ success: boolean; message: string }, DomainError>> => {
  try {
    const mailOptions = {
      from: `"Kemet Tourism" <${process.env.EMAIL_USER}>`,
      to: details.email,
      subject: `Booking Confirmed - ${details.placeTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #bfa05a;">Booking Confirmation</h2>
          <p>Hello ${details.userName || "Traveller"},</p>
          <p>Your booking for <strong>${details.placeTitle}</strong> has been confirmed successfully!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Guests:</strong> ${details.guests}</p>
            <p><strong>Total Price:</strong> ${details.totalPrice} EGP</p>
          </div>

          <p>We are excited to see you soon!</p>
          <p>Best Regards,<br>Kemet Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Confirmation email sent to ${details.email}`);
    return ok({ success: true, message: "Email sent successfully" });
  } catch (error) {
    logger.error("Error sending email:", error);
    return err({
      type: "Unknown",
      message: `Failed to send email: ${(error as Error).message}`,
    });
  }
};
