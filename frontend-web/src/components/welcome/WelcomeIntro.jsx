import { useEffect, useState } from "react";
import logo from "../../assets/logo/logo.png";
import { supabase } from "../../supabase/client.js";

const DEFAULTS = {
  enabled: true,
  require_action: true,
  message: "Halo! Selamat datang di Dimsum Lumer!",
};

const SWEET_VOICE_HINTS = ["female", "woman", "girl", "gadis", "siti", "damayanti", "cahya"];
const MALE_VOICE_HINTS = ["male", "man", "pria", "ardi", "andika", "dimas"];

function indonesianIntro(message) {
  const value = String(message || DEFAULTS.message).trim();
  return value.replace(/^hello\b[,.!\s-]*/i, "Halo! ");
}

function selectSweetIndonesianVoice(voices) {
  const indonesianVoices = voices.filter((voice) => /^id([-_]|$)/i.test(voice.lang));
  const malayVoices = voices.filter((voice) => /^ms([-_]|$)/i.test(voice.lang));
  const isSweet = (voice) =>
    SWEET_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint))
  const isMale = (voice) =>
    MALE_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint));
  return indonesianVoices.find(isSweet)
    || malayVoices.find(isSweet)
    || indonesianVoices.find((voice) => !isMale(voice))
    || malayVoices.find((voice) => !isMale(voice))
    || null;
}

function isEmbeddedPreview() {
  if (new URLSearchParams(window.location.search).get("source") === "apk") return true;
  try { return window.self !== window.top; } catch { return true; }
}

export default function WelcomeIntro({ children }) {
  const [config, setConfig] = useState(DEFAULTS);
  const [visible, setVisible] = useState(() => !isEmbeddedPreview());
  const [spokenText, setSpokenText] = useState("");
  const [isTalking, setIsTalking] = useState(true);
  const [speechAttempt, setSpeechAttempt] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    supabase.from("app_config").select("value").eq("key", "welcome_intro").maybeSingle()
      .then(({ data }) => {
        if (active && data?.value?.message) {
          setConfig((current) => ({ ...current, message: indonesianIntro(data.value.message) }));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const sentence = indonesianIntro(config.message);
    setSpokenText("");
    setIsTalking(true);
    let index = 0;
    let timer;
    let utterance;
    const typeNext = () => {
      index += 1;
      setSpokenText(sentence.slice(0, index));
      if (index >= sentence.length) {
        setIsTalking(false);
        return;
      }
      const previous = sentence[index - 1];
      timer = window.setTimeout(typeNext, previous === "," ? 320 : previous === " " ? 75 : 48);
    };
    const fallback = () => {
      window.clearTimeout(timer);
      if (index < sentence.length) timer = window.setTimeout(typeNext, index === 0 ? 0 : 48);
    };
    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "id-ID";
      // Karakter suara dibuat ceria dan lembut. Voice akhirnya tetap mengikuti
      // mesin TTS yang tersedia pada browser/perangkat pengguna.
      utterance.rate = 0.78;
      utterance.pitch = 1.82;
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = selectSweetIndonesianVoice(voices);
      utterance.onboundary = (event) => {
        window.clearTimeout(timer);
        const end = Math.min(sentence.length, Number(event.charIndex || 0) + Number(event.charLength || 1));
        index = Math.max(index, end);
        setSpokenText(sentence.slice(0, index));
        setIsTalking(index < sentence.length);
      };
      utterance.onstart = () => setIsTalking(true);
      utterance.onend = () => { index = sentence.length; setSpokenText(sentence); setIsTalking(false); };
      utterance.onerror = fallback;
      window.speechSynthesis.speak(utterance);
      timer = window.setTimeout(fallback, 750);
    } else {
      timer = window.setTimeout(typeNext, 350);
    }
    return () => {
      window.clearTimeout(timer);
      if (utterance) window.speechSynthesis.cancel();
    };
  }, [config.message, speechAttempt, visible]);

  const continueToMenu = () => setVisible(false);

  if (!visible) return children;
  return <>
    <div className="welcome-intro" role="status" aria-live="polite" aria-label="Selamat datang di Dimsum Lumer">
      <div className="welcome-glow" />
      <div className="welcome-speech">{spokenText}<span className={isTalking ? "welcome-caret" : "welcome-caret welcome-caret-done"}>|</span><button type="button" className="welcome-audio" onClick={() => setSpeechAttempt((value) => value + 1)} aria-label="Putar suara lagi">&#128264;</button></div>
      <div className={`welcome-mascot ${isTalking ? "is-talking" : ""}`} aria-hidden="true">
        <img src={logo} alt="" />
        <img src={logo} alt="" className="welcome-mouth-source" />
        <span className="welcome-eye welcome-eye-left" />
        <span className="welcome-eye welcome-eye-right" />
        <span className="welcome-cheek welcome-cheek-left" />
        <span className="welcome-cheek welcome-cheek-right" />
        <span className="welcome-spark welcome-spark-one">✦</span>
        <span className="welcome-spark welcome-spark-two">✦</span>
        <span className="welcome-spark welcome-spark-three">•</span>
      </div>
      <h1>Dimsum Lumer</h1>
      <p>Hangat, lembut, dan dibuat dengan sepenuh hati</p>
      <button type="button" className="welcome-continue" onClick={continueToMenu}>
        <span>Lanjut ke Menu</span><strong aria-hidden="true">&rarr;</strong>
      </button>
    </div>
    <div aria-hidden="true" className="invisible fixed inset-0">{children}</div>
  </>;
}
