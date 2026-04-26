"use client";

import { useEffect, useState, useCallback } from "react";
import { createStaticBearerCredential, createVault, listVaultCredentials, listVaults } from "../lib/api";
import type { McpServer, Vault, VaultCredential } from "../lib/types";

interface Props {
  agentsMcpServers: McpServer[];
  onClose: () => void;
  onChanged?: () => void;
}

const btnStyle: React.CSSProperties = {
  background: "transparent", border: "1px solid #333", borderRadius: 6,
  color: "#aaa", fontSize: 12, padding: "6px 12px", cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
  background: "#1a1a1a", border: "1px solid #333", color: "#eee",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "#888", display: "block", marginBottom: 4, fontWeight: 500,
};

export function VaultPanel({ agentsMcpServers, onClose, onChanged }: Props) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [activeVault, setActiveVault] = useState<Vault | null>(null);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [creatingVault, setCreatingVault] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [creatingCredential, setCreatingCredential] = useState(false);
  const [mcpServerUrl, setMcpServerUrl] = useState(agentsMcpServers[0]?.url || "");
  const [credentialName, setCredentialName] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadVaults = useCallback(async () => {
    try {
      setError("");
      const items = await listVaults();
      setVaults(items);
      setActiveVault((prev) => prev || items[0] || null);
    } catch (e: any) {
      setError(e.message || "Failed to load vaults");
    }
  }, []);

  const loadCredentials = useCallback(async (vault: Vault) => {
    try {
      setCredentials(await listVaultCredentials(vault.id));
    } catch (e: any) {
      setError(e.message || "Failed to load credentials");
      setCredentials([]);
    }
  }, []);

  useEffect(() => { loadVaults(); }, [loadVaults]);
  useEffect(() => { if (activeVault) loadCredentials(activeVault); }, [activeVault, loadCredentials]);

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const vault = await createVault(newVaultName.trim());
      setVaults((prev) => [vault, ...prev]);
      setActiveVault(vault);
      setNewVaultName("");
      setCreatingVault(false);
      onChanged?.();
    } catch (e: any) {
      setError(e.message || "Failed to create vault");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = async () => {
    if (!activeVault || !mcpServerUrl.trim() || !token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const credential = await createStaticBearerCredential(activeVault.id, {
        mcpServerUrl: mcpServerUrl.trim(),
        token: token.trim(),
        displayName: credentialName.trim() || undefined,
      });
      setCredentials((prev) => [credential, ...prev]);
      setToken("");
      setCredentialName("");
      setCreatingCredential(false);
      onChanged?.();
    } catch (e: any) {
      setError(e.message || "Failed to create credential");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", zIndex: 100 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ margin: "auto", width: "90%", maxWidth: 880, height: "80vh", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 260, borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase" }}>Vaults</div>
            <button style={btnStyle} onClick={() => setCreatingVault(true)}>+ Vault</button>
          </div>
          {creatingVault && (
            <div style={{ padding: 12, borderBottom: "1px solid #2a2a2a", display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={inputStyle} placeholder="Vault name" value={newVaultName} onChange={(e) => setNewVaultName(e.target.value)} autoFocus />
              <div style={{ display: "flex", gap: 6 }}>
                <button style={btnStyle} onClick={handleCreateVault} disabled={loading}>Create</button>
                <button style={btnStyle} onClick={() => setCreatingVault(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ overflowY: "auto", padding: "8px 0" }}>
            {vaults.map((vault) => (
              <div key={vault.id} onClick={() => setActiveVault(vault)} style={{ padding: "9px 12px", cursor: "pointer", background: vault.id === activeVault?.id ? "#252525" : "transparent", borderLeft: vault.id === activeVault?.id ? "2px solid #fcd53a" : "2px solid transparent" }}>
                <div style={{ fontSize: 13, color: "#eee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vault.display_name}</div>
                <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginTop: 2 }}>{vault.id.slice(0, 22)}…</div>
              </div>
            ))}
            {vaults.length === 0 && <div style={{ padding: 12, color: "#555", fontSize: 12 }}>No vaults</div>}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, color: "#eee", fontWeight: 600 }}>{activeVault?.display_name || "MCP Auth"}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Static bearer credentials. Secrets are write-only.</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {activeVault && (
              <button style={{ ...btnStyle, alignSelf: "flex-start", color: "#eee", borderColor: "#fcd53a66", background: "#fcd53a15" }} onClick={() => setCreatingCredential(true)}>
                + Add MCP credential
              </button>
            )}

            {creatingCredential && activeVault && (
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={labelStyle}>MCP server URL</label>
                  <select value={mcpServerUrl} onChange={(e) => setMcpServerUrl(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {agentsMcpServers.map((server) => <option key={`${server.name}:${server.url}`} value={server.url}>{server.name} — {server.url}</option>)}
                    {!agentsMcpServers.some((s) => s.url === mcpServerUrl) && mcpServerUrl && <option value={mcpServerUrl}>{mcpServerUrl}</option>}
                  </select>
                  <input style={{ ...inputStyle, marginTop: 8 }} placeholder="Or paste MCP server URL" value={mcpServerUrl} onChange={(e) => setMcpServerUrl(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Credential name</label>
                  <input style={inputStyle} placeholder="GitHub token" value={credentialName} onChange={(e) => setCredentialName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Bearer token</label>
                  <input style={inputStyle} type="password" placeholder="Token is sent once and never shown again" value={token} onChange={(e) => setToken(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btnStyle, color: "#eee", borderColor: "#fcd53a66" }} onClick={handleCreateCredential} disabled={loading || !mcpServerUrl.trim() || !token.trim()}>Save credential</button>
                  <button style={btnStyle} onClick={() => setCreatingCredential(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {credentials.map((credential) => (
                <div key={credential.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#eee", fontWeight: 500 }}>{credential.display_name || credential.auth.type}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 4, wordBreak: "break-all" }}>{credential.auth.mcp_server_url}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{credential.auth.type}</div>
                  </div>
                </div>
              ))}
              {activeVault && credentials.length === 0 && <div style={{ padding: 14, border: "1px dashed #333", borderRadius: 8, color: "#555", fontSize: 12 }}>No credentials in this vault</div>}
            </div>

            {error && <div style={{ color: "#fc533a", fontSize: 12, background: "#1a1111", borderRadius: 6, padding: 10 }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
