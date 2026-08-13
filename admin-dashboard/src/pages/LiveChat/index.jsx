import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { supabase } from "../../supabase/client.js";

export default function LiveChat() {
  const conversations = useLiveCollection("live_chat_conversations"),
    messages = useLiveCollection("live_chat_messages"),
    profiles = useLiveCollection("profiles");
  const [tab, setTab] = useState("inbox"),
    [selectedId, setSelectedId] = useState(null),
    [text, setText] = useState(""),
    [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const all = useMemo(
    () =>
      [...(conversations || [])].sort(
        (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at),
      ),
    [conversations],
  );
  const rows = useMemo(
    () =>
      all.filter((item) =>
        tab === "archive"
          ? item.status === "resolved"
          : item.status !== "resolved",
      ),
    [all, tab],
  );
  const active = rows.find((item) => item.id === selectedId) || rows[0] || null;
  const chat = useMemo(
    () =>
      [...(messages || [])]
        .filter((m) => m.conversation_id === active?.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages, active?.id],
  );
  const profile = (id) => (profiles || []).find((p) => p.id === id);
  const customerName = (conversation) =>
    conversation?.customer_name ||
    profile(conversation?.user_id)?.full_name ||
    profile(conversation?.user_id)?.name ||
    "Pelanggan";
  const unanswered = all.filter(
      (item) => item.status === "open" && !item.admin_replied_at,
    ).length,
    unread = all.filter(
      (item) => item.status === "open" && !item.admin_read_at,
    ).length,
    archived = all.filter((item) => item.status === "resolved").length,
    totalCustomers = new Set(all.map((item) => item.user_id)).size;
  useEffect(() => {
    if (!active || active.admin_read_at) return;
    let cancelled = false;
    const markAsRead = async () => {
      const { error: readError } = await supabase
        .from("live_chat_conversations")
        .update({ admin_read_at: new Date().toISOString() })
        .eq("id", active.id);
      if (!cancelled && readError)
        setError(`Status dibaca gagal diperbarui: ${readError.message}`);
    };
    markAsRead();
    return () => { cancelled = true; };
  }, [active?.id, active?.admin_read_at]);
  const send = async (e) => {
    e.preventDefault();
    if (!active || !text.trim() || active.status === "resolved") return;
    const target = {
      id: active.id,
      user_id: active.user_id,
      name: customerName(active),
    };
    setSending(true);
    setError("");
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("live_chat_messages")
      .insert({
        conversation_id: target.id,
        user_id: target.user_id,
        sender_role: "admin",
        message: text.trim(),
        is_read: true,
      });
    let conversationError = null;
    if (!insertError) {
      const result = await supabase
        .from("live_chat_conversations")
        .update({
          last_message_at: now,
          updated_at: now,
          admin_read_at: now,
          admin_replied_at: now,
        })
        .eq("id", target.id);
      conversationError = result.error;
    }
    setSending(false);
    if (insertError)
      return setError(
        `Balasan untuk ${target.name} gagal: ${insertError.message}`,
      );
    if (conversationError)
      return setError(
        `Pesan terkirim, tetapi status percakapan gagal diperbarui: ${conversationError.message}`,
      );
    setText("");
  };
  const resolve = async () => {
    if (!active) return;
    const opening = active.status === "resolved";
    setError("");
    if (opening) {
      const { data: existingOpen, error: lookupError } = await supabase
        .from("live_chat_conversations")
        .select("id")
        .eq("user_id", active.user_id)
        .eq("status", "open")
        .neq("id", active.id)
        .limit(1)
        .maybeSingle();
      if (lookupError) {
        setError(`Chat aktif gagal diperiksa: ${lookupError.message}`);
        return;
      }
      if (existingOpen) {
        setTab("inbox");
        setSelectedId(existingOpen.id);
        setError("Pelanggan ini sudah memiliki chat aktif. Dashboard membuka chat aktif tersebut.");
        return;
      }
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("live_chat_conversations")
      .update(
        opening
          ? {
              status: "open",
              resolved_at: null,
              resolved_by: null,
              updated_at: now,
            }
          : {
              status: "resolved",
              resolved_at: now,
              resolved_by: user?.id || null,
              admin_read_at: active.admin_read_at || now,
              updated_at: now,
            },
      )
      .eq("id", active.id);
    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "Pelanggan ini sudah memiliki chat aktif. Gunakan percakapan di Inbox."
          : `Status percakapan gagal diperbarui: ${updateError.message}`,
      );
      return;
    }
    setSelectedId(null);
  };
  const handleReplyKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
            <MessageCircle />
          </span>
          <div>
            <h1 className="text-xl font-bold">Live Chat Pelanggan</h1>
            <p className="text-xs text-gray-500">
              Baca, balas, selesaikan, dan arsipkan percakapan dari satu
              halaman.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Stat Icon={Users} label="Pelanggan" value={totalCustomers} tone="blue" />
          <Stat Icon={Mail} label="Belum dibaca" value={unread} tone="red" />
          <Stat
            Icon={MessageCircle}
            label="Belum dibalas"
            value={unanswered}
            tone="amber"
          />
          <Stat Icon={Archive} label="Arsip" value={archived} tone="gray" />
        </div>
      </header>
      <section className="grid min-h-[68vh] overflow-hidden rounded-2xl border bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
        <aside className="border-b bg-gray-50/60 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-2 gap-1 border-b p-2">
            <button
              onClick={() => {
                setTab("inbox");
                setSelectedId(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-bold ${tab === "inbox" ? "bg-orange-500 text-white" : "text-gray-500"}`}
            >
              <Inbox size={14} />
              Inbox
            </button>
            <button
              onClick={() => {
                setTab("archive");
                setSelectedId(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-bold ${tab === "archive" ? "bg-gray-900 text-white" : "text-gray-500"}`}
            >
              <Archive size={14} />
              Arsip
            </button>
          </div>
          <div className="max-h-[65vh] overflow-y-auto p-2">
            {conversations === null ? (
              <Loader2 className="mx-auto mt-10 animate-spin text-orange-500" />
            ) : rows.length ? (
              rows.map((item, index) => {
                const latest = [...(messages || [])]
                  .filter((m) => m.conversation_id === item.id)
                  .sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at),
                  )
                  .pop();
                const needsAttention =
                  !item.admin_read_at || !item.admin_replied_at;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`mb-1 w-full rounded-xl border p-3 text-left ${active?.id === item.id ? "border-orange-300 bg-orange-50" : "border-transparent hover:bg-white"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`relative grid h-10 w-10 place-items-center rounded-full ${needsAttention ? "bg-red-50 text-red-600" : "bg-white text-gray-500"}`}
                      >
                        <UserRound size={16} />
                        {!item.admin_read_at && (
                          <i className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-red-600" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs">
                          {customerName(item)}
                        </strong>
                        <span className="block truncate text-[8px] font-semibold text-orange-500">
                          Chat #{rows.length - index}{item.is_guest ? " · TAMU" : " · MEMBER"}
                        </span>
                        <span className="mt-0.5 block truncate text-[9px] text-gray-400">
                          {latest?.message || "Percakapan baru"}
                        </span>
                        <span
                          className={`mt-1 inline-block text-[8px] font-bold ${item.status === "resolved" ? "text-gray-400" : item.admin_replied_at ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {item.status === "resolved"
                            ? "SELESAI"
                            : item.admin_replied_at
                              ? "SUDAH DIBALAS"
                              : "BELUM DIBALAS"}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="p-8 text-center text-xs text-gray-400">
                {tab === "archive"
                  ? "Belum ada chat yang diarsipkan."
                  : "Inbox sedang kosong."}
              </p>
            )}
          </div>
        </aside>
        <main className="flex min-h-[34rem] flex-col">
          {active ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <strong className="text-sm">
                    {customerName(active)}
                  </strong>
                  <p className="text-[9px] text-gray-400">
                    {active.customer_phone
                      ? `WhatsApp: +${active.customer_phone}`
                      : profile(active.user_id)?.email || active.user_id}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[8px] text-gray-400">
                    <Clock3 size={10} />
                    Dimulai{" "}
                    {new Date(active.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={resolve}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold ${active.status === "resolved" ? "bg-orange-50 text-orange-700" : "bg-gray-900 text-white"}`}
                >
                  {active.status === "resolved" ? (
                    <Inbox size={14} />
                  ) : (
                    <CheckCheck size={14} />
                  )}{" "}
                  {active.status === "resolved"
                    ? "Kembalikan ke inbox"
                    : "Selesaikan & arsipkan"}
                </button>
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto bg-orange-50/20 p-4">
                {chat.map((item) => (
                  <div
                    key={item.id}
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-5 ${item.sender_role === "admin" ? "ml-auto rounded-br-md bg-gray-900 text-white" : "rounded-bl-md border bg-white text-gray-700"}`}
                  >
                    <p>{item.message}</p>
                    <span className="mt-1 block text-[8px] opacity-60">
                      {new Date(item.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              {error && (
                <p className="bg-red-50 px-4 py-2 text-[10px] text-red-600">
                  {error}
                </p>
              )}
              {active.status === "resolved" ? (
                <div className="border-t bg-gray-50 p-4 text-center text-[10px] font-semibold text-gray-500">
                  Percakapan selesai dan tersimpan di arsip.
                </div>
              ) : (
                <form onSubmit={send} className="flex gap-2 border-t p-4">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    maxLength={1000}
                    placeholder={`Balas ${customerName(active)}...`}
                    className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-3 text-xs outline-none focus:border-orange-400"
                  />
                  <button
                    disabled={!text.trim() || sending}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <Send size={15} />
                    )}
                    Kirim
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-center text-gray-400">
              <div>
                <MessageCircle className="mx-auto" size={34} />
                <p className="mt-2 text-xs">
                  Pilih percakapan untuk membuka detail.
                </p>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function Stat({ Icon, label, value, tone }) {
  const colors = {
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div
      className={`flex min-w-24 items-center gap-2 rounded-xl px-3 py-2 ${colors[tone]}`}
    >
      <Icon size={14} />
      <span>
        <strong className="block text-sm leading-none">{value}</strong>
        <small className="text-[8px] font-semibold">{label}</small>
      </span>
    </div>
  );
}
