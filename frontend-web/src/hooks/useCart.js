import { create } from "zustand";
import { persist } from "zustand/middleware";

// State keranjang belanja global menggunakan Zustand
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      replaceItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
      
      // Menambah produk ke keranjang
      addItem: (product, qty = 1) =>
        set((state) => {
          const cartKey = product.cart_key || `${product.id}:${product.variant_id || product.variant || "default"}:${product.flash_sale_id || "regular"}`;
          const existing = state.items.find((i) => i.cart_key === cartKey);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cart_key === cartKey ? { ...i, qty: Number(i.qty || 0) + Number(qty || 1) } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, cart_key: cartKey, qty: Number(qty || 1) }] };
        }),

      // Menghapus item tertentu dari keranjang
      removeItem: (id) => 
        set((state) => ({ 
          items: state.items.filter((i) => (i.cart_key || i.id) !== id) 
        })),

      // Memperbarui kuantitas produk
      updateQty: (id, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => (i.cart_key || i.id) !== id) };
          }
          return {
            items: state.items.map((i) => ((i.cart_key || i.id) === id ? { ...i, qty } : i)),
          };
        }),

      // Mengosongkan seluruh keranjang
      clearCart: () => set({ items: [] }),

    }),
    {
      name: "dimsum-lumer-cart", // Key untuk penyimpanan otomatis ke localStorage
    }
  )
);
