import { supabase } from "../supabase/client.js";
export async function getMerchantPaymentAccounts() { const { data, error } = await supabase.rpc("get_merchant_payment_accounts"); if (error) throw error; return Array.isArray(data) ? data : []; }
export function selectMerchantAccount(accounts, method) { return accounts.find((row) => row.method_code === method && row.is_primary) || accounts.find((row) => row.method_code === method) || accounts.find((row) => method === "transfer" && row.account_type === "bank") || null; }
