import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/client.js";
import { additionalEnglish, legacyEnglish, translations } from "./translations.js";

const STORAGE_KEY = "dimsum-lumer-language";
const SUPPORTED = new Set(["id", "en"]);
const LanguageContext = createContext(null);
const textSources = new WeakMap();
const attributeSources = new WeakMap();

function getStoredLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.has(saved)) return saved;
  } catch { /* storage can be unavailable */ }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "id";
}

function translateLegacyText(value) {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const source = value.trim();
  if (!source) return value;
  // Only apply reviewed, complete-sentence translations. Replacement
  // kata per kata dapat merusak tata bahasa, nama produk, dan data pengguna.
  const result = additionalEnglish[source] || legacyEnglish[source] || source;
  return `${leading}${result}${trailing}`;
}

function localizeDocument(language) {
  document.documentElement.lang = language;
  const root = document.getElementById("root");
  if (!root) return () => {};
  const attributes = ["aria-label", "placeholder", "title"];

  const translateNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const current = node.nodeValue || "";
      const previous = textSources.get(node);
      const source = previous?.output === current ? previous.source : current;
      const output = language === "en" ? translateLegacyText(source) : source;
      textSources.set(node, { source, output });
      if (current !== output) node.nodeValue = output;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const sources = attributeSources.get(node) || {};
    for (const attribute of attributes) {
      if (!node.hasAttribute(attribute)) continue;
      const current = node.getAttribute(attribute) || "";
      const previous = sources[attribute];
      const source = previous?.output === current ? previous.source : current;
      const output = language === "en" ? translateLegacyText(source) : source;
      sources[attribute] = { source, output };
      if (current !== output) node.setAttribute(attribute, output);
    }
    attributeSources.set(node, sources);
  };

  const walk = (node) => {
    translateNode(node);
    node.childNodes?.forEach(walk);
  };
  walk(root);
  const observer = new MutationObserver((records) => {
    observer.disconnect();
    records.forEach((record) => {
      if (record.type === "characterData") translateNode(record.target);
      else record.addedNodes.forEach(walk);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => localizeDocument(language), [language]);
  useEffect(() => {
    let active = true;
    const applyAccountLanguage = (user) => {
      const accountLanguage = user?.user_metadata?.language;
      if (active && SUPPORTED.has(accountLanguage)) {
        setLanguageState(accountLanguage);
        try { window.localStorage.setItem(STORAGE_KEY, accountLanguage); } catch { /* noop */ }
      }
    };
    supabase.auth.getUser().then(({ data }) => {
      applyAccountLanguage(data?.user);
    }).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applyAccountLanguage(session?.user));
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    if (!SUPPORTED.has(nextLanguage)) return { error: new Error("Unsupported language") };
    setLanguageState(nextLanguage);
    try { window.localStorage.setItem(STORAGE_KEY, nextLanguage); } catch { /* noop */ }
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.auth.updateUser({ data: { language: nextLanguage } });
        if (error) throw error;
      }
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setSyncing(false);
    }
  }, []);

  const t = useCallback((key, variables = {}) => {
    let value = translations[language]?.[key] || translations.id[key] || key;
    Object.entries(variables).forEach(([name, replacement]) => {
      value = value.replaceAll(`{{${name}}}`, String(replacement));
    });
    return value;
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: language === "en" ? "en-US" : "id-ID",
    syncing,
    setLanguage,
    t,
  }), [language, setLanguage, syncing, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
