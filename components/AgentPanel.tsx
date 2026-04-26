"use client";

import { useState, useEffect } from "react";
import { createAgent, updateAgent, archiveAgent, listAgentVersions, listModels } from "../lib/api";
import type { Agent, AgentVersion, McpServer, ModelInfo } from "../lib/types";

interface Props {
  agent?: Agent | null; // null = create mode
  onClose: () => void;
  onSaved: (agent: Agent) => void;
  onArchived?: (agentId: string) => void;
}

const FALLBACK_MODELS = [
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-4-5-20251001",
];

const TOOL_PRESETS = [
  { type: "agent_toolset_20260401", label: "Agent Toolset (all tools)" },
];

const modal: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)", display: "flex", zIndex: 100,
};
const card: React.CSSProperties = {
  margin: "auto", width: "90%", maxWidth: 720, maxHeight: "85vh",
  background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12,
  display: "flex", flexDirection: "column", overflow: "hidden",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
  background: "#1a1a1a", border: "1px solid #333", color: "#eee",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "#888", display: "block", marginBottom: 4, fontWeight: 500,
};
const btnStyle: React.CSSProperties = {
  background: "transparent", border: "1px solid #333", borderRadius: 6,
  color: "#aaa", fontSize: 12, padding: "6px 14px", cursor: "pointer",
};

function normalizeMcpServers(value: unknown): McpServer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const name = typeof raw.name === "string" ? raw.name : "";
      const url = typeof raw.url === "string" ? raw.url : "";
      const type = typeof raw.type === "string" ? raw.type : "url";
      if (!name && !url) return null;
      return { type, name, url };
    })
    .filter((item): item is McpServer => !!item);
}

function makeMcpTool(serverName: string) {
  return { type: "mcp_toolset", mcp_server_name: serverName };
}

