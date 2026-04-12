"use client";

import { renderMarkdown } from "../lib/markdown";
import type { Message } from "../lib/types";

interface Props {
  messages: Message[];
  loading?: boolean;
}

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  user: {
    padding: "10px 14px", borderRadius: 12,
    background: "#2a2a2a", color: "#ddd", fontSize: 14, lineHeight: 1.5,
  },
  assistant: {
    padding: "10px 14px", borderRadius: 12,
    background: "#1a1a1a", color: "#ddd", fontSize: 14, lineHeight: 1.5,
  },
  tool: {
    padding: "8px 12px", borderRadius: 8,
    background: "#1a1a1a", color: "#999", fontSize: 12, lineHeight: 1.5,
    fontFamily: "monospace", whiteSpace: "pre-wrap", borderLeft: "2px solid #444",
  },
  system: {
    padding: "4px 12px", borderRadius: 8,
    color: "#555", fontSize: 11, fontStyle: "italic", textAlign: "center" as const,
  },
};

export function Chat({ messages, loading }: Props) {
  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "24px 16px",
      display: "flex", flexDirection: "column-reverse", gap: 8,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {messages.map((m, i) => {
        if (m.role === "system") {
          return (
            <div key={i} style={{ alignSelf: "center", ...ROLE_STYLES.system }}>
              {m.content}
            </div>
          );
        }

        return (
          <div key={i} style={{
            maxWidth: m.role === "tool" ? "90%" : "80%",
            width: "fit-content",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={ROLE_STYLES[m.role] || ROLE_STYLES.assistant}>
              {m.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              ) : (
                m.content
              )}
            </div>
            {m.timestamp && (
              <div style={{ fontSize: 10, color: "#444", marginTop: 2, paddingLeft: 4 }}>
                {new Date(m.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        );
      })}
      {loading && (
        <div style={{ alignSelf: "flex-start", color: "#666", fontSize: 13 }}>
          Thinking…
        </div>
      )}
      </div>
    </div>
  );
}
