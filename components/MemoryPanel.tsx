"use client";

import { useState, useEffect, useCallback } from "react";
import { listMemoryStores, listMemories, getMemory, writeMemory, updateMemory, deleteMemory, createMemoryStore } from "../lib/api";
import { renderMarkdown } from "../lib/markdown";
import type { MemoryStore, Memory } from "../lib/types";

interface Props {
  onClose: () => void;
}

export function MemoryPanel({ onClose }: Props) {
  const [stores, setStores] = useState<MemoryStore[]>([]);
  const [activeStore, setActiveStore] = useState<MemoryStore | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeMem, setActiveMem] = useState<Memory | null>(null);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreDesc, setNewStoreDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      setStoreError(null);
      const s = await listMemoryStores();
      setStores(s);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("404") || msg.includes("not_found")) {
        setStoreError("Your API key doesn't have access to memory stores.");
      } else {
        setStoreError(`Failed to load memory stores: ${msg}`);
      }
      setStores([]);
    }
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);

  // Load memories when store selected
  const loadMemories = useCallback(async (store: MemoryStore) => {
    try {
      const m = await listMemories(store.id, "/");
      setMemories(m);
    } catch (e) { console.error("Failed to load memories:", e); }
  }, []);

  useEffect(() => {
    if (activeStore) loadMemories(activeStore);
  }, [activeStore, loadMemories]);

  // Load single memory content
  const openMemory = async (mem: Memory) => {
    setActiveMem(mem);
    setEditing(false);
    setCreating(false);
    try {
      const full = await getMemory(activeStore!.id, mem.id);
      setContent(full.content || "");
    } catch (e) {
      setContent(`Error loading: ${e}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeMem || !activeStore) return;
    setLoading(true);
    try {
      await updateMemory(activeStore.id, activeMem.id, { content: editContent });
      setContent(editContent);
      setEditing(false);
      loadMemories(activeStore);
    } catch (e) { console.error("Save failed:", e); }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!activeMem || !activeStore) return;
    if (!confirm(`Delete ${activeMem.path}?`)) return;
    setLoading(true);
    try {
      await deleteMemory(activeStore.id, activeMem.id);
      setActiveMem(null);
      setContent("");
      loadMemories(activeStore);
    } catch (e) { console.error("Delete failed:", e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!activeStore || !newPath.trim()) return;
    setLoading(true);
    try {
      const path = newPath.startsWith("/") ? newPath : "/" + newPath;
      await writeMemory(activeStore.id, path, newContent);
      setCreating(false);
      setNewPath("");
      setNewContent("");
      loadMemories(activeStore);
    } catch (e) { console.error("Create failed:", e); }
    setLoading(false);
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;
    setLoading(true);
    try {
      const store = await createMemoryStore(newStoreName, newStoreDesc);
      setStores((prev) => [...prev, store]);
      setCreatingStore(false);
      setNewStoreName("");
      setNewStoreDesc("");
      setActiveStore(store);
    } catch (e) { console.error("Create store failed:", e); }
    setLoading(false);
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, color: "#666", textTransform: "uppercase",
    letterSpacing: "0.5px", padding: "8px 12px 4px",
  };
  const rowStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#ccc",
    background: active ? "#252525" : "transparent",
    borderLeft: active ? "2px solid #fcd53a" : "2px solid transparent",
    display: "flex", alignItems: "center", gap: 8,
  });
  const btnStyle: React.CSSProperties = {
    background: "transparent", border: "1px solid #333", borderRadius: 6,
    color: "#aaa", fontSize: 11, padding: "3px 8px", cursor: "pointer",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 13,
    background: "#1a1a1a", border: "1px solid #333", color: "#eee",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)", display: "flex", zIndex: 100,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: "auto", width: "90%", maxWidth: 900, height: "80vh",
          background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12,
          display: "flex", overflow: "hidden",
        }}
      >
        {/* Left: Store + memory list */}
        <div style={{
          width: 260, minWidth: 260, borderRight: "1px solid #2a2a2a",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Store list */}
          <div style={{ borderBottom: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 0" }}>
              <div style={sectionLabel}>Memory Stores</div>
              {/* + Store create button removed */}
            </div>
            {creatingStore && (
              <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <input style={inputStyle} placeholder="Store name" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} autoFocus />
                <input style={inputStyle} placeholder="Description" value={newStoreDesc} onChange={(e) => setNewStoreDesc(e.target.value)} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btnStyle} onClick={handleCreateStore} disabled={loading}>Create</button>
                  <button style={btnStyle} onClick={() => setCreatingStore(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {stores.map((s) => (
                <div key={s.id} onClick={() => { setActiveStore(s); setActiveMem(null); setContent(""); setCreating(false); }} style={rowStyle(s.id === activeStore?.id)}>
                  <span style={{ fontSize: 14 }}>📦</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{s.description?.slice(0, 40) || s.id.slice(0, 20)}</div>
                  </div>

                </div>
              ))}
              {stores.length === 0 && (
                <div style={{ padding: "12px", color: storeError ? "#fc533a" : "#555", fontSize: 12 }}>
                  {storeError || "No memory stores"}
                </div>
              )}
            </div>
          </div>

          {/* Memory list */}
          {activeStore && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 0" }}>
                <div style={sectionLabel}>Memories</div>
                {/* + New memory create button removed */}
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {memories.map((m) => (
                  <div key={m.id} onClick={() => openMemory(m)} style={rowStyle(m.id === activeMem?.id)}>
                    <span style={{ fontSize: 12, color: "#888" }}>📄</span>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace" }}>
                        {m.path}
                      </div>
                      <div style={{ fontSize: 10, color: "#555" }}>
                        {m.size_bytes ? `${m.size_bytes} bytes` : ""} · {new Date(m.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {memories.length === 0 && (
                  <div style={{ padding: "12px", color: "#555", fontSize: 12 }}>No memories in this store</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Content view */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid #2a2a2a",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#eee" }}>
              {creating ? "New Memory" : activeMem ? activeMem.path : activeStore ? activeStore.name : "Memory"}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {activeMem && !editing && (
                <>
                  <button style={btnStyle} onClick={() => { setEditing(true); setEditContent(content); }}>Edit</button>
                  <button style={{ ...btnStyle, color: "#fc533a" }} onClick={handleDelete}>Delete</button>
                </>
              )}
              {activeMem && editing && (
                <>
                  <button style={{ ...btnStyle, color: "#12c905" }} onClick={handleSaveEdit} disabled={loading}>Save</button>
                  <button style={btnStyle} onClick={() => setEditing(false)}>Cancel</button>
                </>
              )}
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {creating ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Path</label>
                  <input
                    style={inputStyle}
                    placeholder="/notes/example.md"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Content</label>
                  <textarea
                    style={{ ...inputStyle, height: 300, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    placeholder="Memory content..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btnStyle, color: "#12c905" }} onClick={handleCreate} disabled={loading}>
                    Create Memory
                  </button>
                  <button style={btnStyle} onClick={() => setCreating(false)}>Cancel</button>
                </div>
              </div>
            ) : editing ? (
              <textarea
                style={{
                  ...inputStyle, height: "100%", resize: "none",
                  fontFamily: "monospace", fontSize: 12,
                }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
            ) : activeMem ? (
              <div style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6 }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
              </div>
            ) : activeStore ? (
              <div style={{ color: "#888", fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}><strong>Name:</strong> {activeStore.name}</div>
                <div style={{ marginBottom: 8 }}><strong>Description:</strong> {activeStore.description || "—"}</div>
                <div style={{ marginBottom: 8 }}><strong>ID:</strong> <code style={{ fontSize: 11 }}>{activeStore.id}</code></div>
                <div><strong>Memories:</strong> {memories.length}</div>
              </div>
            ) : (
              <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                Select a memory store to browse
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
