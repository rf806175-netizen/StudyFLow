"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const stripe_1 = require("../services/stripe");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/webhooks/stripe  — must be before JSON body parser (raw body needed)
router.post("/webhooks/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
    }
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, config_1.config.stripe.webhookSecret);
    }
    catch (err) {
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
    }
    try {
        await (0, stripe_1.handleWebhookEvent)(event);
    }
    catch (err) {
        console.error("Webhook handler error:", err);
        res.status(500).json({ error: "Webhook processing failed" });
        return;
    }
    res.json({ received: true });
});
// All routes below require authentication
router.use(auth_1.requireAuth);
const checkoutSchema = zod_1.z.object({
    priceId: zod_1.z.enum([
        config_1.config.stripe.premiumMonthlyPriceId,
        config_1.config.stripe.premiumYearlyPriceId,
    ]),
});
// POST /api/payments/checkout
router.post("/checkout", async (req, res) => {
    const result = checkoutSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Invalid price ID" });
        return;
    }
    if (req.user.subscriptionTier === "premium") {
        res.status(409).json({ error: "Already subscribed to Premium" });
        return;
    }
    const url = await (0, stripe_1.createCheckoutSession)(req.userId, req.user.email, req.user.fullName, result.data.priceId);
    res.json({ url });
});
// POST /api/payments/portal
router.post("/portal", async (req, res) => {
    if (!req.user.stripeCustomerId) {
        res.status(404).json({ error: "No Stripe customer found" });
        return;
    }
    const url = await (0, stripe_1.createPortalSession)(req.user.stripeCustomerId);
    res.json({ url });
});
// GET /api/payments/prices
router.get("/prices", (_req, res) => {
    res.json({
        monthly: {
            priceId: config_1.config.stripe.premiumMonthlyPriceId,
            amount: 599, // $5.99 in cents
            interval: "month",
        },
        yearly: {
            priceId: config_1.config.stripe.premiumYearlyPriceId,
            amount: 4999, // $49.99 in cents
            interval: "year",
        },
    });
});
exports.default = router;
//# sourceMappingURL=payments.js.map