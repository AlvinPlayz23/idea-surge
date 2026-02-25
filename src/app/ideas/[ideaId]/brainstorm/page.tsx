"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, ChevronLeft, Library, Target, Send, Bot, User, Compass } from "lucide-react";
import {
    addChatMessage,
    getChatByIdeaId,
    getDeepDivesByIdeaId,
    getIdeaById,
} from "@/lib/ideaStore";
import { getSettings } from "@/lib/settings";
import { DeepDiveResult, Idea, IdeaChatMessage } from "@/lib/types";

export default function BrainstormPage() {
    const router = useRouter();
    const params = useParams<{ ideaId: string }>();
    const ideaId = params?.ideaId;

    const chatEndRef = useRef<HTMLDivElement>(null);

    const [idea, setIdea] = useState<Idea | null>(null);
    const [isResolvingIdea, setIsResolvingIdea] = useState(true);
    const [deepDiveHistory, setDeepDiveHistory] = useState<DeepDiveResult[]>([]);
    const [chatMessages, setChatMessages] = useState<IdeaChatMessage[]>([]);
    const [chatPrompt, setChatPrompt] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

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
        setDeepDiveHistory(getDeepDivesByIdeaId(ideaId));
        setChatMessages(getChatByIdeaId(ideaId));
    }, [ideaId]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isChatLoading]);

    const latest = useMemo(() => deepDiveHistory[0] ?? null, [deepDiveHistory]);

    const sendChat = async () => {
        if (!idea || !chatPrompt.trim() || isChatLoading) return;

        const settings = getSettings();
        if (!settings.apiKey) {
            setChatError("Missing API key. Open settings on the main page.");
            return;
        }

        const userMessage: IdeaChatMessage = {
            id: `${Date.now()}-user`,
            role: "user",
            content: chatPrompt.trim(),
            createdAt: new Date().toISOString(),
        };

        const nextMessages = [...chatMessages, userMessage];
        setChatMessages(nextMessages);
        addChatMessage(idea.id, userMessage);
        setChatPrompt("");
        setIsChatLoading(true);
        setChatError(null);

        try {
            const res = await fetch("/api/idea-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idea,
                    deepDive: latest
                        ? {
                            summary: latest.summary,
                            sections: latest.sections.map((section) => ({
                                title: section.title,
                                content: section.content,
                            })),
                            sources: latest.sources,
                        }
                        : null,
                    messages: nextMessages.map((message) => ({
                        role: message.role,
                        content: message.content,
                    })),
                    settings: {
                        provider: settings.provider,
                        baseUrl: settings.baseUrl,
                        modelId: settings.modelId,
                        apiKey: settings.apiKey,
                    },
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Brainstorm request failed.");
            }

            const assistantText = String(data.reply || "").trim();
            if (!assistantText) {
                throw new Error("Brainstorm response was empty.");
            }

            const assistantMessage: IdeaChatMessage = {
                id: `${Date.now()}-assistant`,
                role: "assistant",
                content: assistantText,
                createdAt: new Date().toISOString(),
            };

            setChatMessages((prev) => [...prev, assistantMessage]);
            addChatMessage(idea.id, assistantMessage);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setChatError(message);
        } finally {
            setIsChatLoading(false);
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
                <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    Loading idea context...
                </div>
            </main>
        );
    }

    if (!idea) {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "900px", margin: "0 auto", minHeight: "100vh" }}>
                <button
                    onClick={() => router.push(`/ideas/${ideaId}`)}
                    className="glass-pill"
                    style={{ marginBottom: "1rem", color: "var(--text-secondary)", padding: "0.5rem 1rem", cursor: "pointer" }}
                >
                    <ChevronLeft size={16} /> Back to details
                </button>
                <div className="glass-panel" style={{ padding: "2rem", color: "var(--text-secondary)" }}>
                    Idea not found.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: "2rem 1.5rem 4rem", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem", height: "100vh", position: "relative" }}>
            <div className="mesh-bg">
                <div className="mesh-blob blob-2" style={{ background: "rgba(147, 51, 234, 0.1)" }} />
            </div>

            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", zIndex: 10, flexShrink: 0 }}
            >
                <button
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                    className="glass-pill"
                    style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem",
                        color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer",
                        transition: "all 0.2s ease", fontWeight: 500
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-glass-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-glass)"; }}
                >
                    <ChevronLeft size={16} /> Back to Idea
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{ padding: "1.5rem", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", zIndex: 1 }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={18} color="var(--accent-teal)" />
                    <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>Brainstorming Context</span>
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 600 }}>{idea.title}</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{latest ? "Using your latest deep-dive research to inform the AI." : "Using base concept only. Try a deep-dive first for better chat context."}</p>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel"
                style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "400px", padding: "1.5rem", zIndex: 1, overflow: "hidden" }}
            >
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", paddingRight: "0.5rem", marginBottom: "1rem" }}>
                    {chatMessages.length === 0 ? (
                        <div style={{ margin: "auto", textAlign: "center", color: "var(--text-secondary)" }}>
                            <div className="mesh-blob" style={{ width: "40px", height: "40px", filter: "blur(12px)", background: "var(--accent-purple)", animation: "pulse-glow 2s infinite", margin: "0 auto 1.5rem", position: "relative" }} />
                            <p style={{ fontSize: "1.1rem" }}>How should we build this?</p>
                            <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: "0.5rem", maxWidth: "400px" }}>Ask about go-to-market strategies, technical stack, user pain points, or potential competition.</p>
                        </div>
                    ) : (
                        chatMessages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "85%",
                                    background: message.role === "user" ? "rgba(79, 70, 229, 0.15)" : "transparent",
                                    border: message.role === "user" ? "1px solid rgba(79, 70, 229, 0.3)" : "none",
                                    borderRadius: "16px",
                                    padding: message.role === "user" ? "1rem 1.25rem" : "0.5rem 0",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: message.role === "user" ? "var(--accent-blue)" : "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                                    {message.role === "user" ? <User size={14} /> : <div className="mesh-blob" style={{ width: "12px", height: "12px", filter: "blur(3px)", background: "var(--accent-purple)", animation: "pulse-glow 1.5s infinite", position: "relative" }} />}
                                    {message.role === "user" ? "You" : "AI"}
                                </div>
                                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                                    {message.role === "assistant" ? (
                                        <div className="markdown-prose">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <p style={{ margin: "0 0 0.75rem" }}>{children}</p>,
                                                    h1: ({ children }) => <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.2rem", margin: "1rem 0 0.5rem" }}>{children}</h1>,
                                                    h2: ({ children }) => <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.1rem", margin: "1rem 0 0.5rem" }}>{children}</h2>,
                                                    h3: ({ children }) => <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1rem", margin: "1rem 0 0.5rem" }}>{children}</h3>,
                                                    ul: ({ children }) => <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 1rem" }}>{children}</ul>,
                                                    ol: ({ children }) => <ol style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 1rem" }}>{children}</ol>,
                                                    li: ({ children }) => <li style={{ marginBottom: "0.25rem" }}>{children}</li>,
                                                    strong: ({ children }) => <strong style={{ color: "var(--text-primary)" }}>{children}</strong>,
                                                    code: ({ children }) => <code style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "4px", padding: "0.1rem 0.3rem", fontSize: "0.85em" }}>{children}</code>,
                                                    pre: ({ children }) => <pre style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "1rem", overflowX: "auto", margin: "0.5rem 0 1rem" }}>{children}</pre>,
                                                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>{children}</a>,
                                                    table: ({ children }) => <table style={{ width: "100%", borderCollapse: "collapse", margin: "0.5rem 0 1rem", fontSize: "0.9em" }}>{children}</table>,
                                                    th: ({ children }) => <th style={{ border: "1px solid var(--border-glass)", padding: "0.5rem", textAlign: "left", color: "var(--text-primary)" }}>{children}</th>,
                                                    td: ({ children }) => <td style={{ border: "1px solid var(--border-glass)", padding: "0.5rem", textAlign: "left" }}>{children}</td>,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isChatLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem" }}>
                            <div className="mesh-blob" style={{ width: "10px", height: "10px", filter: "blur(2px)", background: "var(--accent-purple)", animation: "pulse-glow 1s infinite", position: "relative" }} />
                            Synthesizing response...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", borderTop: "1px solid var(--border-glass)", paddingTop: "1.5rem" }}>
                    <div style={{ flex: 1, minWidth: "260px" }}>
                        <input
                            value={chatPrompt}
                            onChange={(e) => setChatPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    sendChat();
                                }
                            }}
                            placeholder="Ask the AI to brainstorm this idea further..."
                            disabled={isChatLoading}
                            style={{
                                width: "100%",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-glass)",
                                color: "var(--text-primary)",
                                padding: "0.8rem 1.25rem",
                                borderRadius: "99px",
                                fontSize: "0.95rem",
                                outline: "none",
                                transition: "all 0.2s",
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                            onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                        />
                    </div>
                    <motion.button
                        onClick={sendChat}
                        disabled={isChatLoading || !chatPrompt.trim()}
                        whileHover={!isChatLoading && chatPrompt.trim() ? { scale: 1.05 } : {}}
                        whileTap={!isChatLoading && chatPrompt.trim() ? { scale: 0.95 } : {}}
                        style={{
                            background: isChatLoading || !chatPrompt.trim() ? "var(--bg-glass-heavy)" : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                            border: "none",
                            color: isChatLoading || !chatPrompt.trim() ? "var(--text-muted)" : "#fff",
                            borderRadius: "99px",
                            padding: "0 1.5rem",
                            cursor: isChatLoading || !chatPrompt.trim() ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isChatLoading || !chatPrompt.trim() ? "none" : "0 4px 15px var(--accent-glow)",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <Send size={18} />
                    </motion.button>
                </div>

                <AnimatePresence>
                    {chatError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", marginTop: "1rem" }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            style={{ color: "#f87171", fontSize: "0.85rem", padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                        >
                            {chatError}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>
        </main>
    );
}
