"use strict";

require("dotenv").config();

const path    = require("path");
const express = require("express");
const cors    = require("cors");
const Stripe  = require("stripe");

const { validateCart, buildLineItems } = require("./src/checkout");

const app = express();

// ── Stripe webhook ──────────────────────────────────────────────────────────
// Must be registered BEFORE express.json() so Stripe receives the raw body
// required for signature verification.
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig           = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set.");
      return res.status(500).json({ error: "Webhook secret not configured." });
    }

    let event;
    try {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the events that matter for order fulfillment.
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(
          `Payment succeeded for session ${session.id} — ` +
          `amount: ${session.amount_total} ${session.currency}`
        );
        // TODO: persist order, send confirmation email, update inventory, etc.
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.warn(`Payment failed for PaymentIntent ${intent.id}`);
        break;
      }
      default:
        // Unhandled event type — safe to ignore.
        break;
    }

    res.json({ received: true });
  }
);

// ── Standard middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve only the dedicated public folder — never the server's working directory.
app.use(express.static(path.join(__dirname, "public")));

// ── GET /api/health ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── POST /api/checkout/session ──────────────────────────────────────────────
/**
 * Expects JSON body: { cartItems: [{ id, quantity }, ...] }
 *
 * Security measures:
 *  1. Server-side cart validation — prices are sourced from the catalog,
 *     never from client input.
 *  2. US-only shipping — Stripe's `shipping_address_collection` is restricted
 *     to ["US"]. Any non-US address entered on the Stripe-hosted page is
 *     rejected before payment is captured.
 *
 * Returns: { url: <Stripe hosted checkout URL> }
 */
app.post("/api/checkout/session", async (req, res) => {
  try {
    const { cartItems } = req.body;

    // 1. Validate the cart server-side against the authoritative product catalog.
    const cartResult = validateCart(cartItems);
    if (!cartResult.valid) {
      return res.status(400).json({ error: cartResult.error });
    }

    // 2. Build Stripe line items using server-validated prices (cents).
    const lineItems = buildLineItems(cartResult.items);

    const stripe  = Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // 3. Create the Stripe Checkout Session.
    //    `shipping_address_collection` is restricted to the US — Stripe will
    //    reject any non-US address at the payment page, enforcing US-only
    //    shipping before any charge is captured.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items:           lineItems,
      mode:                 "payment",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/checkout.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err.message);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`BlackhawkBraids checkout server running on port ${PORT}`)
  );
}

module.exports = app;
