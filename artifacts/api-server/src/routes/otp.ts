import { Router, type IRouter } from "express";
import twilio from "twilio";

const router: IRouter = Router();

// In-memory OTP store: phone → { code, expiresAt }
// For production, replace with Redis or a DB table
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  // Strip spaces and ensure it starts with +
  const digits = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) {
    // Assume Indian number if no country code
    return "+91" + digits.replace(/^0/, "");
  }
  return digits;
}

// POST /api/otp/send
router.post("/otp/send", async (req, res): Promise<void> => {
  const { phone } = req.body;

  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const normalized = normalizePhone(phone);
  if (normalized.replace(/\D/g, "").length < 10) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  // Rate limit: check if unexpired OTP already sent recently (within 30s)
  const existing = otpStore.get(normalized);
  if (existing && Date.now() < existing.expiresAt - OTP_EXPIRY_MS + 30_000) {
    res.status(429).json({ error: "Please wait before requesting another OTP" });
    return;
  }

  const code = generateOtp();
  otpStore.set(normalized, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  // Send via Twilio if credentials are configured
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your Somya Fashions verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        from: TWILIO_FROM_NUMBER,
        to: normalized,
      });
      res.json({ success: true, message: "OTP sent via SMS" });
    } catch (err: any) {
      // Remove OTP from store if Twilio fails
      otpStore.delete(normalized);
      console.error("Twilio error:", err?.message);
      res.status(500).json({ error: "Failed to send SMS. Please check your phone number and try again." });
    }
  } else {
    // Twilio not configured yet
    res.status(503).json({
      error: "SMS service not configured. Please contact support.",
    });
  }
});

// POST /api/otp/verify
router.post("/otp/verify", async (req, res): Promise<void> => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400).json({ error: "Phone and OTP code are required" });
    return;
  }

  const normalized = normalizePhone(phone);
  const record = otpStore.get(normalized);

  if (!record) {
    res.status(400).json({ error: "No OTP found for this number. Please request a new OTP." });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalized);
    res.status(429).json({ error: "Too many incorrect attempts. Please request a new OTP." });
    return;
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    res.status(400).json({
      error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    });
    return;
  }

  // OTP verified — remove from store
  otpStore.delete(normalized);
  res.json({ success: true, message: "Phone number verified" });
});

// Cleanup expired OTPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) otpStore.delete(key);
  }
}, 15 * 60 * 1000);

export default router;
