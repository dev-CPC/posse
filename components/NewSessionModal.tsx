"use client";

import { useState, useEffect } from "react";
import { listMemoryStores, createSession } from "../lib/api";
import type { Agent, Environment, Session, MemoryStore } from "../lib/types";

interface Props {
  agents: Agent[];
  environments: Environment[];
  defaultAgentId?: string;
  defaultEnvId?: string;
  onCreated: (session: Session) => void;
  onClose: () => void;
}

export function NewSessionModal({
  agents, environments,
  defaultAgentId, defaultEnvId,
  onCreated, onClose,
}: Props) {
  const [agentId, setAgentId] = useState(defaultAgentId || agents[0]?.id || "");
  const [envId, setEnvId] = useState(defaultEnvId || environments[0]?.id || "");
  const [stores, setStores] = useState<MemoryStore[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMemoryStores().then(setStores).catch(() => {
      setStores([]);
    });
  }, []);

  const toggleStore = (id: string) => {
    setSelectedStores((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!agentId || !envId) return;
    setCreating(true);
    setError("");
    try {
      const storeIds = Array.from(selectedStores);
      const resources: Array<Record<string, string>> = storeIds.map((id) => ({
        type: "memory_store",
        memory_store_id: id,
        access: "read_write",
      }));

      const body: Record<string, unknown> = {
        agent: agentId,
        environment_id: envId,
      };
      if (resources.length) body.resources = resources;
      if (instructions.trim()) body.system = instructions.trim();

      // Use raw api call through proxy
      const res = await fetch(`/api/anthropic?path=${encodeURIComponent("/v1/sessions")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      const session: Session = await res.json();
      onCreated(session);
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: "#888", fontWeight: 500, textTransform: "uppercase",
    letterSpacing: "0.5px", marginBottom: 6, display: "block",
  };
  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
    background: "#1a1a1a", border: "1px solid #333", color: "#eee",
    outline: "none", boxSizing: "border-box", appearance: "none",
    WebkitAppearance: "none",
  };
  const inputStyle: React.CSSProperties = {
    ...selectStyle,
  };

  const selectedAgent = agents.find((a) => a.id === agentId);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12,
          width: 480, maxHeight: "85vh", overflowY: "auto", padding: 0,
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#eee" }}>New Session</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}
          >×</button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Agent */}
          <div>
            <label style={labelStyle}>Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              style={selectStyle}
            >
              {agents.filter((a) => !a.archived_at).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {selectedAgent && (
              <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "monospace" }}>
                {selectedAgent.model.id}
              </div>
            )}
          </div>

          {/* Environment */}
          <div>
            <label style={labelStyle}>Environment</label>
            <select
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
              style={selectStyle}
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>{env.name || env.id.slice(0, 24)}</option>
              ))}
            </select>
          </div>

          {/* Memory Stores */}
          <div>
            <label style={labelStyle}>Memory Stores</label>
            {stores.length === 0 ? (
              <div style={{ fontSize: 12, color: "#555" }}>No memory stores available</div>
            ) : (
              <div style={{
                border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden",
                maxHeight: 180, overflowY: "auto",
              }}>
                {stores.map((s) => {
                  const checked = selectedStores.has(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStore(s.id)}
                      style={{
                        padding: "8px 12px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10,
                        background: checked ? "#1e1e1e" : "transparent",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: checked ? "2px solid #fcd53a" : "2px solid #444",
                        background: checked ? "#fcd53a22" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#fcd53a",
                      }}>
                        {checked ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 13, color: "#ddd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.name}
                        </div>
                        {s.description && (
                          <div style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
              Selected stores give the agent memory tools (read, write, search, list)
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label style={labelStyle}>Custom Instructions <span style={{ color: "#555", textTransform: "none" }}>(optional)</span></label>
            <textarea
              style={{
                ...inputStyle, height: 80, resize: "vertical",
                fontFamily: "monospace", fontSize: 12,
              }}
              placeholder="Additional system instructions for this session..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: "#fc533a", background: "#1a1111", padding: "8px 12px", borderRadius: 6 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 20px", borderTop: "1px solid #2a2a2a",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 13,
              background: "transparent", border: "1px solid #333", color: "#aaa",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !agentId || !envId}
            style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: creating ? "#333" : "#fcd53a", color: "#111",
              border: "none", cursor: creating ? "default" : "pointer",
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? "Creating…" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
