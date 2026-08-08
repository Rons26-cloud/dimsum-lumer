import { getAll } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getAllCustomers = () => getAll(TABLES.PROFILES);
