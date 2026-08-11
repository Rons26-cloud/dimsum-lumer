import { create } from "zustand";
import { persist } from "zustand/middleware";
import { maxPurchasable } from "../utils/productStock.js";

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      replaceItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
      
      addItem: (product, qty = 1) =>
        set((state) => {
          const cartKey = product.cart_key || `${product.id}:${product.variant_id || product.variant || "default"}:${product.flash_sale_id || "regular"}`;
          const existing = state.items.find((i) => i.cart_key === cartKey);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cart_key === cartKey ? { ...i, qty: Math.min(maxPurchasable(i), Number(i.qty || 0) + Number(qty || 1)) } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, cart_key: cartKey, qty: Math.min(maxPurchasable(product), Number(qty || 1)) }] };
        }),

      removeItem: (id) => 
        set((state) => ({ 
          items: state.items.filter((i) => (i.cart_key || i.id) !== id) 
        })),

      updateQty: (id, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => (i.cart_key || i.id) !== id) };
          }
          return {
            items: state.items.map((i) => ((i.cart_key || i.id) === id ? { ...i, qty: Math.min(maxPurchasable(i), qty) } : i)),
          };
        }),

      clearCart: () => set({ items: [] }),

    }),
    {
      name: "dimsum-lumer-cart", // Key untuk penyimpanan otomatis ke localStorage
    }
  )
);
