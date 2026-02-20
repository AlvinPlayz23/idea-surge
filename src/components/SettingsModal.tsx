"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings, DEFAULT_SETTINGS } from "@/lib/settings";

interface Props {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSettings(getSettings());
    }, []);

    const handleSave = () => {
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--bg-modal)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                    padding: "2rem",
                    width: "min(480px, 90vw)",
                    animation: "fadeUp 0.25s ease both",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
                    <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                            LLM Configuration
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            Settings are saved locally in your browser
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1, padding: "0.1rem 0.3rem" }}
                    >
                        ×
                    </button>
                </div>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <Field
                        label="Base URL"
                        placeholder="https://api.openai.com/v1"
                        value={settings.baseUrl}
                        onChange={(v) => setSettings({ ...settings, baseUrl: v })}
                    />
                    <Field
                        label="Model ID"
                        placeholder="gpt-4o-mini"
                        value={settings.modelId}
                        onChange={(v) => setSettings({ ...settings, modelId: v })}
                    />
                    <Field
                        label="API Key"
                        placeholder="sk-..."
                        value={settings.apiKey}
                        onChange={(v) => setSettings({ ...settings, apiKey: v })}
                        type="password"
                    />
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: "2px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                            transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-secondary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            background: saved ? "rgba(34,197,94,0.15)" : "var(--accent-dim)",
                            border: `1px solid ${saved ? "rgba(34,197,94,0.4)" : "var(--accent)"}`,
                            borderRadius: "2px",
                            color: saved ? "#4ade80" : "var(--accent)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            padding: "0.5rem 1.25rem",
                            cursor: "pointer",
                            transition: "all 0.25s",
                            fontWeight: 500,
                        }}
                    >
                        {saved ? "✓ Saved" : "Save Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label
                style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.4rem",
                }}
            >
                {label}
            </label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: "100%",
                    background: "var(--bg)",
                    border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "2px",
                    padding: "0.6rem 0.75rem",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.825rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                }}
            />
        </div>
    );
}
