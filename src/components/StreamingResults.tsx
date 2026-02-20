"use client";

import { useEffect, useState } from "react";

interface Props {
    content: string;
    isLoading: boolean;
    toolCalls: string[];
}

interface IdeaBlock {
    title: string;
    oneLiner: string;
    problem: string;
    market: string;
    signal: string;
    revenue: string;
    source: string;
}

function stripThinkTags(text: string): string {
    // Remove complete <think>...</think> blocks
    let stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    // Remove any unclosed opening <think> tag and everything after it (still streaming)
    stripped = stripped.replace(/<think>[\s\S]*/i, "");
    return stripped.trim();
}

function parseIdeas(text: string): IdeaBlock[] {
    const sections = text.split(/\n---\n/).filter((s) => s.includes("##"));
    return sections.map((s) => {
        const title = s.match(/##\s+💡\s*(.*)/)?.[1]?.trim() || "SaaS Idea";
        const oneLiner = s.match(/\*\*One-liner:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const problem = s.match(/\*\*Problem:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const market = s.match(/\*\*Target market:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const signal = s.match(/\*\*Market signal:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const revenue = s.match(/\*\*Revenue model:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const source = s.match(/\*\*Source:\*\*\s*(.*)/)?.[1]?.trim() || "";
        return { title, oneLiner, problem, market, signal, revenue, source };
    });
}

function IdeaCard({ idea, index }: { idea: IdeaBlock; index: number }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "var(--bg-card)",
                border: `1px solid ${hovered ? "var(--border-hover)" : "var(--border)"}`,
                borderRadius: "3px",
                padding: "1.5rem",
                animation: `fadeUp 0.5s ${index * 0.1}s ease both`,
                transition: "border-color 0.25s, transform 0.25s, box-shadow 0.25s",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hovered ? "0 8px 40px rgba(245,166,35,0.06)" : "none",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Number badge */}
            <div
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    fontFamily: "var(--font-display)",
                    fontSize: "3rem",
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    lineHeight: 1,
                    userSelect: "none",
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </div>

            {/* Title */}
            <h3
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    marginBottom: "0.5rem",
                    paddingRight: "3rem",
                }}
            >
                {idea.title}
            </h3>

            {/* One-liner */}
            {idea.oneLiner && (
                <p
                    style={{
                        fontSize: "0.875rem",
                        color: "var(--accent)",
                        fontStyle: "italic",
                        marginBottom: "1rem",
                    }}
                >
                    {idea.oneLiner}
                </p>
            )}

            {/* Tags grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                    { label: "Problem", value: idea.problem },
                    { label: "Target Market", value: idea.market },
                    { label: "Market Signal", value: idea.signal },
                    { label: "Revenue Model", value: idea.revenue },
                ]
                    .filter((f) => f.value)
                    .map((f) => (
                        <div key={f.label}>
                            <div
                                style={{
                                    fontSize: "0.65rem",
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--text-secondary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: "0.2rem",
                                }}
                            >
                                {f.label}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                                {f.value}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Source */}
            {idea.source && (
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Source →{" "}
                    </span>
                    {idea.source.startsWith("http") ? (
                        <a
                            href={idea.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", wordBreak: "break-all" }}
                        >
                            {idea.source}
                        </a>
                    ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{idea.source}</span>
                    )}
                </div>
            )}
        </div>
    );
}

function ToolCallBadge({ query }: { query: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", background: "var(--accent-dim)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "100px", fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--accent)", width: "fit-content", animation: "fadeUp 0.3s ease both" }}>
            <span style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "pulse-ring 1.5s ease infinite" }} />
            Searching: "{query}"
        </div>
    );
}

export default function StreamingResults({ content, isLoading, toolCalls }: Props) {
    const clean = stripThinkTags(content);
    const ideas = parseIdeas(clean);
    const hasFullText = clean.length > 50;

    return (
        <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            {/* Tool call indicators */}
            {toolCalls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {toolCalls.map((q, i) => (
                        <ToolCallBadge key={i} query={q} />
                    ))}
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && ideas.length === 0 && (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} style={{ height: "180px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "3px", animation: `fadeUp 0.4s ${i * 0.08}s ease both`, overflow: "hidden", position: "relative" }}>
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.8s linear infinite" }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Parsed idea cards */}
            {ideas.length > 0 && (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} index={i} />
                    ))}
                </div>
            )}

            {/* Raw text fallback if parsing didn't get cards yet but there's content */}
            {hasFullText && ideas.length === 0 && !isLoading && (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "3px", padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.825rem", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {clean}
                </div>
            )}
        </div>
    );
}
