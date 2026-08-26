import { useEffect, useState } from "react";
import { getMerchantPaymentAccounts } from "../services/merchantAccountService.js";
export function useMerchantAccounts() { const [accounts, setAccounts] = useState([]); useEffect(() => { let active = true; getMerchantPaymentAccounts().then((rows) => { if (active) setAccounts(rows); }).catch(() => {}); return () => { active = false; }; }, []); return accounts; }
