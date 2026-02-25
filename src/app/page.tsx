"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import SearchBar from "@/components/SearchBar";
import StreamingResults, { ToolExecution } from "@/components/StreamingResults";
import { parseIdeasFromText } from "@/lib/ideaParsing";
import { getIdeas, getPickedIdeaIds, saveIdeas } from "@/lib/ideaStore";
import { getSettings } from "@/lib/settings";
import { Idea } from "@/lib/types";
import { Settings, Bookmark, Sparkles, Compass } from "lucide-react";

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

    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Load Animation with GSAP
    useGSAP(() => {
        if (!hasSearched) {
            gsap.from(".hero-element", {
                y: 40,
                opacity: 0,
                stagger: 0.1,
                duration: 1,
                ease: "power3.out",
                delay: 0.1,
            });
            gsap.from(".nav-bar", {
                y: -20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        }
    }, { dependencies: [hasSearched], scope: containerRef });

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
            setError("Please configure your API key in settings to continue.");
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

        gsap.to(window, { scrollTo: 0, duration: 0.6, ease: "power2.inOut" });

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, settings }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Connection could not be established.");
            }

            if (!res.body) throw new Error("Stream connection failed.");

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
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [hasSearched]);

    return (
        <div ref={containerRef} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Aurora Background */}
            <div className="mesh-bg">
                <div className="mesh-blob blob-1" />
                <div className="mesh-blob blob-2" />
            </div>

            <nav
                className="nav-bar"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 2rem",
                    position: "sticky",
                    top: "1rem",
                    margin: "0 1rem",
                    borderRadius: "24px",
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid var(--border-glass)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                    zIndex: 100,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                        background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                        borderRadius: "50%",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 15px var(--accent-glow)"
                    }}>
                        <Sparkles size={14} color="#fff" />
                    </div>
                    <span
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: "1.2rem",
                            letterSpacing: "-0.02em",
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
                            background: "transparent",
                            border: "none",
                            color: "var(--text-secondary)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            textDecoration: "none",
                            fontWeight: 500,
                            borderRadius: "99px",
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.backgroundColor = "var(--bg-glass-hover)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        <Bookmark size={16} />
                        Library
                    </Link>
                    <Link
                        href="/explore"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-secondary)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            textDecoration: "none",
                            fontWeight: 500,
                            borderRadius: "99px",
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.backgroundColor = "var(--bg-glass-hover)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        <Compass size={16} />
                        Explore
                    </Link>
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            borderRadius: "99px",
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.backgroundColor = "var(--bg-glass-hover)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                </div>
            </nav>

            <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
                <motion.section
                    layout
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{
                        padding: hasSearched ? "2rem 2rem" : "6rem 2rem 4rem",
                        textAlign: "center",
                        maxWidth: "900px",
                        margin: "0 auto",
                        width: "100%"
                    }}
                >
                    <motion.div
                        key="hero-content"
                        initial={{ opacity: restoredCount > 0 ? 1 : 0, y: restoredCount > 0 ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div
                            className="hero-element glass-pill"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.4rem 1.2rem",
                                marginBottom: "2rem",
                                boxShadow: "0 0 20px var(--accent-glow)",
                            }}
                        >
                            <Sparkles size={14} color="var(--accent-purple)" className="animate-float" style={{ animationDuration: "3s" }} />
                            <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-body)", color: "var(--text-primary)", fontWeight: 500 }}>
                                Discover validated SaaS ideas
                            </span>
                        </div>

                        <h1
                            className="hero-element"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: hasSearched ? "clamp(1.8rem, 5vw, 2.5rem)" : "clamp(2.5rem, 8vw, 4.5rem)",
                                fontWeight: 600,
                                lineHeight: 1.1,
                                letterSpacing: "-0.03em",
                                color: "var(--text-primary)",
                                marginBottom: hasSearched ? "1rem" : "1.5rem",
                                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                            }}
                        >
                            The intelligent way to <br />
                            <span className="text-gradient-accent">find your next product</span>
                        </h1>

                        <AnimatePresence>
                            {!hasSearched && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="hero-element"
                                    style={{
                                        fontSize: "1.05rem",
                                        fontFamily: "var(--font-body)",
                                        color: "var(--text-secondary)",
                                        maxWidth: "500px",
                                        margin: "0 auto 3rem",
                                        lineHeight: 1.6,
                                        overflow: "hidden"
                                    }}
                                >
                                    We use AI agents to scan the web, analyzing market signals and identifying underserved niches for your next business.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div layout className={!hasSearched ? "hero-element" : ""}>
                        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                    </motion.div>

                    <AnimatePresence>
                        {restoredCount > 0 && !isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-pill"
                                style={{
                                    marginTop: "1.5rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.5rem 1.2rem",
                                    fontSize: "0.85rem",
                                    fontFamily: "var(--font-body)",
                                    color: "var(--text-primary)",
                                    fontWeight: 500,
                                }}
                            >
                                <Bookmark size={14} color="var(--accent-teal)" />
                                Restored {restoredCount} recent ideas
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass-panel"
                                style={{
                                    marginTop: "1.5rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    padding: "0.75rem 1.5rem",
                                    fontSize: "0.9rem",
                                    fontFamily: "var(--font-body)",
                                    color: "#f87171",
                                    borderRadius: "16px",
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>⚠</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                <AnimatePresence>
                    {hasSearched && (
                        <motion.section
                            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                            style={{ padding: "0 2rem 4rem" }}
                        >
                            <StreamingResults
                                content={content}
                                ideas={ideas}
                                isLoading={isLoading}
                                toolExecutions={toolExecutions}
                            />
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
            <AnimatePresence>
                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            </AnimatePresence>
        </div>
    );
}
