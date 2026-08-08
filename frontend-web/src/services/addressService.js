import { getAll, insertRow, updateRow, deleteRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAddresses = (userId) => getAll(TABLES.ADDRESSES, { filters: { user_id: userId } });
export const addAddress = (payload) => insertRow(TABLES.ADDRESSES, payload);
export const updateAddress = (id, payload) => updateRow(TABLES.ADDRESSES, id, payload);
export const deleteAddress = (id) => deleteRow(TABLES.ADDRESSES, id);
