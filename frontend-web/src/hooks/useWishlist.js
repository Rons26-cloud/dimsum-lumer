import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";
import { useAuth } from "./useAuth.js";
import { runtimeId } from "../utils/runtimeId.js";


export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase
      .from(TABLES.WISHLIST)
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (mounted) {
          if (!error && data) {
            setIds(new Set(data.map((r) => r.product_id)));
          } else {
            setIds(new Set());
          }
        }
      })
      .catch((err) => {
        console.error("Gagal memuat wishlist:", err);
        if (mounted) setIds(new Set());
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const channel = supabase
      .channel(`realtime-wishlist-${user.id}-${runtimeId()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.WISHLIST, filter: `user_id=eq.${user.id}` },
        (payload) => {
          setIds((prev) => {
            const next = new Set(prev);
            if (payload.eventType === "INSERT") {
              next.add(payload.new.product_id);
            } else if (payload.eventType === "DELETE") {
              next.delete(payload.old.product_id);
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isWishlisted = useCallback((productId) => ids.has(productId), [ids]);

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!user) return { requiresLogin: true };
      
      try {
        if (ids.has(productId)) {
          const { error } = await supabase
            .from(TABLES.WISHLIST)
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
          if (error) throw error;
          setIds((current) => { const next = new Set(current); next.delete(productId); return next; });
        } else {
          const { data: product, error: productError } = await supabase
            .from(TABLES.PRODUCTS)
            .select("id")
            .eq("id", productId)
            .eq("is_active", true)
            .maybeSingle();
          if (productError) throw productError;
          if (!product) throw new Error("Produk belum terdaftar di Supabase.");
          const { error } = await supabase
            .from(TABLES.WISHLIST)
            .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
          if (error) throw error;
          setIds((current) => new Set(current).add(productId));
        }
      } catch (err) {
        console.error("Gagal mengubah status wishlist:", err);
        return { requiresLogin: false, error: err.message };
      }

      return { requiresLogin: false };
    },
    [ids, user]
  );

  return { ids, loading, isWishlisted, toggleWishlist };
}
