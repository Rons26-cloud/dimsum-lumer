import { getAll, insertRow, updateRow, deleteRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllPromos = () => getAll(TABLES.PROMOS);
export const createPromo = (payload) => insertRow(TABLES.PROMOS, payload);
export const updatePromo = (id, payload) => updateRow(TABLES.PROMOS, id, payload);
export const deletePromo = (id) => deleteRow(TABLES.PROMOS, id);
