import { Check, Languages, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { translations } from "../../i18n/translations.js";

const options = [
  { value: "id", labelKey: "language.indonesian", short: "ID" },
  { value: "en", labelKey: "language.english", short: "EN" },
];

export default function LanguageSettings() {
  const { language, setLanguage, syncing, t } = useLanguage();
  const [message, setMessage] = useState("");

  const choose = async (value) => {
    if (value === language || syncing) return;
    setMessage("");
    const { error } = await setLanguage(value);
    setMessage(error ? error.message : translations[value]["language.saved"]);
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary"><Languages size={22} /></span>
      <h2 className="mt-4 text-base font-extrabold">{t("language.title")}</h2>
      <p className="mt-1 text-xs text-gray-500">{t("language.accountHint")}</p>
      <div className="mt-5 grid gap-2">
        {options.map((option) => {
          const active = language === option.value;
          return <button key={option.value} type="button" onClick={() => choose(option.value)} aria-pressed={active} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left transition ${active ? "border-primary bg-primary-50 text-primary" : "border-gray-100 bg-white text-dark"}`}>
            <span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black ${active ? "bg-primary text-white" : "bg-gray-100"}`}>{option.short}</span>
            <strong className="flex-1 text-xs">{t(option.labelKey)}</strong>
            {syncing && active ? <Loader2 size={17} className="animate-spin" /> : active ? <Check size={18} /> : null}
          </button>;
        })}
      </div>
      {message && <p aria-live="polite" className="mt-3 rounded-xl bg-green-50 p-3 text-[10px] text-green-700">{message}</p>}
    </section>
  );
}
