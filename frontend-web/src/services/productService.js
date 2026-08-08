import { getAll, getById } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllProducts = (filters) =>
  getAll(TABLES.PRODUCTS, { filters, order: { column: "created_at", ascending: false } });

export const getProductBySlug = async (slug) => {
  const rows = await getAll(TABLES.PRODUCTS, { filters: { slug } });
  return rows[0] ?? null;
};

export const getProductById = (id) => getById(TABLES.PRODUCTS, id);

export const getPopularProducts = () =>
  getAll(TABLES.PRODUCTS, { order: { column: "sold_count", ascending: false } });

export const getCategories = () => getAll(TABLES.CATEGORIES, { order: { column: "name" } });
