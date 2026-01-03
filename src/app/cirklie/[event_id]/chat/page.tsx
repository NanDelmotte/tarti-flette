"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ChatFrame from "../../../../components/ChatFrame";

type Message = {
  id: string;
  profile_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

type EventInstance = {
  id: string;
  datetime: string;
  location: string | null;
};

function formatChatTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}-${hh}:${min}`;
}

export default function ChatPage({
  params,
}: {
  params: { event_id: string };
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [eventTitle, setEventTitle] = useState("Event");
  const [instances, setInstances] = useState<EventInstance[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  async function loadChat() {
    const res = await fetch("/api/chat?event_id=" + params.event_id);
    const data = await res.json();
    setMessages(data.messages || []);
    setEventTitle(data.event_title || "Event");
    setLoading(false);
  }

  async function loadEvent() {
    const res = await fetch("/api/events/" + params.event_id);
    const data = await res.json();
    setInstances(data.event?.event_instances || []);
  }

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setMyProfileId(data.user_id);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: params.event_id,
        message: text,
      }),
    });

    setText("");
    setSending(false);
    loadChat();
  }

  useEffect(() => {
    loadChat();
    loadEvent();
    loadMe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="min-h-screen bg-global">
      <ChatFrame>
        <div
          style={{
            width: "100%",
            textAlign: "left",
            fontSize: "12px",
            lineHeight: "1.65",
          }}
        >
           <Link
            href={`/dashboard`}
            style={{
              display: "block",
              textDecoration: "underline",
              marginBottom: "6px",
              textAlign: "left",
            }}
          >
            ← Home
          </Link>
          <Link
            href={`/cirklie/${params.event_id}`}
            style={{
              display: "block",
              textDecoration: "underline",
              marginBottom: "6px",
              textAlign: "left",
            }}
          >
            ← Event details
          </Link>

          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: "2px",
              textAlign: "left",
            }}
          >
            {eventTitle}
          </h1>

          {/* Ambient social context */}
          <p
            style={{
              fontSize: "11px",
              opacity: 0.6,
              marginBottom: "10px",
              fontStyle: "italic",
              textAlign: "left",
            }}
          >
            People you know — and people they know — are here
          </p>

          <div
            style={{
              opacity: 0.7,
              marginBottom: "12px",
              textAlign: "left",
            }}
          >
            {instances.map((i) => (
              <div key={i.id} style={{ textAlign: "left" }}>
                {new Date(i.datetime).toLocaleString()}
                {i.location && ` · ${i.location}`}
              </div>
            ))}
          </div>

          {/* CHAT BODY */}
          <div
            style={{
              width: "100%",
              padding: "8px 0",
              height: "60vh",
              maxHeight: "22rem",
              overflowY: "auto",
              textAlign: "left",
            }}
          >
            {loading && <p>Loading…</p>}

            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showAuthor = !prev || prev.profile_id !== m.profile_id;

              const authorLabel =
                m.profile_id === myProfileId ? "You" : m.author_name;

              return (
                <div
                  key={m.id}
                  style={{
                    marginBottom: showAuthor ? "12px" : "6px",
                  }}
                >
                  {showAuthor && (
                    <>
                      <div style={{ fontWeight: 600 }}>
                        {authorLabel}{" "}
                        <span style={{ opacity: 0.6 }}>
                          ({formatChatTime(m.created_at)})
                        </span>
                      </div>

                      <div
                        style={{
                          height: "1px",
                          width: "100%",
                          background: "rgba(0,0,0,0.10)",
                          margin: "4px 0 6px",
                        }}
                      />
                    </>
                  )}

                  <div>{m.message}</div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <form
            onSubmit={sendMessage}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(0,0,0,0.25)",
                fontSize: "12px",
              }}
            />

            <button
              type="submit"
              disabled={sending}
              className="button-campaign"
              style={{
                width: "100%",
                fontSize: "12px",
                padding: "10px",
              }}
            >
              Send
            </button>
          </form>
        </div>
      </ChatFrame>
    </main>
  );
}
