import { useEffect, useState } from "react";
import { Archive, Loader2, MessageCircle, Send, UserRound, X } from "lucide-react";
import { supabase } from "../../supabase/client.js";

const NAME_KEY = "dimsum-live-chat-name",
  PHONE_KEY = "dimsum-live-chat-phone";
const BOT_GREETING =
  "Halo! Selamat datang di Dimsum Lumer 👋 Produk apa yang ingin Anda tanyakan? Sebutkan nama produk, varian, atau jumlah yang dibutuhkan ya.";
const BOT_MESSAGE = {
  id: "welcome-bot",
  sender_role: "bot",
  message: BOT_GREETING,
  created_at: new Date().toISOString(),
};
const stored = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};
const normalizePhone = (value) => {
  const digits = String(value).replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
};

export default function LiveChatWidget() {
  const [sessionUser, setSessionUser] = useState(null),
    [open, setOpen] = useState(false),
    [messages, setMessages] = useState([]),
    [conversations, setConversations] = useState([]),
    [archiveOpen, setArchiveOpen] = useState(false),
    [text, setText] = useState(""),
    [name, setName] = useState(() => stored(NAME_KEY)),
    [phone, setPhone] = useState(() => stored(PHONE_KEY)),
    [sending, setSending] = useState(false),
    [preparing, setPreparing] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSessionUser(data.session?.user || null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSessionUser(session?.user || null),
    );
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!open) return;
    const handleEnter = (event) => {
      const target = event.target;
      if (
        target?.tagName !== "TEXTAREA" ||
        target.placeholder !== "Tulis pesan..." ||
        event.key !== "Enter" ||
        event.shiftKey ||
        event.isComposing
      )
        return;
      event.preventDefault();
      target.form?.requestSubmit();
    };
    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [open]);
  const ensureGuest = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    setPreparing(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { live_chat_guest: true } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sesi tamu tidak tersedia.");
      setSessionUser(data.user);
      return data.user;
    } finally {
      setPreparing(false);
    }
  };
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !sessionUser) {
      setNotice("Menyiapkan live chat...");
      try {
        await ensureGuest();
        setNotice("");
      } catch (error) {
        setNotice(error.message);
      }
    }
  };
  const isRegisteredUser = Boolean(sessionUser && !sessionUser.is_anonymous);
  const closeChat = async () => {
    setOpen(false);
    setArchiveOpen(false);
    if (!sessionUser) return;
    try {
      await supabase.functions.invoke("close-live-chat", { body: {} });
    } catch {}
    if (sessionUser.is_anonymous) {
      setMessages([]);
      setConversations([]);
      setText("");
      await supabase.auth.signOut();
      setSessionUser(null);
    }
  };
  useEffect(() => {
    if (!sessionUser || !open) return;
    let active = true;
    const load = async () => {
      const [{ data: conversationRows }, { data: messageRows }] = await Promise.all([
        supabase.from("live_chat_conversations").select("*").eq("user_id", sessionUser.id).order("last_message_at", { ascending: false }),
        supabase.from("live_chat_messages").select("*").eq("user_id", sessionUser.id).order("created_at"),
      ]);
      if (active) {
        setConversations(conversationRows || []);
        setMessages(messageRows || []);
      }
    };
    load();
    const channel = supabase
      .channel(`customer-chat-${sessionUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_messages",
          filter: `user_id=eq.${sessionUser.id}`,
        },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sessionUser, open]);
  const send = async (e) => {
    e.preventDefault();
    const message = text.trim(),
      customerName = name.trim(),
      customerPhone = normalizePhone(phone);
    if (!message || sending) return;
    if (customerName.length < 2)
      return setNotice("Isi nama minimal 2 karakter.");
    if (!/^62\d{8,15}$/.test(customerPhone))
      return setNotice("Isi nomor WhatsApp aktif, contoh 6281234567890.");
    setSending(true);
    setNotice("");
    try {
      await ensureGuest();
      localStorage.setItem(NAME_KEY, customerName);
      localStorage.setItem(PHONE_KEY, customerPhone);
      const { data, error } = await supabase.functions.invoke(
        "send-live-chat",
        {
          body: {
            message,
            customer_name: customerName,
            customer_phone: customerPhone,
          },
        },
      );
      if (error || data?.error) {
        let detail = data?.error;
        try {
          detail = detail || JSON.parse(await error.context?.text())?.error;
        } catch {}
        throw new Error(
          detail || "Pesan belum dapat dikirim. Coba lagi sebentar.",
        );
      }
      setText("");
      setNotice("");
    } catch (error) {
      const authHint = /anonymous|signups|disabled/i.test(error.message || "");
      setNotice(
        authHint
          ? "Live chat tamu belum aktif. Aktifkan Anonymous Sign-Ins di Supabase Auth."
          : error.message,
      );
    } finally {
      setSending(false);
    }
  };
  const visibleConversationIds = new Set(
    conversations
      .filter((item) => archiveOpen ? item.status === "resolved" : item.status === "open")
      .map((item) => item.id),
  );
  const conversationMessages = messages.filter((item) =>
    visibleConversationIds.has(item.conversation_id),
  );
  const displayedMessages = (() => {
    if (archiveOpen) return conversationMessages;
    const firstCustomerIndex = conversationMessages.findIndex(
      (item) => item.sender_role === "customer",
    );
    if (firstCustomerIndex < 0) return conversationMessages;
    const result = [...conversationMessages];
    result.splice(firstCustomerIndex + 1, 0, {
      ...BOT_MESSAGE,
      created_at: conversationMessages[firstCustomerIndex].created_at,
    });
    return result;
  })();
  return (
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-[60] md:bottom-6 md:right-6">
      {open && (
        <section className="mb-3 flex h-[min(35rem,76dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
            <div>
              <h2 className="text-sm font-extrabold">Live Chat Dimsum Lumer</h2>
              <p className="text-[10px] text-white/85">
                Tanpa login · langsung ke admin
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isRegisteredUser && (
                <button
                  onClick={() => setArchiveOpen((value) => !value)}
                  aria-label={archiveOpen ? "Kembali ke chat" : "Arsip chat"}
                  title={archiveOpen ? "Kembali ke chat" : "Arsip chat"}
                  className={`grid h-9 w-9 place-items-center rounded-full ${archiveOpen ? "bg-white text-orange-600" : "bg-white/15"}`}
                >
                  {archiveOpen ? <MessageCircle size={16} /> : <Archive size={16} />}
                </button>
              )}
              <button
                onClick={closeChat}
                aria-label="Tutup dan arsipkan chat"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15"
              >
                <X size={17} />
              </button>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-2 border-b bg-white p-3">
            <label className="relative">
              <UserRound
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={13}
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Nama Anda"
                className="h-10 w-full rounded-xl border pl-8 pr-2 text-[10px] outline-none focus:border-orange-400"
              />
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              inputMode="tel"
              maxLength={17}
              placeholder="WhatsApp 628..."
              className="h-10 rounded-xl border px-3 text-[10px] outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-orange-50/40 p-3">
            {displayedMessages.length ? (
              displayedMessages.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-5 ${item.sender_role === "customer" ? "ml-auto rounded-br-md bg-orange-500 text-white" : "rounded-bl-md border bg-white text-gray-700"}`}
                >
                  <p>{item.message}</p>
                  <span
                    className={`mt-1 block text-[8px] ${item.sender_role === "customer" ? "text-white/70" : "text-gray-400"}`}
                  >
                    {new Date(item.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <MessageCircle className="mx-auto text-orange-400" />
                  <p className="mt-2 text-xs font-bold text-gray-700">
                    {archiveOpen ? "Arsip chat masih kosong." : "Ada yang bisa kami bantu?"}
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-gray-400">
                    Tidak perlu login. Isi identitas singkat lalu kirim pesan ke
                    admin.
                  </p>
                </div>
              </div>
            )}
          </div>
          {notice && (
            <p
              className={`border-t px-3 py-2 text-[9px] font-semibold ${notice.includes("belum") || notice.includes("Isi ") || notice.includes("aktif") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
            >
              {notice}
            </p>
          )}
          {!archiveOpen && <form onSubmit={send} className="flex gap-2 border-t p-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={1}
              placeholder="Tulis pesan..."
              className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-3 text-xs outline-none focus:border-orange-400"
            />
            <button
              disabled={!text.trim() || sending || preparing}
              aria-label="Kirim pesan"
              className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 text-white disabled:opacity-40"
            >
              {sending || preparing ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Send size={17} />
              )}
            </button>
          </form>}
        </section>
      )}
      <button
        onClick={open ? closeChat : toggle}
        className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-300/50"
        aria-label="Buka live chat"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
