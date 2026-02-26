"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Library, Sparkles, Target, ShieldAlert, DollarSign, RefreshCw, MessageSquare, Compass } from "lucide-react";
import { addDeepDive, getDeepDivesByIdeaId, getIdeaById, markIdeaPicked } from "@/lib/ideaStore";
import { parseDeepDiveFromText } from "@/lib/ideaParsing";
import { getSettings } from "@/lib/settings";
import { DeepDiveFocus, DeepDiveRequest, DeepDiveResult, Idea } from "@/lib/types";

// Helper for preset icons
const getPresetIcon = (focus: string) => {
    switch (focus) {
        case "market": return <Target size={14} />;
        case "mvp": return <Sparkles size={14} />;
        case "risks": return <ShieldAlert size={14} />;
        case "pricing": return <DollarSign size={14} />;
        default: return <Sparkles size={14} />;
    }
};

type Preset = {
    label: string;
    focus: DeepDiveFocus;
};

const PRESETS: Preset[] = [
    { label: "Deepen Market", focus: "market" },
    { label: "Deepen MVP", focus: "mvp" },
    { label: "Deepen Risks", focus: "risks" },
    { label: "Deepen Pricing", focus: "pricing" },
];

export default function IdeaDetailPage() {
    const router = useRouter();
    const params = useParams<{ ideaId: string }>();
    const ideaId = params?.ideaId;

    const [idea, setIdea] = useState<Idea | null>(null);
    const [isResolvingIdea, setIsResolvingIdea] = useState(true);
    const [history, setHistory] = useState<DeepDiveResult[]>([]);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRequest, setLastRequest] = useState<DeepDiveRequest | null>(null);
    const [activeFocus, setActiveFocus] = useState<DeepDiveFocus | null>(null);

    useEffect(() => {
        if (!ideaId || typeof ideaId !== "string") return;
        const localIdea = getIdeaById(ideaId);
        if (localIdea) {
            setIdea(localIdea);
            setIsResolvingIdea(false);
        } else {
            fetch(`/api/library/${ideaId}`)
                .then(async (res) => {
                    if (!res.ok) return null;
                    const data = await res.json().catch(() => ({}));
                    return (data.idea ?? null) as Idea | null;
                })
                .then((remoteIdea) => {
                    if (remoteIdea) setIdea(remoteIdea);
                    setIsResolvingIdea(false);
                })
                .catch(() => setIsResolvingIdea(false));
        }
        setHistory(getDeepDivesByIdeaId(ideaId));
    }, [ideaId]);

    useEffect(() => {
        if (!idea) return;
        markIdeaPicked(idea.id);
        fetch("/api/ideas/mark-picked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea }),
        }).catch(() => undefined);
    }, [idea]);

    const latest = useMemo(() => history[0] ?? null, [history]);

    const runDeepDive = async (request: DeepDiveRequest) => {
        if (!idea) return;

        const settings = getSettings();
        if (!settings.apiKey) {
            setError("Missing API key. Open settings on the main page.");
            return;
        }

        setError(null);
        setIsLoading(true);
        setLastRequest(request);
        setActiveFocus(request.focus);

        try {
            const res = await fetch("/api/idea-deepen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idea,
                    request,
                    settings,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Deep-dive request failed");
            }

            if (!res.body) throw new Error("No response stream");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const token = JSON.parse(line.slice(2));
                            fullText += token;
                        } catch {
                            // ignore malformed chunk
                        }
                    }
                }
            }

            const parsed = parseDeepDiveFromText(fullText, idea.id);
            if (!parsed) {
                throw new Error("Model returned an unexpected deep-dive format.");
            }

            addDeepDive(idea.id, parsed);
            setHistory(getDeepDivesByIdeaId(idea.id));
            setCustomPrompt("");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setIsLoading(false);
            setActiveFocus(null);
        }
    };

    if (!ideaId || typeof ideaId !== "string") {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto", minHeight: "100vh" }}>
                <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    Invalid idea ID.
                </div>
            </main>
        );
    }

    if (isResolvingIdea) {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto", minHeight: "100vh" }}>
                <div className="glass-panel" style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                    <RefreshCw size={18} style={{ animation: "spin 2s linear infinite" }} /> Loading idea...
                </div>
            </main>
        );
    }

    if (!idea) {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto", minHeight: "100vh" }}>
                <button
                    onClick={() => router.push("/")}
                    className="glass-pill"
                    style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", color: "var(--text-secondary)", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                    <ChevronLeft size={16} /> Back to results
                </button>
                <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    Idea not found in saved session. Generate ideas first from the home page.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: "2rem 1.5rem 4rem", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>
            {/* Background elements */}
            <div className="mesh-bg">
                <div className="mesh-blob blob-1" />
                <div className="mesh-blob blob-2" />
            </div>

            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", zIndex: 10, position: "relative" }}
            >
                <button
                    onClick={() => router.push("/")}
                    className="glass-pill"
                    style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem",
                        color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer",
                        transition: "all 0.2s ease", fontWeight: 500
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-glass-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-glass)"; }}
                >
                    <ChevronLeft size={16} /> Search
                </button>
                <button
                    onClick={() => router.push("/library")}
                    className="glass-pill"
                    style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem",
                        color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer",
                        transition: "all 0.2s ease", fontWeight: 500
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-glass-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-glass)"; }}
                >
                    <Library size={16} /> Library
                </button>
                <button
                    onClick={() => router.push("/explore")}
                    className="glass-pill"
                    style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem",
                        color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer",
                        transition: "all 0.2s ease", fontWeight: 500
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-glass-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-glass)"; }}
                >
                    <Compass size={16} /> Explore
                </button>
            </motion.nav>

            <motion.section
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: "2.5rem", position: "relative", zIndex: 1 }}
            >
                <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: "radial-gradient(circle, var(--accent-glow-alpha), transparent 70%)", filter: "blur(40px)", pointerEvents: "none", zIndex: 0 }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.02em", color: "var(--text-primary)", fontWeight: 700, lineHeight: 1.2 }}>
                            {idea.title}
                        </h1>
                        {idea.category && (
                            <div className="glass-pill" style={{ padding: "0.4rem 1rem", color: "var(--accent-teal)", background: "var(--accent-glow-alpha-3)", border: "1px solid var(--accent-glow-alpha-3)", fontSize: "0.8rem", fontWeight: 600 }}>
                                {idea.category}
                            </div>
                        )}
                    </div>

                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                        {idea.oneLiner}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.03)" }}>
                        {[
                            { label: "Problem", value: idea.problem },
                            { label: "Target Market", value: idea.targetMarket },
                            { label: "Market Signal", value: idea.marketSignal },
                            { label: "Revenue Model", value: idea.revenueModel },
                        ].map((field) => (
                            <div key={field.label}>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem" }}>
                                    {field.label}
                                </div>
                                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-primary)" }}>{field.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel"
                style={{ padding: "2rem" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    <Sparkles size={18} color="var(--accent-purple)" />
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 600 }}>Deepen This Idea</h2>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.focus}
                            disabled={isLoading}
                            onClick={() => runDeepDive({ ideaId: idea.id, mode: "preset", focus: preset.focus })}
                            className="glass-pill"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.6rem 1.25rem",
                                color: activeFocus === preset.focus ? "var(--text-primary)" : "var(--text-secondary)",
                                background: activeFocus === preset.focus ? "var(--accent-glow-alpha)" : "var(--bg-glass)",
                                border: activeFocus === preset.focus ? "1px solid var(--accent-glow-strong)" : "1px solid var(--border-glass)",
                                fontSize: "0.85rem",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                fontWeight: activeFocus === preset.focus ? 600 : 500,
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading && activeFocus !== preset.focus) {
                                    e.currentTarget.style.color = "var(--text-primary)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.background = "var(--bg-glass-hover)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading && activeFocus !== preset.focus) {
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.background = "var(--bg-glass)";
                                }
                            }}
                        >
                            {getPresetIcon(preset.focus)}
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                        <input
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="What do you want to go deeper on?"
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-glass)",
                                color: "var(--text-primary)",
                                padding: "0.8rem 1rem",
                                borderRadius: "12px",
                                fontSize: "0.95rem",
                                outline: "none",
                                transition: "all 0.2s",
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                        />
                    </div>
                    <motion.button
                        disabled={isLoading || !customPrompt.trim()}
                        onClick={() => runDeepDive({
                            ideaId: idea.id,
                            mode: "custom",
                            focus: "custom",
                            prompt: customPrompt.trim(),
                        })}
                        whileHover={!isLoading && customPrompt.trim() ? { scale: 1.02 } : {}}
                        whileTap={!isLoading && customPrompt.trim() ? { scale: 0.98 } : {}}
                        style={{
                            background: isLoading || !customPrompt.trim() ? "var(--bg-glass-heavy)" : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                            border: "none",
                            color: isLoading || !customPrompt.trim() ? "var(--text-muted)" : "#fff",
                            borderRadius: "12px",
                            padding: "0.8rem 1.5rem",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            cursor: isLoading || !customPrompt.trim() ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            boxShadow: isLoading || !customPrompt.trim() ? "none" : "0 4px 15px var(--accent-glow)",
                        }}
                    >
                        {isLoading ? (
                            <><RefreshCw size={16} style={{ animation: "spin 2s linear infinite" }} /> Generating...</>
                        ) : (
                            "Deepen idea"
                        )}
                    </motion.button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", color: "#f87171", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
                        >
                            <span>{error}</span>
                            {lastRequest && (
                                <button
                                    onClick={() => runDeepDive(lastRequest)}
                                    disabled={isLoading}
                                    style={{ background: "transparent", border: "1px solid rgba(239, 68, 68, 0.5)", color: "#f87171", padding: "0.3rem 0.75rem", borderRadius: "99px", cursor: "pointer", fontSize: "0.75rem", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    Retry
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            <AnimatePresence>
                {latest ? (
                    <motion.section
                        initial={{ opacity: 0, scale: 0.98, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass-panel"
                        style={{ padding: "2.5rem", position: "relative" }}
                    >
                        <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "150px", background: "radial-gradient(circle, var(--accent-glow-alpha-3), transparent 70%)", filter: "blur(40px)", pointerEvents: "none", zIndex: 0 }} />

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <Target size={18} color="var(--accent-teal)" />
                                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 600 }}>Latest Deep-Dive</h2>
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                                {latest.summary}
                            </p>

                            <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2.5rem" }}>
                                {latest.sections.map((section) => (
                                    <article key={`${latest.generatedAt}-${section.key}`} style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "1.5rem" }}>
                                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.75rem", fontWeight: 600 }}>{section.title}</h3>
                                        <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{section.content}</div>
                                    </article>
                                ))}
                            </div>

                            <div style={{ marginBottom: "2.5rem" }}>
                                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.75rem" }}>Source Evidence</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    {latest.sources.length > 0 ? (
                                        latest.sources.map((source) => (
                                            source.startsWith("http") ? (
                                                <a key={source} href={source} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", fontSize: "0.9rem", wordBreak: "break-all", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent-purple)"} onMouseLeave={e => e.currentTarget.style.color = "var(--accent-blue)"}>
                                                    {source}
                                                </a>
                                            ) : (
                                                <span key={source} style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{source}</span>
                                            )
                                        ))
                                    ) : (
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontStyle: "italic" }}>No specific sources returned.</span>
                                    )}
                                </div>
                            </div>

                            <motion.button
                                onClick={() => router.push(`/ideas/${idea.id}/brainstorm`)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                                    border: "none",
                                    color: "#fff",
                                    borderRadius: "99px",
                                    padding: "0.8rem 1.75rem",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    boxShadow: "0 4px 15px var(--accent-glow)",
                                }}
                            >
                                <MessageSquare size={16} /> Brainstorm More with AI
                            </motion.button>
                        </div>
                    </motion.section>
                ) : (
                    <motion.section
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="glass-panel"
                        style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-secondary)" }}
                    >
                        <Target size={32} color="var(--border-glass-strong)" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                        <p style={{ fontSize: "1.05rem" }}>No deep-dives generated yet.</p>
                        <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: "0.5rem" }}>Select a preset above to expand this idea into a full concept.</p>
                    </motion.section>
                )}
            </AnimatePresence>
        </main>
    );
}
