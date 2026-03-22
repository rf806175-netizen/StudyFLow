import Stripe from "stripe";
declare const stripe: Stripe;
export { stripe };
export declare function createOrGetCustomer(userId: number, email: string, name: string): Promise<string>;
export declare function createCheckoutSession(userId: number, email: string, name: string, priceId: string): Promise<string>;
export declare function createPortalSession(customerId: string): Promise<string>;
export declare function handleWebhookEvent(event: Stripe.Event): Promise<void>;
//# sourceMappingURL=stripe.d.ts.map