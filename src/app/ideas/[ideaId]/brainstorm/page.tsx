"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    addChatMessage,
    getChatByIdeaId,
    getDeepDivesByIdeaId,
    getIdeaById,
} from "@/lib/ideaStore";
import { getSettings } from "@/lib/settings";
import { DeepDiveResult, Idea, IdeaChatMessage } from "@/lib/types";

function headingStyle() {
    return {
        display: "inline-block",
        background: "var(--accent-dim)",
        border: "1px solid rgba(245,166,35,0.35)",
        color: "var(--accent)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.01em",
        borderRadius: "2px",
        padding: "0.2rem 0.5rem",
        marginBottom: "0.5rem",
    } as const;
}

export default function BrainstormPage() {
    const router = useRouter();
    const params = useParams<{ ideaId: string }>();
    const ideaId = params?.ideaId;

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
            <main style={{ padding: "3rem 2rem", maxWidth: "960px", margin: "0 auto" }}>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "3px" }}>
                    Invalid idea ID.
                </div>
            </main>
        );
    }

    if (isResolvingIdea) {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "960px", margin: "0 auto" }}>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "3px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    Loading idea...
                </div>
            </main>
        );
    }

    if (!idea) {
        return (
            <main style={{ padding: "3rem 2rem", maxWidth: "960px", margin: "0 auto" }}>
                <button
                    onClick={() => router.push(`/ideas/${ideaId}`)}
                    style={{ marginBottom: "1rem", background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "0.4rem 0.7rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
                >
                    Back to idea details
                </button>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "3px" }}>
                    Idea not found in saved session.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: "2.5rem 1.25rem 3rem", maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                    style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        borderRadius: "2px",
                        padding: "0.45rem 0.75rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                    }}
                >
                    Back to idea details
                </button>
                <button
                    onClick={() => router.push("/library")}
                    style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        borderRadius: "2px",
                        padding: "0.45rem 0.75rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                    }}
                >
                    Open library
                </button>
            </div>

            <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={headingStyle()}>Brainstorming Context</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.35rem" }}>{idea.title}</h1>
                <p style={{ color: "var(--accent)", fontStyle: "italic", marginBottom: "0.5rem" }}>{idea.oneLiner}</p>
                <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                    {latest ? "Using latest deep-dive context for better brainstorming quality." : "No deep-dive found yet; chat will use base idea context only."}
                </div>
            </section>

            <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem" }}>
                <div style={headingStyle()}>AI Brainstorm Chat</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.75rem", maxHeight: "430px", overflowY: "auto", paddingRight: "0.25rem" }}>
                    {chatMessages.length === 0 ? (
                        <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                            Ask anything: GTM plan, launch sequence, features, pricing tiers, or validation experiments.
                        </div>
                    ) : (
                        chatMessages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "90%",
                                    border: "1px solid var(--border)",
                                    borderRadius: "3px",
                                    padding: "0.65rem 0.75rem",
                                    background: message.role === "user" ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "0.62rem", color: message.role === "user" ? "var(--accent)" : "var(--text-secondary)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-mono)" }}>
                                    {message.role === "user" ? "You" : "AI"}
                                </div>
                                {message.role === "assistant" ? (
                                    <div style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ children }) => <p style={{ margin: "0 0 0.45rem" }}>{children}</p>,
                                                h1: ({ children }) => <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "1rem", margin: "0.35rem 0" }}>{children}</h1>,
                                                h2: ({ children }) => <h2 style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "0.95rem", margin: "0.3rem 0" }}>{children}</h2>,
                                                h3: ({ children }) => <h3 style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "0.9rem", margin: "0.25rem 0" }}>{children}</h3>,
                                                ul: ({ children }) => <ul style={{ paddingLeft: "1.1rem", margin: "0.2rem 0 0.45rem" }}>{children}</ul>,
                                                ol: ({ children }) => <ol style={{ paddingLeft: "1.1rem", margin: "0.2rem 0 0.45rem" }}>{children}</ol>,
                                                li: ({ children }) => <li style={{ marginBottom: "0.2rem" }}>{children}</li>,
                                                strong: ({ children }) => <strong style={{ color: "var(--accent)" }}>{children}</strong>,
                                                code: ({ children }) => <code style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px", padding: "0.05rem 0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{children}</code>,
                                                pre: ({ children }) => <pre style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "2px", padding: "0.55rem", overflowX: "auto", margin: "0.3rem 0 0.45rem" }}>{children}</pre>,
                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>{children}</a>,
                                                table: ({ children }) => <table style={{ width: "100%", borderCollapse: "collapse", margin: "0.35rem 0 0.45rem", fontSize: "0.78rem" }}>{children}</table>,
                                                th: ({ children }) => <th style={{ border: "1px solid var(--border)", padding: "0.3rem", textAlign: "left", color: "var(--accent)" }}>{children}</th>,
                                                td: ({ children }) => <td style={{ border: "1px solid var(--border)", padding: "0.3rem", textAlign: "left" }}>{children}</td>,
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div style={{ whiteSpace: "pre-wrap", fontSize: "0.82rem", lineHeight: 1.6 }}>
                                        {message.content}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isChatLoading && (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                            Thinking...
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                            flex: 1,
                            minWidth: "240px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            padding: "0.58rem 0.72rem",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            outline: "none",
                        }}
                    />
                    <button
                        onClick={sendChat}
                        disabled={isChatLoading || !chatPrompt.trim()}
                        style={{
                            background: isChatLoading ? "var(--bg)" : "var(--accent)",
                            border: "1px solid var(--accent)",
                            color: isChatLoading ? "var(--text-secondary)" : "#000",
                            borderRadius: "2px",
                            padding: "0.58rem 0.86rem",
                            fontFamily: "var(--font-display)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: isChatLoading || !chatPrompt.trim() ? "not-allowed" : "pointer",
                        }}
                    >
                        Send
                    </button>
                </div>

                {chatError && (
                    <div style={{ marginTop: "0.7rem", color: "#f87171", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                        {chatError}
                    </div>
                )}
            </section>
        </main>
    );
}
