"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
exports.createOrGetCustomer = createOrGetCustomer;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.handleWebhookEvent = handleWebhookEvent;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const stripe = new stripe_1.default(config_1.config.stripe.secretKey);
exports.stripe = stripe;
async function createOrGetCustomer(userId, email, name) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.id, userId),
    });
    if (user?.stripeCustomerId) {
        return user.stripeCustomerId;
    }
    const customer = await stripe.customers.create({ email, name });
    await db_1.db
        .update(db_1.schema.users)
        .set({ stripeCustomerId: customer.id })
        .where((0, drizzle_orm_1.eq)(db_1.schema.users.id, userId));
    return customer.id;
}
async function createCheckoutSession(userId, email, name, priceId) {
    const customerId = await createOrGetCustomer(userId, email, name);
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${config_1.config.frontendUrl}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.config.frontendUrl}/payments?cancelled=true`,
        metadata: { userId: String(userId) },
        allow_promotion_codes: true,
    });
    if (!session.url)
        throw new Error("Failed to create Stripe Checkout session");
    return session.url;
}
async function createPortalSession(customerId) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${config_1.config.frontendUrl}/payments`,
    });
    return session.url;
}
// ─── Webhook Handlers ─────────────────────────────────────────────────────────
async function handleCheckoutCompleted(object) {
    const userId = parseInt(object.metadata?.userId || "0", 10);
    if (!userId || !object.subscription)
        return;
    const subscription = await stripe.subscriptions.retrieve(object.subscription);
    await db_1.db
        .update(db_1.schema.users)
        .set({
        subscriptionTier: "premium",
        stripeSubscriptionId: subscription.id,
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(db_1.schema.users.id, userId));
}
async function handleSubscriptionUpdated(object) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.stripeSubscriptionId, object.id),
    });
    if (!user)
        return;
    const isActive = object.status === "active" || object.status === "trialing";
    await db_1.db
        .update(db_1.schema.users)
        .set({
        subscriptionTier: isActive ? "premium" : "free",
        subscriptionExpiresAt: new Date(object.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(db_1.schema.users.id, user.id));
}
async function handleSubscriptionDeleted(object) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.stripeSubscriptionId, object.id),
    });
    if (!user)
        return;
    await db_1.db
        .update(db_1.schema.users)
        .set({
        subscriptionTier: "free",
        stripeSubscriptionId: null,
        subscriptionExpiresAt: null,
        updatedAt: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(db_1.schema.users.id, user.id));
}
async function handleInvoicePaymentSucceeded(object) {
    if (!object.customer || !object.payment_intent)
        return;
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.schema.users.stripeCustomerId, object.customer),
    });
    if (!user)
        return;
    await db_1.db.insert(db_1.schema.payments).values({
        userId: user.id,
        stripePaymentIntentId: object.payment_intent,
        stripeSubscriptionId: object.subscription,
        amountCents: object.amount_paid,
        currency: object.currency,
        status: "succeeded",
        description: object.description || "Premium subscription payment",
    });
}
async function handleWebhookEvent(event) {
    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutCompleted(event.data.object);
            break;
        case "customer.subscription.updated":
            await handleSubscriptionUpdated(event.data.object);
            break;
        case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object);
            break;
        case "invoice.payment_succeeded":
            await handleInvoicePaymentSucceeded(event.data.object);
            break;
        default:
            // Unhandled event — ignore
            break;
    }
}
//# sourceMappingURL=stripe.js.map