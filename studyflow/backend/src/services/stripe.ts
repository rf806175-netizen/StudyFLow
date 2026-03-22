import Stripe from "stripe";
import { config } from "../config";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

const stripe = new Stripe(config.stripe.secretKey);

export { stripe };

export async function createOrGetCustomer(
  userId: number,
  email: string,
  name: string
): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({ email, name });

  await db
    .update(schema.users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(schema.users.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  userId: number,
  email: string,
  name: string,
  priceId: string
): Promise<string> {
  const customerId = await createOrGetCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.frontendUrl}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payments?cancelled=true`,
    metadata: { userId: String(userId) },
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Failed to create Stripe Checkout session");
  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.frontendUrl}/payments`,
  });
  return session.url;
}

// ─── Webhook Handlers ─────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  object: Stripe.Checkout.Session
): Promise<void> {
  const userId = parseInt(object.metadata?.userId || "0", 10);
  if (!userId || !object.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    object.subscription as string
  );

  await db
    .update(schema.users)
    .set({
      subscriptionTier: "premium",
      stripeSubscriptionId: subscription.id,
      subscriptionExpiresAt: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.users.id, userId));
}

async function handleSubscriptionUpdated(
  object: Stripe.Subscription
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.stripeSubscriptionId, object.id),
  });
  if (!user) return;

  const isActive =
    object.status === "active" || object.status === "trialing";

  await db
    .update(schema.users)
    .set({
      subscriptionTier: isActive ? "premium" : "free",
      subscriptionExpiresAt: new Date(
        object.current_period_end * 1000
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.users.id, user.id));
}

async function handleSubscriptionDeleted(
  object: Stripe.Subscription
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.stripeSubscriptionId, object.id),
  });
  if (!user) return;

  await db
    .update(schema.users)
    .set({
      subscriptionTier: "free",
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.users.id, user.id));
}

async function handleInvoicePaymentSucceeded(
  object: Stripe.Invoice
): Promise<void> {
  if (!object.customer || !object.payment_intent) return;

  const user = await db.query.users.findFirst({
    where: eq(schema.users.stripeCustomerId, object.customer as string),
  });
  if (!user) return;

  await db.insert(schema.payments).values({
    userId: user.id,
    stripePaymentIntentId: object.payment_intent as string,
    stripeSubscriptionId: object.subscription as string | undefined,
    amountCents: object.amount_paid,
    currency: object.currency,
    status: "succeeded",
    description: object.description || "Premium subscription payment",
  });
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    default:
      // Unhandled event — ignore
      break;
  }
}
