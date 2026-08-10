const csvCell = (value) => {
  if (value instanceof Date) return `"${value.toLocaleString("id-ID")}"`;
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
};

function timestamp() {
  const now = new Date();
  const date = now.toLocaleDateString("sv-SE");
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map((value) => String(value).padStart(2, "0")).join("-");
  return `${date}_${time}`;
}

export function downloadCsv(rows, baseName = "data-dashboard") {
  if (!Array.isArray(rows) || !rows.length) throw new Error("Tidak ada data yang dapat diekspor.");
  // Titik koma dibaca lebih konsisten sebagai kolom oleh Excel pada locale Indonesia.
  const content = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName}-${timestamp()}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 1000);
  return link.download;
}
