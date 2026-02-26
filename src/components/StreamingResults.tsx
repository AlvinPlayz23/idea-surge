"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ClipboardCopy, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

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
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formatIdeaForClipboard(idea));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)", borderColor: "rgba(255,255,255,0.2)" }}
            className="glass-panel"
            style={{
                padding: "2.5rem",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
        >
            {/* Subtle Gradient Glow inside Card */}
            <div style={{
                position: "absolute",
                top: 0, right: 0,
                width: "150px", height: "150px",
                background: "radial-gradient(circle, var(--accent-glow-alpha), transparent 70%)",
                filter: "blur(30px)",
                zIndex: 0,
                pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <motion.h3
                        layout="position"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            paddingRight: "2rem"
                        }}
                    >
                        {idea.title}
                    </motion.h3>

                    {idea.category && (
                        <div className="glass-pill" style={{ padding: "0.3rem 0.8rem", color: "var(--accent-teal)", fontSize: "0.75rem", fontWeight: 600, border: "1px solid var(--accent-glow-alpha-3)", background: "var(--accent-glow-alpha-3)" }}>
                            {idea.category}
                        </div>
                    )}
                </div>

                {idea.oneLiner && (
                    <motion.p
                        layout="position"
                        style={{
                            fontSize: "1.05rem",
                            color: "var(--text-secondary)",
                            marginBottom: "2rem",
                            fontFamily: "var(--font-body)",
                            lineHeight: 1.6,
                        }}
                    >
                        {idea.oneLiner}
                    </motion.p>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.03)" }}>
                    {[
                        { label: "The Problem", value: idea.problem },
                        { label: "Target Market", value: idea.targetMarket },
                        { label: "Market Signal", value: idea.marketSignal },
                        { label: "Monetization", value: idea.revenueModel },
                    ]
                        .filter((field) => field.value)
                        .map((field) => (
                            <div key={field.label}>
                                <div
                                    style={{
                                        fontSize: "0.75rem",
                                        fontFamily: "var(--font-body)",
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        letterSpacing: "0.05em",
                                        marginBottom: "0.4rem",
                                    }}
                                >
                                    {field.label}
                                </div>
                                <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                                    {field.value}
                                </div>
                            </div>
                        ))}
                </div>

                {idea.source.length > 0 && (
                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                            Signals Sourced From
                        </span>
                        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {idea.source.slice(0, 3).map((source) => (
                                source.startsWith("http") ? (
                                    <a
                                        key={source}
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: "0.85rem", color: "var(--accent-blue)", textDecoration: "none", wordBreak: "break-all", display: "inline-flex", alignItems: "center", gap: "0.25rem", transition: "color 0.2s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-purple)"}
                                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--accent-blue)"}
                                    >
                                        <ChevronRight size={14} />
                                        {source}
                                    </a>
                                ) : (
                                    <span key={source} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <ChevronRight size={14} />
                                        {source}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenDetails}
                        style={{
                            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                            border: "none",
                            color: "#fff",
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            borderRadius: "99px",
                            padding: "0.75rem 1.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            boxShadow: "0 4px 15px var(--accent-glow)",
                            transition: "box-shadow 0.3s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 25px var(--accent-glow-strong)"}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 15px var(--accent-glow)"}
                    >
                        Explore Idea <ArrowRight size={16} strokeWidth={2.5} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "var(--bg-glass-hover)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        className="glass-pill"
                        style={{
                            color: copied ? "var(--accent-teal)" : "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            fontSize: "0.9rem",
                            padding: "0.75rem 1.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.3s ease"
                        }}
                    >
                        {copied ? <CheckCircle2 size={16} /> : <ClipboardCopy size={16} />}
                        {copied ? "Copied" : "Copy Details"}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function ToolCallBadge({ execution, onClick }: { execution: ToolExecution; onClick: () => void }) {
    const isSearch = execution.name === "webSearch";
    const label = isSearch ? `Searching: "${execution.args.query}"` : `Reading: ${execution.args.url?.slice(0, 35)}...`;

    return (
        <motion.button
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.02, backgroundColor: "var(--bg-glass-hover)", borderColor: "rgba(255,255,255,0.2)" }}
            onClick={onClick}
            title="Inspect Agent Log"
            className="glass-pill"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                fontFamily: "var(--font-body)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.3s ease"
            }}
        >
            {execution.result ? (
                <CheckCircle2 size={14} color="var(--accent-teal)" />
            ) : (
                <Activity size={14} color="var(--accent-blue)" style={{ animation: "pulse-glow 2s infinite" }} />
            )}
            {label}
        </motion.button>
    );
}

export default function StreamingResults({ content, ideas, isLoading, toolExecutions }: Props) {
    const [selectedExecution, setSelectedExecution] = useState<ToolExecution | null>(null);

    const displayIdeas = ideas;
    const clean = stripThinkTags(content);

    return (
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            <motion.div layout style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2.5rem", justifyContent: "center" }}>
                <AnimatePresence>
                    {toolExecutions.map((exec) => (
                        <ToolCallBadge
                            key={exec.id}
                            execution={exec}
                            onClick={() => setSelectedExecution(exec)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {selectedExecution && (
                    <ToolOutputModal
                        execution={selectedExecution}
                        onClose={() => setSelectedExecution(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLoading && displayIdeas.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: "grid", gap: "2rem" }}
                    >
                        {[0, 1].map((i) => (
                            <motion.div
                                key={`skeleton-${i}`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="glass-panel"
                                style={{ height: "280px", position: "relative", overflow: "hidden" }}
                            >
                                <motion.div
                                    animate={{ left: ["-100%", "200%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }}
                                />
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Sparkles size={16} className="animate-float" /> Synthesizing data...
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div layout style={{ display: "grid", gap: "2rem" }}>
                <AnimatePresence>
                    {displayIdeas.map((idea, index) => (
                        <IdeaCard key={idea.id || `${idea.title}-${index}`} idea={idea} index={index} />
                    ))}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {!isLoading && displayIdeas.length === 0 && clean.length > 50 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel"
                        style={{
                            padding: "4rem",
                            textAlign: "center",
                            color: "var(--text-primary)",
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1.5rem", color: "var(--accent-purple)", filter: "drop-shadow(0 0 10px var(--accent-glow-strong))" }}>✧</div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.5rem", marginBottom: "0.75rem" }}>No clear patterns found</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "1rem", fontFamily: "var(--font-body)", maxWidth: "400px", margin: "0 auto" }}>
                            The AI analyzed the given input but couldn't structure it into actionable SaaS ideas. Try a broader search.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
