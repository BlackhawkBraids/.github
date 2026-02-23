/**
 * Checkout module for BlackhawkBraids.
 * Handles server-side cart validation, US-only shipping enforcement,
 * and Stripe line-item construction.
 *
 * All prices are sourced from the authoritative server-side product catalog —
 * client-submitted prices are never trusted.
 */

"use strict";

const { products } = require("./products");

/** Countries to which shipping is permitted. */
const ALLOWED_COUNTRIES = ["US"];

/**
 * @typedef {{ id: number, name: string, price: number, description: string, category: string }} Product
 * @typedef {{ product: Product, quantity: number }} ValidatedItem
 */

/**
 * Validates cart items against the authoritative product catalog.
 * Looks up each product by ID and uses the catalog price, ignoring any
 * price submitted by the client.
 *
 * @param {Array<{id: number|string, quantity: number|string}>} cartItems
 * @returns {{ valid: true, items: ValidatedItem[] } | { valid: false, error: string }}
 */
function validateCart(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: false, error: "Cart must be a non-empty array." };
  }

  const validated = [];

  for (const item of cartItems) {
    const id = Number(item.id);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(id) || id <= 0) {
      return { valid: false, error: `Invalid product ID: ${item.id}` };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { valid: false, error: `Invalid quantity for product ${id}: must be between 1 and 99.` };
    }

    const product = products.find((p) => p.id === id);
    if (!product) {
      return { valid: false, error: `Product not found: ${id}` };
    }

    validated.push({ product, quantity });
  }

  return { valid: true, items: validated };
}

/**
 * Validates that the shipping destination is within the United States.
 *
 * @param {string} country - ISO 3166-1 alpha-2 country code (e.g. "US")
 * @returns {{ valid: boolean, error?: string }}
 */
function validateUSShipping(country) {
  if (!country || typeof country !== "string") {
    return { valid: false, error: "Shipping country is required." };
  }

  if (!ALLOWED_COUNTRIES.includes(country.trim().toUpperCase())) {
    return {
      valid: false,
      error: "Shipping is only available within the United States.",
    };
  }

  return { valid: true };
}

/**
 * Builds a Stripe `line_items` array from server-validated cart items.
 * Prices are converted from dollars to cents as required by Stripe.
 *
 * @param {ValidatedItem[]} validatedItems
 * @returns {Array} Stripe line_items array
 */
function buildLineItems(validatedItems) {
  return validatedItems.map(({ product, quantity }) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product.name,
        description: product.description,
      },
      unit_amount: Math.round(product.price * 100),
    },
    quantity,
  }));
}

module.exports = { validateCart, validateUSShipping, buildLineItems, ALLOWED_COUNTRIES };
