"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import StreamingResults, { ToolExecution } from "@/components/StreamingResults";
import { parseIdeasFromText } from "@/lib/ideaParsing";
import { getIdeas, getPickedIdeaIds, saveIdeas } from "@/lib/ideaStore";
import { getSettings } from "@/lib/settings";
import { Idea } from "@/lib/types";

const SettingsModal = dynamic(() => import("@/components/SettingsModal"), { ssr: false });

export default function Home() {
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [content, setContent] = useState("");
    const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [restoredCount, setRestoredCount] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const restoredIdeas = getIdeas();
        if (restoredIdeas.length > 0) {
            setIdeas(restoredIdeas);
            setHasSearched(true);
            setRestoredCount(restoredIdeas.length);
        }
    }, []);

    const handleSearch = useCallback(async (query: string) => {
        const settings = getSettings();
        if (!settings.apiKey) {
            setShowSettings(true);
            setError("Please configure your API key in Settings first.");
            return;
        }

        const previousIdeas = getIdeas();
        const pickedIds = new Set(getPickedIdeaIds());
        const unpickedIdeas = previousIdeas.filter((idea) => !pickedIds.has(idea.id));
        if (unpickedIdeas.length > 0) {
            await fetch("/api/ideas/recycle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ideas: unpickedIdeas }),
            }).catch(() => undefined);
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setIsLoading(true);
        setContent("");
        setToolExecutions([]);
        setIdeas([]);
        setError(null);
        setHasSearched(true);
        setRestoredCount(0);

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, settings }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Request failed");
            }

            if (!res.body) throw new Error("No response stream");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            const createdAt = new Date().toISOString();

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
                            setContent(fullText);
                            const partialIdeas = parseIdeasFromText(fullText, createdAt);
                            if (partialIdeas.length > 0) {
                                setIdeas(partialIdeas);
                            }
                        } catch {
                            // ignore malformed chunk
                        }
                    } else if (line.startsWith("9:")) {
                        try {
                            const toolData = JSON.parse(line.slice(2));
                            setToolExecutions((prev) => [
                                ...prev,
                                {
                                    id: toolData.toolCallId,
                                    name: toolData.toolName,
                                    args: toolData.args,
                                },
                            ]);
                        } catch {
                            // ignore malformed chunk
                        }
                    } else if (line.startsWith("a:")) {
                        try {
                            const resultData = JSON.parse(line.slice(2));
                            setToolExecutions((prev) =>
                                prev.map((te) =>
                                    te.id === resultData.toolCallId
                                        ? { ...te, result: resultData.result }
                                        : te
                                )
                            );
                        } catch {
                            // ignore malformed chunk
                        }
                    }
                }
            }

            const parsedIdeas = parseIdeasFromText(fullText, createdAt);
            if (parsedIdeas.length > 0) {
                setIdeas(parsedIdeas);
                saveIdeas(parsedIdeas);
                await fetch("/api/ideas/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ideas: parsedIdeas }),
                }).catch(() => undefined);
            } else {
                setIdeas([]);
                saveIdeas([]);
            }
        } catch (err: unknown) {
            if ((err as { name?: string }).name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Something went wrong";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <nav
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.25rem 2rem",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    background: "rgba(9,9,9,0.85)",
                    backdropFilter: "blur(12px)",
                    zIndex: 50,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--accent)", borderRadius: "50%" }} />
                    <span
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            fontSize: "1rem",
                            letterSpacing: "-0.03em",
                            color: "var(--text-primary)",
                        }}
                    >
                        IdeaSurge
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Link
                        href="/library"
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: "2px",
                            color: "var(--text-secondary)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.75rem",
                            fontSize: "0.7rem",
                            fontFamily: "var(--font-mono)",
                            textDecoration: "none",
                        }}
                    >
                        Library
                    </Link>
                    <button
                        onClick={() => setShowSettings(true)}
                        title="Settings"
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: "2px",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.4rem 0.75rem",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            fontFamily: "var(--font-mono)",
                            transition: "border-color 0.2s, color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        Settings
                    </button>
                </div>
            </nav>

            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <section
                    style={{
                        padding: hasSearched ? "3rem 2rem 2rem" : "5rem 2rem 3rem",
                        textAlign: "center",
                        transition: "padding 0.5s ease",
                    }}
                >
                    {!hasSearched && (
                        <>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: "var(--accent-dim)",
                                    border: "1px solid rgba(245,166,35,0.3)",
                                    borderRadius: "100px",
                                    padding: "0.3rem 0.85rem",
                                    marginBottom: "2rem",
                                    animation: "fadeUp 0.5s ease both",
                                }}
                            >
                                <span style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%", display: "inline-block" }} />
                                <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.05em" }}>
                                    AI-POWERED · REAL-TIME WEB SEARCH
                                </span>
                            </div>

                            <h1
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "clamp(2.5rem, 7vw, 5rem)",
                                    fontWeight: 800,
                                    lineHeight: 0.95,
                                    letterSpacing: "-0.04em",
                                    color: "var(--text-primary)",
                                    animation: "fadeUp 0.5s 0.1s ease both",
                                    marginBottom: "1rem",
                                }}
                            >
                                Find your next<br />
                                <span style={{ color: "var(--accent)" }}>SaaS idea</span>
                            </h1>

                            <p
                                style={{
                                    fontSize: "1rem",
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--text-secondary)",
                                    maxWidth: "500px",
                                    margin: "0 auto 3rem",
                                    lineHeight: 1.7,
                                    animation: "fadeUp 0.5s 0.2s ease both",
                                }}
                            >
                                AI that searches the web in real-time for validated opportunities,
                                market signals, and underserved niches.
                            </p>
                        </>
                    )}

                    <div style={{ animation: "fadeUp 0.5s 0.3s ease both" }}>
                        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                    </div>

                    {restoredCount > 0 && !isLoading && (
                        <div
                            style={{
                                marginTop: "1rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: "var(--accent-dim)",
                                border: "1px solid rgba(245,166,35,0.3)",
                                borderRadius: "2px",
                                padding: "0.45rem 0.85rem",
                                fontSize: "0.75rem",
                                fontFamily: "var(--font-mono)",
                                color: "var(--accent)",
                            }}
                        >
                            Restored {restoredCount} saved ideas
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                marginTop: "1rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: "2px",
                                padding: "0.5rem 1rem",
                                fontSize: "0.8rem",
                                fontFamily: "var(--font-mono)",
                                color: "#f87171",
                                animation: "fadeUp 0.3s ease both",
                            }}
                        >
                            ⚠ {error}
                        </div>
                    )}
                </section>

                {hasSearched && (
                    <section style={{ padding: "0 2rem 4rem", animation: "fadeUp 0.4s ease both" }}>
                        <StreamingResults
                            content={content}
                            ideas={ideas}
                            isLoading={isLoading}
                            toolExecutions={toolExecutions}
                        />
                    </section>
                )}

                {!hasSearched && (
                    <div style={{ padding: "0 2rem 4rem", textAlign: "center" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "3rem",
                                marginTop: "2rem",
                                animation: "fadeUp 0.5s 0.4s ease both",
                                flexWrap: "wrap",
                            }}
                        >
                            {[
                                { val: "Live", label: "Web Search" },
                                { val: "AI", label: "Idea Analysis" },
                                { val: "∞", label: "Niches" },
                            ].map((s) => (
                                <div key={s.label} style={{ textAlign: "center" }}>
                                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                                        {s.val}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.2rem" }}>
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer
                style={{
                    borderTop: "1px solid var(--border)",
                    padding: "1rem 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                }}
            >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    IdeaSurge - Powered by AI SDK
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Bring your own LLM provider
                </span>
            </footer>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    );
}
