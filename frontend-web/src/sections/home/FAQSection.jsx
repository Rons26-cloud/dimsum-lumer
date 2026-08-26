import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Berapa lama pengiriman?", a: "Estimasi 30–60 menit tergantung lokasi dan layanan pengiriman yang dipilih." },
  { q: "Apakah bisa custom pesanan?", a: "Bisa, tulis permintaan khusus pada kolom catatan saat checkout." },
  { q: "Apakah tersedia produk frozen?", a: "Tersedia. Pilih jenis Frozen pada detail produk untuk paket 20 pcs siap masak." },
  { q: "Di mana lokasi tokonya?", a: "Hongkong Fashion, Jalan Sisingamangaraja, Medan Amplas, Kota Medan." },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);
  return <section className="mt-5 px-3 xs:px-4" aria-labelledby="faq-title"><h2 id="faq-title" className="mb-2 text-base font-bold text-dark">Pertanyaan Umum</h2><div className="space-y-2">{faqs.map((faq, index) => { const isOpen = open === index; const panelId = `faq-answer-${index}`; return <div key={faq.q} className="overflow-hidden rounded-2xl border border-gray-100 bg-white"><h3><button type="button" onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={panelId} className="flex min-h-12 w-full items-center justify-between px-3.5 py-3 text-left"><span className="text-xs font-semibold text-dark">{faq.q}</span><ChevronDown aria-hidden="true" size={17} className={`shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/></button></h3>{isOpen && <p id={panelId} className="animate-fade-in px-3.5 pb-3.5 text-xs leading-5 text-gray-600">{faq.a}</p>}</div>; })}</div></section>;
}
