"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Settings, Key, Server, Hash } from "lucide-react";
import { AppSettings as SettingsType, getSettings, saveSettings } from "@/lib/settings";

interface Props {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
    const [config, setConfig] = useState<SettingsType>({
        provider: "openai",
        baseUrl: "",
        modelId: "",
        apiKey: "",
        tavilyApiKey: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setConfig(getSettings());
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        saveSettings(config);

        // Simulating a brief save state for UX
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 400);
    }, [config, onClose]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-glass-heavy)",
                backdropFilter: "blur(24px)",
                padding: "1rem"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="glass-panel"
                style={{
                    width: "100%",
                    maxWidth: "550px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                }}
            >
                {/* Decorative top blur */}
                <div style={{ position: "absolute", top: "-50px", left: "50%", transform: "translateX(-50%)", width: "100%", height: "100px", background: "var(--accent-glow)", filter: "blur(40px)", pointerEvents: "none", zIndex: 0 }} />

                <div style={{
                    padding: "2rem",
                    borderBottom: "1px solid var(--border-glass)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 1
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                            <Settings size={20} color="var(--text-primary)" />
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem", color: "var(--text-primary)" }}>
                            Configuration
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", zIndex: 1 }}>
                    {/* LLM Provider */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontWeight: 500 }}>
                            <Server size={14} /> AI Provider
                        </label>
                        <select
                            name="provider"
                            value={config.provider}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-glass)",
                                borderRadius: "12px",
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-body)",
                                fontSize: "1rem",
                                outline: "none",
                                WebkitAppearance: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                        >
                            <option value="openai">OpenAI Collection</option>
                            <option value="anthropic">Anthropic Claude</option>
                            <option value="google">Google Gemini</option>
                            <option value="groq">Groq Fast Inference</option>
                            <option value="ollama">Ollama (Local Models)</option>
                            <option value="custom">Custom Endpoint</option>
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontWeight: 500 }}>
                            <Key size={14} /> Provider Authentication Key
                        </label>
                        <input
                            type="password"
                            name="apiKey"
                            value={config.apiKey}
                            onChange={handleChange}
                            placeholder="sk-..."
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-glass)",
                                borderRadius: "12px",
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-body)",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        {/* Custom Base URL */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontWeight: 500 }}>
                                URL Override (Optional)
                            </label>
                            <input
                                type="text"
                                name="baseUrl"
                                value={config.baseUrl}
                                onChange={handleChange}
                                placeholder="https://api..."
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "12px",
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "1rem",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                            />
                        </div>

                        {/* Custom Model ID */}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontWeight: 500 }}>
                                <Hash size={14} /> Model Identifier
                            </label>
                            <input
                                type="text"
                                name="modelId"
                                value={config.modelId}
                                onChange={handleChange}
                                placeholder="gpt-4o-mini"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "12px",
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "1rem",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                            />
                        </div>
                    </div>

                    {/* Tavily Key */}
                    <div style={{ marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontWeight: 500 }}>
                            <Key size={14} /> Tavily Web Search Key (Required for live crawls)
                        </label>
                        <input
                            type="password"
                            name="tavilyApiKey"
                            value={config.tavilyApiKey}
                            onChange={handleChange}
                            placeholder="tvly-..."
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-glass)",
                                borderRadius: "12px",
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-body)",
                                fontSize: "1rem",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-teal)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "transparent",
                                border: "1px solid var(--border-glass)",
                                padding: "10px 20px",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                                fontWeight: 500,
                                borderRadius: "99px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-glass-hover)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }}
                        >
                            Cancel
                        </button>
                        <motion.button
                            type="submit"
                            disabled={isSaving}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                                border: "none",
                                padding: "10px 24px",
                                color: "#fff",
                                fontFamily: "var(--font-body)",
                                fontWeight: 600,
                                borderRadius: "99px",
                                cursor: "pointer",
                                opacity: isSaving ? 0.7 : 1,
                                boxShadow: "0 4px 15px var(--accent-glow)",
                            }}
                        >
                            {isSaving ? "Saving..." : "Save Preferences"}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
