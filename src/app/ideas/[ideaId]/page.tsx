"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addDeepDive, getDeepDivesByIdeaId, getIdeaById, markIdeaPicked } from "@/lib/ideaStore";
import { parseDeepDiveFromText } from "@/lib/ideaParsing";
import { getSettings } from "@/lib/settings";
import { DeepDiveFocus, DeepDiveRequest, DeepDiveResult, Idea } from "@/lib/types";

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
    // Debug-only stream state kept for future troubleshooting.
    // const [streamOutput, setStreamOutput] = useState("");

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
        // setStreamOutput("");
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
                            // setStreamOutput(fullText);
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
                    onClick={() => router.push("/")}
                    style={{ marginBottom: "1rem", background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "0.4rem 0.7rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
                >
                    Back to results
                </button>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "3px" }}>
                    Idea not found in saved session. Generate ideas first from the home page.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: "2.5rem 1.25rem 3rem", maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                    onClick={() => router.push("/")}
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
                    Back to results
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

            <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1.25rem", marginBottom: "1rem" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", letterSpacing: "-0.02em", marginBottom: "0.4rem" }}>
                    {idea.title}
                </h1>
                {idea.category && (
                    <div style={{ display: "inline-block", marginBottom: "0.5rem", padding: "0.15rem 0.45rem", border: "1px solid rgba(245,166,35,0.3)", background: "var(--accent-dim)", color: "var(--accent)", borderRadius: "2px", fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {idea.category}
                    </div>
                )}
                <p style={{ color: "var(--accent)", marginBottom: "0.8rem", fontStyle: "italic" }}>{idea.oneLiner}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                    {[
                        { label: "Problem", value: idea.problem },
                        { label: "Target Market", value: idea.targetMarket },
                        { label: "Market Signal", value: idea.marketSignal },
                        { label: "Revenue Model", value: idea.revenueModel },
                    ].map((field) => (
                        <div key={field.label}>
                            <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                                {field.label}
                            </div>
                            <div style={{ fontSize: "0.85rem", lineHeight: 1.55, color: "var(--text-primary)" }}>{field.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={headingStyle()}>Deepen This Idea</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.focus}
                            disabled={isLoading}
                            onClick={() => runDeepDive({ ideaId: idea.id, mode: "preset", focus: preset.focus })}
                            style={{
                                background: activeFocus === preset.focus ? "rgba(245,166,35,0.18)" : "transparent",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)",
                                borderRadius: "100px",
                                padding: "0.35rem 0.75rem",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.72rem",
                                cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="What do you want to go deeper on?"
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            minWidth: "260px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            padding: "0.55rem 0.7rem",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            outline: "none",
                        }}
                    />
                    <button
                        disabled={isLoading || !customPrompt.trim()}
                        onClick={() => runDeepDive({
                            ideaId: idea.id,
                            mode: "custom",
                            focus: "custom",
                            prompt: customPrompt.trim(),
                        })}
                        style={{
                            background: isLoading ? "var(--bg)" : "var(--accent)",
                            border: "1px solid var(--accent)",
                            color: isLoading ? "var(--text-secondary)" : "#000",
                            borderRadius: "2px",
                            padding: "0.55rem 0.85rem",
                            fontFamily: "var(--font-display)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: isLoading || !customPrompt.trim() ? "not-allowed" : "pointer",
                        }}
                    >
                        {isLoading ? "Generating..." : "Deepen idea"}
                    </button>
                </div>

                {error && (
                    <div style={{ marginTop: "0.75rem", color: "#f87171", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                        {error}
                        {lastRequest && (
                            <button
                                onClick={() => runDeepDive(lastRequest)}
                                disabled={isLoading}
                                style={{
                                    marginLeft: "0.55rem",
                                    background: "none",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#f87171",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "2px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.7rem",
                                }}
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Debug stream panel intentionally disabled for normal UX. */}
            {/*
            <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.35rem" }}>
                    Streaming output
                </div>
                <pre style={{ minHeight: "90px", maxHeight: "240px", overflowY: "auto", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: "0.78rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                    {streamOutput || "Run a deep-dive action to stream a focused expansion here."}
                </pre>
            </section>
            */}

            {latest ? (
                <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem" }}>
                    <div style={headingStyle()}>Latest Deep-Dive</div>
                    <p style={{ color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "1rem" }}>{latest.summary}</p>

                    <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1rem" }}>
                        {latest.sections.map((section) => (
                            <article key={`${latest.generatedAt}-${section.key}`} style={{ border: "1px solid var(--border)", borderRadius: "2px", padding: "0.8rem", background: "linear-gradient(180deg, rgba(245,166,35,0.04), rgba(255,255,255,0.01))" }}>
                                <div style={{ ...headingStyle(), marginBottom: "0.45rem" }}>{section.title}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.65 }}>{section.content}</div>
                            </article>
                        ))}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <div style={headingStyle()}>Source Evidence</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            {latest.sources.length > 0 ? (
                                latest.sources.map((source) => (
                                    source.startsWith("http") ? (
                                        <a key={source} href={source} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontSize: "0.8rem", wordBreak: "break-all", textDecoration: "none" }}>
                                            {source}
                                        </a>
                                    ) : (
                                        <span key={source} style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{source}</span>
                                    )
                                ))
                            ) : (
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>No sources returned.</span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/ideas/${idea.id}/brainstorm`)}
                        style={{
                            background: "var(--accent)",
                            border: "1px solid var(--accent)",
                            color: "#000",
                            borderRadius: "2px",
                            padding: "0.6rem 0.95rem",
                            cursor: "pointer",
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Brainstorm More with AI
                    </button>
                </section>
            ) : (
                <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1.25rem", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    No deep-dive yet. Choose a preset or write a custom refinement to expand this idea.
                </section>
            )}
        </main>
    );
}
