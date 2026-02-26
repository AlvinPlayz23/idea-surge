"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Key, Server, Hash, Cloud, Palette, HelpCircle, User, Check } from "lucide-react";
import { AppSettings as SettingsType, getSettings, saveSettings } from "@/lib/settings";

interface Props {
    onClose: () => void;
}

type Section = "AI" | "THEMES" | "SUPPORT" | "ACCOUNT";

export default function SettingsModal({ onClose }: Props) {
    const [activeSection, setActiveSection] = useState<Section>("AI");
    const [config, setConfig] = useState<SettingsType>({
        provider: "openai",
        baseUrl: "",
        modelId: "",
        apiKey: "",
        tavilyApiKey: "",
        theme: "liquid-obsidian",
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setConfig(getSettings());
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleThemeSelect = (themeId: string) => {
        const newConfig = { ...config, theme: themeId };
        setConfig(newConfig);
        // Apply instantly for preview
        document.documentElement.setAttribute("data-theme", themeId);
    };

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        saveSettings(config);

        // Notify other components of theme change
        window.dispatchEvent(new Event("theme-change"));

        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 400);
    }, [config, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const themes = [
        { id: "liquid-obsidian", name: "Liquid Obsidian", colors: ["#050507", "#4F46E5"] },
        { id: "aurora-teal", name: "Aurora Teal", colors: ["#020d0c", "#14b8a6"] },
        { id: "solar-flare", name: "Solar Flare", colors: ["#0d0602", "#f97316"] },
        { id: "frost", name: "Frost", colors: ["#f8fafc", "#3b82f6"] },
        { id: "midnight-purple", name: "Midnight Purple", colors: ["#0a0118", "#7c3aed"] },
    ];

    const sidebarItems = [
        { id: "AI", icon: Cloud, label: "AI Engines" },
        { id: "THEMES", icon: Palette, label: "Appearance" },
        { id: "SUPPORT", icon: HelpCircle, label: "Support" },
        { id: "ACCOUNT", icon: User, label: "Account" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--bg-glass-heavy)] backdrop-blur-[24px] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: -20, opacity: 0 }}
                className="glass-panel w-full max-w-[750px] min-h-[500px] flex overflow-hidden relative"
            >
                {/* Sidebar */}
                <div className="w-[200px] border-r border-[var(--border-glass)] bg-[rgba(255,255,255,0.02)] p-4 flex flex-col gap-2">
                    <div className="mb-6 px-2">
                        <h3 className="font-display font-semibold text-lg text-[var(--text-primary)]">Settings</h3>
                    </div>
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as Section)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${activeSection === item.id
                                    ? "bg-[var(--bg-glass-hover)] text-[var(--text-primary)] shadow-sm"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
                                }`}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    ))}

                    <div className="mt-auto pt-4 border-t border-[var(--border-glass)]">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X size={16} />
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[rgba(255,255,255,0.01)]">
                    <div className="flex-1 overflow-y-auto p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeSection === "AI" && (
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">AI Provider</h4>
                                            <p className="text-xs text-[var(--text-muted)] mb-3">Choose the brain for your idea research.</p>
                                            <select
                                                name="provider"
                                                value={config.provider}
                                                onChange={handleChange}
                                                className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] transition-colors"
                                            >
                                                <option value="openai">OpenAI Collection</option>
                                                <option value="anthropic">Anthropic Claude</option>
                                                <option value="google">Google Gemini</option>
                                                <option value="groq">Groq Fast Inference</option>
                                                <option value="ollama">Ollama (Local Models)</option>
                                                <option value="custom">Custom Endpoint</option>
                                            </select>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Authentication</h4>
                                            <p className="text-xs text-[var(--text-muted)] mb-3">Your API key is stored locally in your browser.</p>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                <input
                                                    type="password"
                                                    name="apiKey"
                                                    value={config.apiKey}
                                                    onChange={handleChange}
                                                    placeholder="Enter your API key..."
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Base URL</h4>
                                                <input
                                                    type="text"
                                                    name="baseUrl"
                                                    value={config.baseUrl}
                                                    onChange={handleChange}
                                                    placeholder="Optional override..."
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Model ID</h4>
                                                <input
                                                    type="text"
                                                    name="modelId"
                                                    value={config.modelId}
                                                    onChange={handleChange}
                                                    placeholder="e.g. gpt-4o"
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-[var(--border-glass)]">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Web Research</h4>
                                            <p className="text-xs text-[var(--text-muted)] mb-3">Tavily Search API key for deep market crawling.</p>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                                <input
                                                    type="password"
                                                    name="tavilyApiKey"
                                                    value={config.tavilyApiKey}
                                                    onChange={handleChange}
                                                    placeholder="tvly-..."
                                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "THEMES" && (
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Color Palette</h4>
                                            <p className="text-xs text-[var(--text-muted)] mb-4">Select a visual style that fits your workflow.</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {themes.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleThemeSelect(t.id)}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${config.theme === t.id
                                                                ? "bg-[var(--bg-glass-hover)] border-[var(--accent-blue)] shadow-lg"
                                                                : "bg-[var(--bg-input)] border-[var(--border-glass)] hover:bg-[rgba(255,255,255,0.03)]"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-1.5">
                                                                <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: t.colors[0] }} />
                                                                <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: t.colors[1] }} />
                                                            </div>
                                                            <span className="text-sm font-medium text-[var(--text-primary)]">{t.name}</span>
                                                        </div>
                                                        {config.theme === t.id && <Check size={16} className="text-[var(--accent-blue)]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "SUPPORT" && (
                                    <div className="flex flex-col gap-4">
                                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Help & Resources</h4>
                                        <div className="grid gap-2">
                                            {["Documentation", "Release Notes", "Feedback", "API Reference"].map((item) => (
                                                <button key={item} className="flex items-center justify-between p-4 bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                                                    {item}
                                                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">↗</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "ACCOUNT" && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-[var(--bg-glass-hover)] flex items-center justify-center mb-4 border border-[var(--border-glass)]">
                                            <User size={32} className="text-[var(--text-muted)]" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1">User Profiles</h4>
                                        <p className="text-sm text-[var(--text-muted)] max-w-[250px]">
                                            Cloud synchronization and personal collections are coming in a future update.
                                        </p>
                                        <div className="mt-6 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-[10px] font-bold uppercase tracking-widest">
                                            Coming Soon
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[var(--border-glass)] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-6 py-2 rounded-xl text-sm font-semibold text-white shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
