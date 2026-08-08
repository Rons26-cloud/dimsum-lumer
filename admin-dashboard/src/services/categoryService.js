import { getAll, insertRow, updateRow, deleteRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllCategories = () => getAll(TABLES.CATEGORIES);
export const createCategory = (payload) => insertRow(TABLES.CATEGORIES, payload);
export const updateCategory = (id, payload) => updateRow(TABLES.CATEGORIES, id, payload);
export const deleteCategory = (id) => deleteRow(TABLES.CATEGORIES, id);
