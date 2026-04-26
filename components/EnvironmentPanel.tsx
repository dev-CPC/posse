"use client";

import { useState } from "react";
import { createEnvironment } from "../lib/api";
import type { Environment } from "../lib/types";

interface Props {
  onClose: () => void;
  onCreated: (env: Environment) => void;
}

type PackageManager = "apt" | "npm" | "pip";
type NetworkMode = "unrestricted" | "limited";

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function EnvironmentPanel({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [networking, setNetworking] = useState<NetworkMode>("unrestricted");
  const [allowedHosts, setAllowedHosts] = useState("");
  const [allowPackageManagers, setAllowPackageManagers] = useState(true);
  const [allowMcpServers, setAllowMcpServers] = useState(false);
  const [packages, setPackages] = useState<Record<PackageManager, string>>({
    apt: "",
    npm: "",
    pip: "",
  });
  const [rawConfig, setRawConfig] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#888",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#eee",
    outline: "none",
    boxSizing: "border-box",
  };

  const buildConfig = () => {
    if (rawConfig.trim()) {
      return JSON.parse(rawConfig);
    }

    const pkgEntries = Object.entries(packages).reduce<Record<string, string[]>>((acc, [manager, value]) => {
      const list = parseLines(value);
      if (list.length) acc[manager] = list;
      return acc;
    }, {});

    const config: Record<string, unknown> = {
      type: "cloud",
      networking: networking === "unrestricted"
        ? { type: "unrestricted" }
        : {
            type: "limited",
            allowed_hosts: parseLines(allowedHosts),
            allow_package_managers: allowPackageManagers,
            allow_mcp_servers: allowMcpServers,
          },
    };

    if (Object.keys(pkgEntries).length) config.packages = pkgEntries;
    return config;
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setCreating(true);
    setError("");
    try {
      const env = await createEnvironment({
        name: trimmedName,
        config: buildConfig(),
      });
      onCreated(env);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

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
          width: 520, maxHeight: "85vh", overflowY: "auto", padding: 0,
        }}
      >
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#eee" }}>New Environment</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
              Reusable cloud container template for sessions
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}
          >×</button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="python-dev"
              style={inputStyle}
              autoFocus
            />
            <div style={{ fontSize: 10, color: "#555", marginTop: 5 }}>
              Must be unique in your Anthropic workspace.
            </div>
          </div>

          <div>
            <label style={labelStyle}>Networking</label>
            <select
              value={networking}
              onChange={(e) => setNetworking(e.target.value as NetworkMode)}
              style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}
              disabled={!!rawConfig.trim()}
            >
              <option value="unrestricted">Unrestricted outbound</option>
              <option value="limited">Limited to allowed hosts</option>
            </select>
          </div>

          {networking === "limited" && !rawConfig.trim() && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Allowed hosts</label>
                <textarea
                  value={allowedHosts}
                  onChange={(e) => setAllowedHosts(e.target.value)}
                  placeholder={"https://api.example.com\nhttps://github.com"}
                  style={{ ...inputStyle, height: 70, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#aaa" }}>
                <input
                  type="checkbox"
                  checked={allowPackageManagers}
                  onChange={(e) => setAllowPackageManagers(e.target.checked)}
                />
                Allow package managers
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#aaa" }}>
                <input
                  type="checkbox"
                  checked={allowMcpServers}
                  onChange={(e) => setAllowMcpServers(e.target.checked)}
                />
                Allow configured MCP servers
              </label>
            </div>
          )}

          <div>
            <label style={labelStyle}>Packages <span style={{ color: "#555", textTransform: "none" }}>(optional, one per line)</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(["apt", "npm", "pip"] as PackageManager[]).map((manager) => (
                <div key={manager}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontFamily: "monospace" }}>{manager}</div>
                  <textarea
                    value={packages[manager]}
                    onChange={(e) => setPackages((prev) => ({ ...prev, [manager]: e.target.value }))}
                    placeholder={manager === "apt" ? "ffmpeg" : manager === "npm" ? "express" : "pandas"}
                    style={{ ...inputStyle, height: 76, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    disabled={!!rawConfig.trim()}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Raw config override <span style={{ color: "#555", textTransform: "none" }}>(optional JSON)</span></label>
            <textarea
              value={rawConfig}
              onChange={(e) => setRawConfig(e.target.value)}
              placeholder={'{\n  "type": "cloud",\n  "networking": { "type": "unrestricted" }\n}'}
              style={{ ...inputStyle, height: 92, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />
            <div style={{ fontSize: 10, color: "#555", marginTop: 5 }}>
              If set, this exact config is sent and form fields above are ignored.
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#fc533a", background: "#1a1111", padding: "8px 12px", borderRadius: 6, whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}
        </div>

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
            disabled={creating || !name.trim()}
            style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: creating ? "#333" : "#fcd53a", color: "#111",
              border: "none", cursor: creating ? "default" : "pointer",
              opacity: creating || !name.trim() ? 0.6 : 1,
            }}
          >
            {creating ? "Creating…" : "Create Environment"}
          </button>
        </div>
      </div>
    </div>
  );
}
