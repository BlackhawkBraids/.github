/**
 * Product catalog for BlackhawkBraids.
 * Each product represents a service or retail item offered.
 * This is the authoritative source for server-side price validation.
 */
const products = [
  // Braiding Services
  { id: 1,  name: "Box Braids",                  category: "braiding-services", price: 150, description: "Classic box braids, any length." },
  { id: 2,  name: "Knotless Braids",             category: "braiding-services", price: 180, description: "Gentle knotless technique for a natural look." },
  { id: 3,  name: "Cornrows",                    category: "braiding-services", price: 80,  description: "Straight-back or custom cornrow patterns." },
  { id: 4,  name: "Senegalese Twists",           category: "braiding-services", price: 160, description: "Smooth two-strand Senegalese twists." },
  { id: 5,  name: "Butterfly Locs",              category: "braiding-services", price: 200, description: "Trendy distressed butterfly locs." },

  // Natural Hair Services
  { id: 6,  name: "Wash & Go",                   category: "natural-hair", price: 60,  description: "Full wash, condition, and style." },
  { id: 7,  name: "Twist Out",                   category: "natural-hair", price: 70,  description: "Defined twist-out styling." },
  { id: 8,  name: "Silk Press",                  category: "natural-hair", price: 90,  description: "Heat-free silk press for a sleek finish." },
  { id: 9,  name: "Deep Conditioning Treatment", category: "natural-hair", price: 45,  description: "Intensive moisture and protein treatment." },

  // Wigs & Extensions
  { id: 10, name: "Wig Install (No Glue)",       category: "wigs-extensions", price: 75,  description: "Secure wig install without adhesive." },
  { id: 11, name: "Closure Install",             category: "wigs-extensions", price: 120, description: "Lace closure install and blend." },
  { id: 12, name: "Frontal Install",             category: "wigs-extensions", price: 140, description: "Full frontal lace install." },
  { id: 13, name: "Tape-In Extensions",          category: "wigs-extensions", price: 200, description: "Seamless tape-in hair extensions." },

  // Hair Products
  { id: 14, name: "Edge Control",                category: "hair-products", price: 12, description: "Strong-hold edge control gel." },
  { id: 15, name: "Braid Spray",                 category: "hair-products", price: 15, description: "Moisturizing spray for braids and twists." },
  { id: 16, name: "Deep Conditioner (8 oz)",     category: "hair-products", price: 22, description: "Professional-grade deep conditioner." },
  { id: 17, name: "Hair Oil Blend",              category: "hair-products", price: 18, description: "Nourishing oil blend for scalp health." },
  { id: 18, name: "Braiding Gel",                category: "hair-products", price: 10, description: "Smooth braiding gel for all hair types." },
];

const categories = [
  { value: "all",               label: "All Categories" },
  { value: "braiding-services", label: "Braiding Services" },
  { value: "natural-hair",      label: "Natural Hair Services" },
  { value: "wigs-extensions",   label: "Wigs & Extensions" },
  { value: "hair-products",     label: "Hair Products" },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { products, categories };
}
