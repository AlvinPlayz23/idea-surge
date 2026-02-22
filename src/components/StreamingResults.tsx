"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { stripThinkTags } from "@/lib/ideaParsing";
import { markIdeaPicked } from "@/lib/ideaStore";
import { Idea } from "@/lib/types";
import ToolOutputModal from "./ToolOutputModal";

export interface ToolExecution {
    id: string;
    name: string;
    args: any;
    result?: any;
}

interface Props {
    content: string;
    ideas: Idea[];
    isLoading: boolean;
    toolExecutions: ToolExecution[];
}

function formatIdeaForClipboard(idea: Idea): string {
    return [
        `Title: ${idea.title}`,
        `One-liner: ${idea.oneLiner}`,
        `Problem: ${idea.problem}`,
        `Target market: ${idea.targetMarket}`,
        `Market signal: ${idea.marketSignal}`,
        `Revenue model: ${idea.revenueModel}`,
        `Sources: ${idea.source.join(", ")}`,
    ].join("\n");
}

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formatIdeaForClipboard(idea));
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    };

    const handleOpenDetails = () => {
        markIdeaPicked(idea.id);
        fetch("/api/ideas/mark-picked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea }),
        }).catch(() => undefined);
        router.push(`/ideas/${idea.id}`);
    };

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "var(--bg-card)",
                border: `1px solid ${hovered ? "var(--border-hover)" : "var(--border)"}`,
                borderRadius: "3px",
                padding: "1.5rem",
                animation: `fadeUp 0.5s ${index * 0.08}s ease both`,
                transition: "border-color 0.25s, transform 0.25s, box-shadow 0.25s",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hovered ? "0 8px 40px rgba(245,166,35,0.06)" : "none",
                position: "relative",
                overflow: "hidden",
            }}
        >
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
            {idea.category && (
                <div style={{ display: "inline-block", marginBottom: "0.65rem", padding: "0.15rem 0.45rem", border: "1px solid rgba(245,166,35,0.3)", background: "var(--accent-dim)", color: "var(--accent)", borderRadius: "2px", fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {idea.category}
                </div>
            )}

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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                {[
                    { label: "Problem", value: idea.problem },
                    { label: "Target Market", value: idea.targetMarket },
                    { label: "Market Signal", value: idea.marketSignal },
                    { label: "Revenue Model", value: idea.revenueModel },
                ]
                    .filter((field) => field.value)
                    .map((field) => (
                        <div key={field.label}>
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
                                {field.label}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                                {field.value}
                            </div>
                        </div>
                    ))}
            </div>

            {idea.source.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Sources
                    </span>
                    <div style={{ marginTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        {idea.source.slice(0, 3).map((source) => (
                            source.startsWith("http") ? (
                                <a
                                    key={source}
                                    href={source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", wordBreak: "break-all" }}
                                >
                                    {source}
                                </a>
                            ) : (
                                <span key={source} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                    {source}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                    onClick={handleOpenDetails}
                    style={{
                        background: "var(--accent)",
                        border: "1px solid var(--accent)",
                        borderRadius: "2px",
                        color: "#000",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        letterSpacing: "0.04em",
                        padding: "0.45rem 0.9rem",
                        cursor: "pointer",
                    }}
                >
                    Open Details
                </button>
                <button
                    onClick={handleCopy}
                    style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: "2px",
                        color: copied ? "var(--accent)" : "var(--text-secondary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        padding: "0.45rem 0.9rem",
                        cursor: "pointer",
                    }}
                >
                    {copied ? "Copied" : "Copy Idea"}
                </button>
            </div>
        </div>
    );
}

function ToolCallBadge({ execution, onClick }: { execution: ToolExecution; onClick: () => void }) {
    const isSearch = execution.name === "webSearch";
    const label = isSearch ? `Search: "${execution.args.query}"` : `Read: ${execution.args.url?.slice(0, 30)}...`;

    return (
        <button
            onClick={onClick}
            title="Click to view raw research data"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.75rem",
                background: "var(--accent-dim)",
                border: "1px solid rgba(245,166,35,0.2)",
                borderRadius: "100px",
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono)",
                color: "var(--accent)",
                width: "fit-content",
                animation: "fadeUp 0.3s ease both",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "rgba(245,166,35,0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
                e.currentTarget.style.background = "var(--accent-dim)";
            }}
        >
            <span style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "pulse-ring 1.5s ease infinite" }} />
            {label}
            {execution.result && (
                <span style={{ fontSize: "0.6rem", opacity: 0.7, marginLeft: "0.2rem" }}>✓</span>
            )}
        </button>
    );
}

export default function StreamingResults({ content, ideas, isLoading, toolExecutions }: Props) {
    const [selectedExecution, setSelectedExecution] = useState<ToolExecution | null>(null);

    const displayIdeas = ideas;
    const clean = stripThinkTags(content);

    return (
        <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            {toolExecutions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {toolExecutions.map((exec) => (
                        <ToolCallBadge
                            key={exec.id}
                            execution={exec}
                            onClick={() => setSelectedExecution(exec)}
                        />
                    ))}
                </div>
            )}

            {selectedExecution && (
                <ToolOutputModal
                    execution={selectedExecution}
                    onClose={() => setSelectedExecution(null)}
                />
            )}

            {isLoading && displayIdeas.length === 0 && (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} style={{ height: "180px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "3px", animation: `fadeUp 0.4s ${i * 0.08}s ease both`, overflow: "hidden", position: "relative" }}>
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.8s linear infinite" }} />
                        </div>
                    ))}
                </div>
            )}

            {displayIdeas.length > 0 && (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {displayIdeas.map((idea, index) => (
                        <IdeaCard key={idea.id || `${idea.title}-${index}`} idea={idea} index={index} />
                    ))}
                </div>
            )}

            {!isLoading && displayIdeas.length === 0 && clean.length > 50 && (
                <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    lineHeight: 2,
                }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>Research complete - no structured ideas detected</div>
                    <div>The model output format was unexpected. Re-run search or adjust your model settings.</div>
                </div>
            )}
        </div>
    );
}
