const rupiahFormatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return rupiahFormatter.format(Number.isFinite(amount) ? amount : 0).replace(/\s/g, "");
}

export function formatCompactCurrency(value) {
  const amount = Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  if (Math.abs(safe) >= 1_000_000_000) return `Rp${(safe / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(safe) >= 1_000_000) return `Rp${(safe / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (Math.abs(safe) >= 1_000) return `Rp${(safe / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return formatCurrency(safe);
}
