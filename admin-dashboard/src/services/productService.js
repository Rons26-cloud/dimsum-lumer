import { getAll, insertRow, updateRow, deleteRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllProducts = () => getAll(TABLES.PRODUCTS, { order: { column: "created_at", ascending: false } });
export const getBestSellingProducts = (limit = 5) =>
  getAll(TABLES.PRODUCTS, { order: { column: "sold_count", ascending: false }, limit });
export const getLowStockProducts = (threshold = 10) => getAll(TABLES.PRODUCTS);
export const createProduct = (payload) => insertRow(TABLES.PRODUCTS, payload);
export const updateProduct = (id, payload) => updateRow(TABLES.PRODUCTS, id, payload);
export const deleteProduct = (id) => deleteRow(TABLES.PRODUCTS, id);
