import { getAll, insertRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getProductReviews = (productId) =>
  getAll(TABLES.REVIEWS, { filters: { product_id: productId }, order: { column: "created_at", ascending: false } });
export const addReview = (payload) => insertRow(TABLES.REVIEWS, payload);
