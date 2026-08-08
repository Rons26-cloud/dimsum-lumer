import { getAll, insertRow, updateRow, deleteRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllStores = () => getAll(TABLES.STORES);
export const createStore = (payload) => insertRow(TABLES.STORES, payload);
export const updateStore = (id, payload) => updateRow(TABLES.STORES, id, payload);
export const deleteStore = (id) => deleteRow(TABLES.STORES, id);
