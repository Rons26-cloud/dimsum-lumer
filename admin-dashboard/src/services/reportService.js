import { getAll } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getSalesReport = (dateFrom, dateTo) => getAll(TABLES.ORDERS);
