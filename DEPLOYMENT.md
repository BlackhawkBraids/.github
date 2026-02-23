# Deployment Guide

## Architecture

| Layer    | Platform | Description                          |
|----------|----------|--------------------------------------|
| Frontend | Vercel   | Static HTML/CSS/JS served globally   |
| Backend  | Render   | Node.js/Express API + Stripe checkout |

---

## Backend — Render

### One-time setup

1. Create a new **Web Service** on [Render](https://render.com/), or use the `render.yaml` Blueprint to provision it automatically.
2. Set the following **secret environment variables** in the Render dashboard  
   *(never commit these to source control)*:

   | Variable                 | Where to find it                                               |
   |--------------------------|----------------------------------------------------------------|
   | `STRIPE_SECRET_KEY`      | [Stripe dashboard → API keys](https://dashboard.stripe.com/apikeys) — use `sk_live_…` in production |
   | `STRIPE_WEBHOOK_SECRET`  | See **Stripe webhook** section below                           |
   | `BASE_URL`               | Your Render service URL, e.g. `https://blackhawkbraids-api.onrender.com` |

3. `NODE_ENV` and `PORT` are set automatically by `render.yaml` / Render; do not override `PORT`.

### Stripe webhook

1. In the [Stripe dashboard → Webhooks](https://dashboard.stripe.com/webhooks), click **Add endpoint**.
2. Set the endpoint URL to:
   ```
   https://<your-render-service>.onrender.com/api/webhook
   ```
3. Select the events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** (`whsec_…`) and save it as `STRIPE_WEBHOOK_SECRET` in Render.

### Health check

Render uses `GET /api/health` to determine service availability.  
The endpoint returns `{ "status": "ok" }` with HTTP 200.

---

## Frontend — Vercel

### One-time setup

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. **Important**: open `vercel.json` and update the rewrite destination to match  
   your actual Render service URL:
   ```json
   "destination": "https://<your-render-service>.onrender.com/api/:path*"
   ```
   Vercel does not support environment variable interpolation in `rewrites`,  
   so this URL must be set at deploy time.
3. No build command is required — the project is a static site.

### Environment variables (Vercel dashboard)

| Variable             | Value                                                  |
|----------------------|--------------------------------------------------------|
| `RENDER_BACKEND_URL` | `https://<your-render-service>.onrender.com` (for documentation/tooling reference) |

---

## Local development

1. Copy `.env.example` to `.env` and fill in your Stripe **test** keys.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the backend server:
   ```sh
   npm start
   ```
   The server listens on `http://localhost:3000` by default.
4. To forward Stripe webhooks locally, install the  
   [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```sh
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   The CLI prints a temporary `STRIPE_WEBHOOK_SECRET`; set it in your `.env`.
