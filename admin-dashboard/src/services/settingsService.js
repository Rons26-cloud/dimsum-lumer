import { getAll, updateRow } from "../supabase/database.js";

export const getStoreSettings = () => getAll("store_settings");
export const updateStoreSettings = (id, payload) => updateRow("store_settings", id, payload);
