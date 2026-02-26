"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ClipboardCopy, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

import { stripThinkTags } from "@/lib/ideaParsing";
import { markIdeaPicked, getIdeas, getPickedIdeaIds } from "@/lib/ideaStore";
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

        // Immediately recycle the other ideas from the same search batch
        const allIdeas = getIdeas();
        const unpickedIdeas = allIdeas.filter((i) => i.id !== idea.id && !getPickedIdeaIds().includes(i.id));

        if (unpickedIdeas.length > 0) {
            fetch("/api/ideas/recycle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ideas: unpickedIdeas }),
            }).catch(() => undefined);
        }

        router.push(`/ideas/${idea.id}`);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--accent-purple)", borderColor: "transparent" }}
            className="glass-panel"
            style={{
                padding: "3rem",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                background: "var(--bg-card)",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "2rem"
            }}
        >
            {/* Elegant Glow overlay */}
            <div style={{
                position: "absolute",
                top: "-10%", right: "-10%",
                width: "200px", height: "200px",
                background: "radial-gradient(circle, var(--accent-purple), transparent 70%)",
                filter: "blur(60px)",
                opacity: 0.15,
                zIndex: 0,
                pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {idea.category && (
                            <div style={{
                                display: "inline-flex", padding: "0.4rem 1rem",
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                                color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600,
                                borderRadius: "99px", letterSpacing: "0.05em", textTransform: "uppercase", alignSelf: "flex-start"
                            }}>
                                {idea.category}
                            </div>
                        )}
                        <motion.h3
                            layout="position"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.1,
                            }}
                        >
                            {idea.title}
                        </motion.h3>
                    </div>
                </div>

                {/* One Liner */}
                {idea.oneLiner && (
                    <motion.p
                        layout="position"
                        style={{
                            fontSize: "1.2rem",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 300,
                            lineHeight: 1.6,
                            paddingBottom: "2rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)"
                        }}
                    >
                        {idea.oneLiner}
                    </motion.p>
                )}

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                    {[
                        { label: "The Problem", value: idea.problem },
                        { label: "Target Market", value: idea.targetMarket },
                        { label: "Market Signal", value: idea.marketSignal },
                        { label: "Monetization", value: idea.revenueModel },
                    ]
                        .filter((field) => field.value)
                        .map((field) => (
                            <div key={field.label} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div
                                    style={{
                                        fontSize: "0.75rem",
                                        fontFamily: "var(--font-display)",
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        letterSpacing: "0.1em",
                                    }}
                                >
                                    {field.label}
                                </div>
                                <div style={{ fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 300 }}>
                                    {field.value}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Sources */}
                {idea.source.length > 0 && (
                    <div style={{ marginTop: "1rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>
                            Signals Sourced From
                        </span>
                        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {idea.source.slice(0, 3).map((source) => (
                                source.startsWith("http") ? (
                                    <a
                                        key={source}
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: "0.9rem", color: "var(--accent-teal)", textDecoration: "none", wordBreak: "break-all", display: "inline-flex", alignItems: "center", gap: "0.4rem", transition: "color 0.2s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--accent-teal)"}
                                    >
                                        <ChevronRight size={16} opacity={0.5} />
                                        {source}
                                    </a>
                                ) : (
                                    <span key={source} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <ChevronRight size={16} opacity={0.5} />
                                        {source}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenDetails}
                        style={{
                            background: "var(--text-primary)",
                            color: "var(--bg-base)",
                            border: "none",
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "1rem",
                            letterSpacing: "0.02em",
                            borderRadius: "99px",
                            padding: "1rem 2rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,255,255,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--text-primary)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                        Save to Vault <ArrowRight size={18} strokeWidth={2.5} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        style={{
                            color: copied ? "var(--accent-teal)" : "var(--text-secondary)",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            fontSize: "0.95rem",
                            borderRadius: "99px",
                            padding: "1rem 2rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.3s ease"
                        }}
                    >
                        {copied ? <CheckCircle2 size={18} /> : <ClipboardCopy size={18} />}
                        {copied ? "Copied" : "Copy Details"}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function ToolCallBadge({ execution, onClick }: { execution: ToolExecution; onClick: () => void }) {
    const name = execution.name;
    const searchTools = ["webSearch", "web_search_exa", "web_search_advanced_exa", "company_research_exa", "people_search_exa"];
    const crawlTools = ["readPage", "crawling_exa", "get_code_context_exa"];
    const deepTools = ["deep_researcher_start", "deep_researcher_check"];

    let label: string;
    if (searchTools.includes(name)) {
        const q = execution.args.query || execution.args.q || "";
        label = `Searching: "${String(q).slice(0, 40)}"`;
    } else if (crawlTools.includes(name)) {
        const url = execution.args.url || execution.args.urls?.[0] || "";
        label = `Reading: ${String(url).slice(0, 38)}…`;
    } else if (deepTools.includes(name)) {
        label = name === "deep_researcher_start" ? "Deep research…" : "Checking research…";
    } else {
        label = name.replace(/_exa$/, "").replace(/_/g, " ");
    }

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

const BADGE_LIMIT = 2;

export default function StreamingResults({ content, ideas, isLoading, toolExecutions }: Props) {
    const [selectedExecution, setSelectedExecution] = useState<ToolExecution | null>(null);
    const [badgesExpanded, setBadgesExpanded] = useState(false);

    const displayIdeas = ideas;
    const clean = stripThinkTags(content);

    const visibleExecutions = badgesExpanded ? toolExecutions : toolExecutions.slice(0, BADGE_LIMIT);
    const hasMore = toolExecutions.length > BADGE_LIMIT;
    const hiddenCount = toolExecutions.length - BADGE_LIMIT;

    return (
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            {toolExecutions.length > 0 && (
                <motion.div layout style={{ marginBottom: "2.5rem" }}>
                    <motion.div layout style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                        <AnimatePresence>
                            {visibleExecutions.map((exec) => (
                                <ToolCallBadge
                                    key={exec.id}
                                    execution={exec}
                                    onClick={() => setSelectedExecution(exec)}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    <AnimatePresence>
                        {hasMore && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: "flex", justifyContent: "center", marginTop: "0.75rem" }}
                            >
                                <motion.button
                                    layout
                                    whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.2)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setBadgesExpanded((prev) => !prev)}
                                    className="glass-pill"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        padding: "0.35rem 1rem",
                                        fontSize: "0.75rem",
                                        fontFamily: "var(--font-body)",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                        transition: "all 0.3s ease",
                                        border: "1px dashed rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <motion.span
                                        animate={{ rotate: badgesExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.25 }}
                                        style={{ display: "inline-flex", alignItems: "center" }}
                                    >
                                        ▾
                                    </motion.span>
                                    {badgesExpanded ? "See less" : `+${hiddenCount} more searches`}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

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
                                className=""
                                style={{ height: "350px", position: "relative", overflow: "hidden", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <motion.div
                                    animate={{ left: ["-100%", "200%"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)" }}
                                />
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                    <Sparkles size={18} className="animate-float" /> Synthesizing data...
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
                        className=""
                        style={{
                            padding: "6rem 2rem",
                            textAlign: "center",
                            color: "var(--text-primary)",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "24px",
                            border: "1px solid rgba(255,255,255,0.05)"
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1.5rem", color: "var(--text-muted)", opacity: 0.3 }}>✧</div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.8rem", marginBottom: "1rem" }}>No structural patterns found</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "1.05rem", fontFamily: "var(--font-body)", maxWidth: "450px", margin: "0 auto", fontWeight: 300 }}>
                            The agent analyzed the inputs but couldn't structure it into reliable SaaS opportunities. Try a broader search.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