export function AgentPanel({ agent, onClose, onSaved, onArchived }: Props) {
  const isEdit = !!agent;

  const [name, setName] = useState(agent?.name || "");
  const [model, setModel] = useState(agent?.model?.id || FALLBACK_MODELS[0]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsError, setModelsError] = useState("");
  const [system, setSystem] = useState(agent?.system || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [useToolset, setUseToolset] = useState(
    agent ? agent.tools?.some((t: any) => t.type === "agent_toolset_20260401") : true
  );
  const [mcpServers, setMcpServers] = useState<McpServer[]>(normalizeMcpServers(agent?.mcp_servers));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (agent && showVersions && versions.length === 0) {
      listAgentVersions(agent.id)
        .then(setVersions)
        .catch(() => {});
    }
  }, [agent, showVersions, versions.length]);

  useEffect(() => {
    let cancelled = false;
    listModels()
      .then((items) => {
        if (cancelled) return;
        setModels(items);
        if (!model && items[0]?.id) setModel(items[0].id);
      })
      .catch((e: any) => {
        if (!cancelled) setModelsError(e.message || "Failed to load models");
      });
    return () => { cancelled = true; };
  }, [model]);

  const modelOptions = models.length
    ? models
    : FALLBACK_MODELS.map((id) => ({ id, display_name: id, created_at: "" }));
  const selectedMissing = model && !modelOptions.some((m) => m.id === model);

  const updateMcpServer = (index: number, patch: Partial<McpServer>) => {
    setMcpServers((servers) => servers.map((server, i) => i === index ? { ...server, ...patch } : server));
  };

  const addMcpServer = () => {
    setMcpServers((servers) => [...servers, { type: "url", name: "", url: "" }]);
  };

  const removeMcpServer = (index: number) => {
    setMcpServers((servers) => servers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    const normalizedMcpServers = mcpServers
      .map((server) => ({ type: "url", name: server.name.trim(), url: server.url.trim() }))
      .filter((server) => server.name || server.url);

    const seenMcpNames = new Set<string>();
    for (const server of normalizedMcpServers) {
      if (!server.name || !server.url) {
        setError("Each MCP server needs both a name and URL");
        return;
      }
      if (!/^https?:\/\//i.test(server.url)) {
        setError(`MCP server "${server.name}" needs an http:// or https:// URL`);
        return;
      }
      if (seenMcpNames.has(server.name)) {
        setError(`Duplicate MCP server name: ${server.name}`);
        return;
      }
      seenMcpNames.add(server.name);
    }

    setSaving(true);
    setError("");
    try {
      const tools = [
        ...(useToolset ? [{ type: "agent_toolset_20260401" }] : []),
        ...normalizedMcpServers.map((server) => makeMcpTool(server.name)),
      ];
      let result: Agent;
      if (isEdit) {
        result = await updateAgent(agent!.id, agent!.version, {
          name: name.trim(),
          model,
          system: system.trim() || null,
          description: description.trim() || null,
          tools,
          mcp_servers: normalizedMcpServers,
        });
      } else {
        result = await createAgent({
          name: name.trim(),
          model,
          system: system.trim() || undefined,
          description: description.trim() || undefined,
          tools,
          mcp_servers: normalizedMcpServers,
        });
      }
      onSaved(result);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!agent || !confirm(`Archive "${agent.name}"? Existing sessions continue, but no new sessions can use it.`)) return;
    setSaving(true);
    try {
      await archiveAgent(agent.id);
      onArchived?.(agent.id);
    } catch (e: any) {
      setError(e.message || "Failed to archive");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modal} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>
            {isEdit ? "Edit Agent" : "Create Agent"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isEdit && !agent?.archived_at && (
              <button
                style={{ ...btnStyle, color: "#fc533a", borderColor: "#fc533a44" }}
                onClick={handleArchive}
                disabled={saving}
              >
                Archive
              </button>
            )}
            {isEdit && (
              <button
                style={{ ...btnStyle, color: showVersions ? "#fcd53a" : "#aaa" }}
                onClick={() => setShowVersions(!showVersions)}
              >
                v{agent!.version} {showVersions ? "▴" : "▾"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}
            >×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {showVersions && versions.length > 0 && (
            <div style={{
              background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
              maxHeight: 180, overflowY: "auto", marginBottom: 4,
            }}>
              {versions.map((v) => (
                <div key={v.version} style={{
                  padding: "8px 12px", borderBottom: "1px solid #222",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#eee", fontWeight: 500 }}>
                      Version {v.version}
                    </span>
                    <span style={{ fontSize: 11, color: "#666", marginLeft: 8 }}>
                      {new Date(v.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>
                    {v.model?.id}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="My Agent" autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Model *</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {selectedMissing && <option value={model}>{model} (current)</option>}
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name ? `${m.display_name} — ${m.id}` : m.id}
                </option>
              ))}
            </select>
            {modelsError && (
              <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
                Couldn&apos;t load live models; using fallback list.
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this agent does" />
          </div>

          <div>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              style={{ ...inputStyle, height: 120, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              value={system} onChange={(e) => setSystem(e.target.value)} placeholder="You are a helpful coding agent."
            />
          </div>

          <div>
            <label style={labelStyle}>Tools</label>
            {TOOL_PRESETS.map((t) => (
              <label key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
                <input type="checkbox" checked={useToolset} onChange={(e) => setUseToolset(e.target.checked)} style={{ accentColor: "#fcd53a" }} />
                {t.label}
              </label>
            ))}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <label style={labelStyle}>MCP Servers</label>
                <div style={{ fontSize: 11, color: "#666", marginTop: -2 }}>
                  Remote streamable HTTP servers. Vault credentials come later.
                </div>
              </div>
              <button type="button" style={{ ...btnStyle, padding: "5px 10px" }} onClick={addMcpServer}>
                + Add server
              </button>
            </div>

            {mcpServers.length === 0 ? (
              <div style={{ fontSize: 12, color: "#666", marginTop: 8, padding: "10px 12px", border: "1px dashed #333", borderRadius: 8 }}>
                No MCP servers configured.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {mcpServers.map((server, index) => (
                  <div key={index} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 8, alignItems: "center" }}>
                      <input
                        style={inputStyle}
                        value={server.name}
                        onChange={(e) => updateMcpServer(index, { name: e.target.value })}
                        placeholder="github"
                      />
                      <input
                        style={inputStyle}
                        value={server.url}
                        onChange={(e) => updateMcpServer(index, { url: e.target.value })}
                        placeholder="https://api.example.com/mcp/"
                      />
                      <button
                        type="button"
                        style={{ ...btnStyle, padding: "6px 10px", color: "#fc533a", borderColor: "#fc533a44" }}
                        onClick={() => removeMcpServer(index)}
                        aria-label={`Remove MCP server ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEdit && (
            <div style={{ padding: "8px 0", borderTop: "1px solid #222" }}>
              <label style={labelStyle}>Agent ID</label>
              <code style={{ fontSize: 11, color: "#666", userSelect: "all" }}>{agent!.id}</code>
            </div>
          )}

          {agent?.archived_at && (
            <div style={{
              padding: "8px 12px", borderRadius: 6,
              background: "#2a1a1a", border: "1px solid #fc533a44",
              fontSize: 12, color: "#fc533a",
            }}>
              Archived on {new Date(agent.archived_at).toLocaleString()}
            </div>
          )}

          {error && <div style={{ fontSize: 12, color: "#fc533a" }}>{error}</div>}
        </div>

        <div style={{
          padding: "12px 20px", borderTop: "1px solid #2a2a2a",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button style={btnStyle} onClick={onClose}>Cancel</button>
          <button
            style={{ ...btnStyle, color: "#eee", borderColor: "#fcd53a66", background: "#fcd53a15", opacity: saving ? 0.5 : 1 }}
            onClick={handleSave}
            disabled={saving || !!agent?.archived_at}
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
