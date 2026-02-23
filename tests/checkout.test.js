"use strict";

const {
  validateCart,
  validateUSShipping,
  applyDiscount,
  deductStock,
  buildLineItems,
  ALLOWED_COUNTRIES,
  DISCOUNT_CODES,
} = require("../src/checkout");

// Reset in-memory stock before each test that touches deductStock so tests
// are isolated. We reload the products module after each deductStock test.
function resetStock() {
  // Clear the require cache for products so stock resets to catalog defaults.
  jest.resetModules();
}

// ── validateCart ─────────────────────────────────────────────────────────────

describe("validateCart", () => {
  test("returns valid result for a well-formed cart", () => {
    const result = validateCart([
      { id: 1, quantity: 1 },
      { id: 14, quantity: 3 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  test("resolves product data (name, price) from the catalog, not from client input", () => {
    const result = validateCart([{ id: 14, quantity: 1 }]);
    expect(result.valid).toBe(true);
    // Catalog price for Edge Control is $12 — client cannot override this
    expect(result.items[0].product.price).toBe(12);
    expect(result.items[0].product.name).toBe("Edge Control");
  });

  test("returns error for empty array", () => {
    const result = validateCart([]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/non-empty/i);
  });

  test("returns error when cartItems is not an array", () => {
    expect(validateCart(null).valid).toBe(false);
    expect(validateCart("items").valid).toBe(false);
    expect(validateCart(undefined).valid).toBe(false);
  });

  test("returns error for non-existent product ID", () => {
    const result = validateCart([{ id: 9999, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  test("returns error for invalid product ID (zero)", () => {
    const result = validateCart([{ id: 0, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for invalid product ID (negative)", () => {
    const result = validateCart([{ id: -5, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for non-integer product ID (float)", () => {
    const result = validateCart([{ id: 1.5, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for quantity of zero", () => {
    const result = validateCart([{ id: 1, quantity: 0 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("returns error for negative quantity", () => {
    const result = validateCart([{ id: 1, quantity: -1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("returns error when quantity exceeds 99", () => {
    const result = validateCart([{ id: 1, quantity: 100 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("accepts quantity of 99 (upper boundary)", () => {
    const result = validateCart([{ id: 1, quantity: 99 }]);
    expect(result.valid).toBe(true);
  });

  test("accepts quantity of 1 (lower boundary)", () => {
    const result = validateCart([{ id: 1, quantity: 1 }]);
    expect(result.valid).toBe(true);
  });

  test("coerces string IDs and quantities to numbers", () => {
    const result = validateCart([{ id: "1", quantity: "2" }]);
    expect(result.valid).toBe(true);
    expect(result.items[0].quantity).toBe(2);
  });

  test("includes quantity on each validated item", () => {
    const result = validateCart([{ id: 14, quantity: 5 }]);
    expect(result.valid).toBe(true);
    expect(result.items[0].quantity).toBe(5);
  });
});

// ── validateUSShipping ────────────────────────────────────────────────────────

describe("validateUSShipping", () => {
  test("accepts 'US'", () => {
    expect(validateUSShipping("US").valid).toBe(true);
  });

  test("accepts lowercase 'us'", () => {
    expect(validateUSShipping("us").valid).toBe(true);
  });

  test("accepts 'US' with surrounding whitespace", () => {
    expect(validateUSShipping("  US  ").valid).toBe(true);
  });

  test("rejects 'CA' (Canada)", () => {
    const result = validateUSShipping("CA");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/united states/i);
  });

  test("rejects 'GB' (United Kingdom)", () => {
    const result = validateUSShipping("GB");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/united states/i);
  });

  test("rejects 'MX' (Mexico)", () => {
    const result = validateUSShipping("MX");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/united states/i);
  });

  test("rejects empty string", () => {
    const result = validateUSShipping("");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  test("rejects null", () => {
    expect(validateUSShipping(null).valid).toBe(false);
  });

  test("rejects undefined", () => {
    expect(validateUSShipping(undefined).valid).toBe(false);
  });

  test("rejects a number", () => {
    expect(validateUSShipping(1).valid).toBe(false);
  });
});

// ── applyDiscount ─────────────────────────────────────────────────────────────

describe("applyDiscount", () => {
  test("applies a valid percent discount code", () => {
    const result = applyDiscount("BRAID10", 100);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
    expect(result.total).toBe(90);
  });

  test("applies a valid flat discount code", () => {
    const result = applyDiscount("WELCOME5", 100);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(5);
    expect(result.total).toBe(95);
  });

  test("applies BRAID20 (20% off)", () => {
    const result = applyDiscount("BRAID20", 200);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(40);
    expect(result.total).toBe(160);
  });

  test("applies SAVE15 ($15 flat off)", () => {
    const result = applyDiscount("SAVE15", 80);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(15);
    expect(result.total).toBe(65);
  });

  test("is case-insensitive", () => {
    const result = applyDiscount("braid10", 100);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
  });

  test("trims whitespace from code", () => {
    const result = applyDiscount("  BRAID10  ", 100);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
  });

  test("flat discount does not reduce total below zero", () => {
    // WELCOME5 = $5 flat off; subtotal $3 should result in $0 total
    const result = applyDiscount("WELCOME5", 3);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(3);
    expect(result.total).toBe(0);
  });

  test("percent discount rounds to two decimal places", () => {
    // 10% of $33.33 = $3.33
    const result = applyDiscount("BRAID10", 33.33);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBeCloseTo(3.33, 2);
    expect(result.total).toBeCloseTo(30.00, 2);
  });

  test("returns error for an invalid discount code", () => {
    const result = applyDiscount("FAKECODE", 100);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid discount code/i);
  });

  test("returns error when code is null", () => {
    expect(applyDiscount(null, 100).valid).toBe(false);
  });

  test("returns error when code is undefined", () => {
    expect(applyDiscount(undefined, 100).valid).toBe(false);
  });

  test("returns error when code is empty string", () => {
    expect(applyDiscount("", 100).valid).toBe(false);
  });

  test("returns error when subtotal is negative", () => {
    const result = applyDiscount("BRAID10", -1);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/non-negative/i);
  });

  test("returns error when subtotal is not a number", () => {
    expect(applyDiscount("BRAID10", "100").valid).toBe(false);
    expect(applyDiscount("BRAID10", null).valid).toBe(false);
  });

  test("applies 0% percent discount correctly (edge case: subtotal zero)", () => {
    const result = applyDiscount("BRAID10", 0);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ── deductStock ───────────────────────────────────────────────────────────────

describe("deductStock", () => {
  // Each test that calls deductStock uses a fresh module instance so stock
  // mutations from one test do not bleed into the next.
  let freshValidateCart;
  let freshDeductStock;

  beforeEach(() => {
    jest.resetModules();
    ({ validateCart: freshValidateCart, deductStock: freshDeductStock } =
      require("../src/checkout"));
  });

  test("deducts stock successfully for a valid cart", () => {
    const cartResult = freshValidateCart([{ id: 14, quantity: 2 }]);
    expect(cartResult.valid).toBe(true);

    const result = freshDeductStock(cartResult.items);
    expect(result.success).toBe(true);

    // Verify stock was actually reduced
    const { products } = require("../src/products");
    const edgeControl = products.find((p) => p.id === 14);
    expect(edgeControl.stock).toBe(48); // 50 - 2
  });

  test("deducts stock for multiple items atomically", () => {
    const cartResult = freshValidateCart([
      { id: 14, quantity: 3 },
      { id: 15, quantity: 5 },
    ]);
    expect(cartResult.valid).toBe(true);

    const result = freshDeductStock(cartResult.items);
    expect(result.success).toBe(true);

    const { products } = require("../src/products");
    expect(products.find((p) => p.id === 14).stock).toBe(47); // 50 - 3
    expect(products.find((p) => p.id === 15).stock).toBe(25); // 30 - 5
  });

  test("returns error when a product has insufficient stock", () => {
    // Edge Control has stock: 50; requesting 51 should fail
    const cartResult = freshValidateCart([{ id: 14, quantity: 51 }]);
    // validateCart only checks quantity <= 99; stock check is in deductStock
    expect(cartResult.valid).toBe(true);

    const result = freshDeductStock(cartResult.items);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/insufficient stock/i);
  });

  test("does not deduct any stock when one item is out of stock (all-or-nothing)", () => {
    // Edge Control stock: 50; Braid Spray stock: 30
    // Request 51 Edge Controls (will fail) and 1 Braid Spray (would succeed alone)
    const { products } = require("../src/products");
    const edgeControl = products.find((p) => p.id === 14);
    const braid = products.find((p) => p.id === 15);

    // Manually craft items to bypass validateCart quantity cap for this test
    const items = [
      { product: edgeControl, quantity: 51 },
      { product: braid, quantity: 1 },
    ];

    const result = freshDeductStock(items);
    expect(result.success).toBe(false);

    // Neither product should have been deducted
    expect(edgeControl.stock).toBe(50);
    expect(braid.stock).toBe(30);
  });

  test("returns error for empty items array", () => {
    const result = freshDeductStock([]);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no items/i);
  });

  test("returns error when items is not an array", () => {
    expect(freshDeductStock(null).success).toBe(false);
    expect(freshDeductStock(undefined).success).toBe(false);
  });

  test("succeeds for a service product with high sentinel stock", () => {
    // Service products have stock: 999 (effectively unlimited)
    const cartResult = freshValidateCart([{ id: 1, quantity: 5 }]);
    expect(cartResult.valid).toBe(true);

    const result = freshDeductStock(cartResult.items);
    expect(result.success).toBe(true);

    const { products } = require("../src/products");
    expect(products.find((p) => p.id === 1).stock).toBe(994); // 999 - 5
  });
});

// ── buildLineItems ─────────────────────────────────────────────────────────────

describe("buildLineItems", () => {
  const validatedItems = [
    {
      product: { id: 14, name: "Edge Control", description: "Strong-hold edge control gel.", price: 12 },
      quantity: 2,
    },
    {
      product: { id: 1, name: "Box Braids", description: "Classic box braids, any length.", price: 150 },
      quantity: 1,
    },
  ];

  test("returns an array with the same length as input", () => {
    expect(buildLineItems(validatedItems)).toHaveLength(2);
  });

  test("converts price from dollars to cents", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].price_data.unit_amount).toBe(1200);  // $12 → 1200 cents
    expect(items[1].price_data.unit_amount).toBe(15000); // $150 → 15000 cents
  });

  test("passes product name and description to Stripe", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].price_data.product_data.name).toBe("Edge Control");
    expect(items[0].price_data.product_data.description).toBe("Strong-hold edge control gel.");
  });

  test("sets currency to usd", () => {
    buildLineItems(validatedItems).forEach((item) => {
      expect(item.price_data.currency).toBe("usd");
    });
  });

  test("preserves quantity", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].quantity).toBe(2);
    expect(items[1].quantity).toBe(1);
  });
});

// ── ALLOWED_COUNTRIES ──────────────────────────────────────────────────────────

describe("ALLOWED_COUNTRIES", () => {
  test("contains only 'US'", () => {
    expect(ALLOWED_COUNTRIES).toEqual(["US"]);
  });
});

// ── DISCOUNT_CODES registry ────────────────────────────────────────────────────

describe("DISCOUNT_CODES registry", () => {
  test("BRAID10 is a 10% percent discount", () => {
    expect(DISCOUNT_CODES.BRAID10).toEqual({ type: "percent", value: 10 });
  });

  test("BRAID20 is a 20% percent discount", () => {
    expect(DISCOUNT_CODES.BRAID20).toEqual({ type: "percent", value: 20 });
  });

  test("WELCOME5 is a $5 flat discount", () => {
    expect(DISCOUNT_CODES.WELCOME5).toEqual({ type: "flat", value: 5 });
  });

  test("SAVE15 is a $15 flat discount", () => {
    expect(DISCOUNT_CODES.SAVE15).toEqual({ type: "flat", value: 15 });
  });
});

// ── Full checkout flow integration ────────────────────────────────────────────

describe("Full checkout flow", () => {
  let freshValidateCart;
  let freshValidateUSShipping;
  let freshApplyDiscount;
  let freshDeductStock;
  let freshBuildLineItems;

  beforeEach(() => {
    jest.resetModules();
    ({
      validateCart:      freshValidateCart,
      validateUSShipping: freshValidateUSShipping,
      applyDiscount:     freshApplyDiscount,
      deductStock:       freshDeductStock,
      buildLineItems:    freshBuildLineItems,
    } = require("../src/checkout"));
  });

  test("completes a full valid order with a discount code and US shipping", () => {
    // Step 1: validate cart
    const cartResult = freshValidateCart([
      { id: 14, quantity: 2 }, // Edge Control $12 × 2 = $24
      { id: 15, quantity: 1 }, // Braid Spray  $15 × 1 = $15
    ]);
    expect(cartResult.valid).toBe(true);

    // Step 2: validate US shipping
    const shippingResult = freshValidateUSShipping("US");
    expect(shippingResult.valid).toBe(true);

    // Step 3: calculate subtotal
    const subtotal = cartResult.items.reduce(
      (sum, { product, quantity }) => sum + product.price * quantity,
      0
    );
    expect(subtotal).toBe(39); // $24 + $15

    // Step 4: apply discount code
    const discountResult = freshApplyDiscount("BRAID10", subtotal);
    expect(discountResult.valid).toBe(true);
    expect(discountResult.discountAmount).toBe(3.9);
    expect(discountResult.total).toBe(35.1);

    // Step 5: deduct stock
    const stockResult = freshDeductStock(cartResult.items);
    expect(stockResult.success).toBe(true);

    // Step 6: build Stripe line items
    const lineItems = freshBuildLineItems(cartResult.items);
    expect(lineItems).toHaveLength(2);
    expect(lineItems[0].price_data.unit_amount).toBe(1200);
  });

  test("rejects a full order when shipping is outside the US", () => {
    const cartResult = freshValidateCart([{ id: 14, quantity: 1 }]);
    expect(cartResult.valid).toBe(true);

    const shippingResult = freshValidateUSShipping("CA");
    expect(shippingResult.valid).toBe(false);
    expect(shippingResult.error).toMatch(/united states/i);
  });

  test("rejects a full order when the discount code is invalid", () => {
    const cartResult = freshValidateCart([{ id: 14, quantity: 1 }]);
    expect(cartResult.valid).toBe(true);

    const discountResult = freshApplyDiscount("INVALID", 12);
    expect(discountResult.valid).toBe(false);
    expect(discountResult.error).toMatch(/invalid discount code/i);
  });

  test("rejects a full order when stock is insufficient", () => {
    // Edge Control stock: 50; try to order 51
    const { products } = require("../src/products");
    const edgeControl = products.find((p) => p.id === 14);
    const items = [{ product: edgeControl, quantity: 51 }];

    const stockResult = freshDeductStock(items);
    expect(stockResult.success).toBe(false);
    expect(stockResult.error).toMatch(/insufficient stock/i);
  });
});
