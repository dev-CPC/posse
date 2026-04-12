"use client";

import { useState, useRef, type KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Input({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      padding: "12px 16px", borderTop: "1px solid #2a2a2a",
      display: "flex", gap: 8, alignItems: "flex-end",
    }}>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        }}
        onKeyDown={handleKey}
        placeholder="Message…"
        rows={1}
        disabled={disabled}
        style={{
          flex: 1, resize: "none", padding: "8px 12px",
          borderRadius: 8, border: "1px solid #333",
          background: "#1a1a1a", color: "#eee", fontSize: 14,
          outline: "none", fontFamily: "inherit",
        }}
      />
      <button
        onClick={send}
        disabled={disabled || !text.trim()}
        style={{
          padding: "8px 16px", borderRadius: 8,
          background: text.trim() ? "#333" : "transparent",
          border: "1px solid #444", color: "#eee",
          fontSize: 14, cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
