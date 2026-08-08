import { getAll } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getActivePromos = () => getAll(TABLES.PROMOS, { filters: { is_active: true } });
