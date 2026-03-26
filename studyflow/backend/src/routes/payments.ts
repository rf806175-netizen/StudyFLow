import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  stripe,
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
} from "../services/stripe";
import { config } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/webhooks/stripe  — must be before JSON body parser (raw body needed)
router.post(
  "/webhooks/stripe",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        config.stripe.webhookSecret
      );
    } catch (err) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    try {
      await handleWebhookEvent(event);
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }

    res.json({ received: true });
  }
);

// All routes below require authentication
router.use(requireAuth);

const checkoutSchema = z.object({
  priceId: z.enum([
    config.stripe.premiumMonthlyPriceId,
    config.stripe.premiumYearlyPriceId,
  ]),
});

// POST /api/payments/checkout
router.post("/checkout", async (req: AuthRequest, res: Response) => {
  const result = checkoutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid price ID" });
    return;
  }

  if (req.user!.subscriptionTier === "premium") {
    res.status(409).json({ error: "Already subscribed to Premium" });
    return;
  }

  const url = await createCheckoutSession(
    req.userId!,
    req.user!.email,
    req.user!.fullName,
    result.data.priceId,
    req.user!.stripeCustomerId ?? undefined
  );

  res.json({ url });
});

// POST /api/payments/portal
router.post("/portal", async (req: AuthRequest, res: Response) => {
  if (!req.user!.stripeCustomerId) {
    res.status(404).json({ error: "No Stripe customer found" });
    return;
  }

  const url = await createPortalSession(req.user!.stripeCustomerId);
  res.json({ url });
});

// GET /api/payments/prices
router.get("/prices", (_req: Request, res: Response) => {
  res.json({
    monthly: {
      priceId: config.stripe.premiumMonthlyPriceId,
      amount: 2500, // R$25,00 em centavos
      interval: "month",
    },
    yearly: {
      priceId: config.stripe.premiumYearlyPriceId,
      amount: 25000, // R$250,00 em centavos
      interval: "year",
    },
  });
});

export default router;
