"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

interface Props {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

const placeholders = [
    "AI tools for interior designers...",
    "SaaS for freelance writers...",
    "Automation for local bakeries...",
    "CRM for indie game developers..."
];

export default function SearchBar({ onSearch, isLoading }: Props) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onSearch(query.trim());
        }
    };

    return (
        <div style={{ width: "100%", maxWidth: "700px", margin: "0 auto" }}>
            <motion.form
                onSubmit={handleSubmit}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="glass-pill"
                style={{
                    position: "relative",
                    padding: "6px 6px 6px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s ease",
                    boxShadow: isFocused ? "0 8px 32px var(--accent-glow-strong)" : "0 4px 16px rgba(0,0,0,0.2)",
                    border: isFocused ? "1px solid var(--accent-purple)" : "1px solid var(--border-glass)",
                }}
            >
                <Search size={20} color={isFocused ? "var(--accent-purple)" : "var(--text-muted)"} style={{ transition: "color 0.3s" }} />

                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-body)",
                            fontSize: "1.05rem",
                            width: "100%",
                            outline: "none",
                            padding: "12px 0",
                            zIndex: 2,
                        }}
                    />

                    {!query && !isFocused && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={placeholderIdx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    color: "var(--text-muted)",
                                    pointerEvents: "none",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "1.05rem",
                                    zIndex: 1,
                                }}
                            >
                                {placeholders[placeholderIdx]}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                <motion.button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    whileHover={!isLoading && query.trim() ? { scale: 1.05 } : {}}
                    whileTap={!isLoading && query.trim() ? { scale: 0.95 } : {}}
                    style={{
                        background: isLoading || !query.trim() ? "var(--bg-glass-heavy)" : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                        border: "none",
                        borderRadius: "99px",
                        padding: "12px 24px",
                        color: isLoading || !query.trim() ? "var(--text-muted)" : "#fff",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: isLoading || !query.trim() ? "none" : "0 4px 12px var(--accent-glow)",
                        transition: "all 0.3s ease"
                    }}
                >
                    {isLoading ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                style={{ display: "flex" }}
                            >
                                <Sparkles size={16} />
                            </motion.div>
                            Scanning
                        </>
                    ) : (
                        "Discover"
                    )}
                </motion.button>
            </motion.form>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                    hidden: {}
                }}
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "1.5rem",
                    justifyContent: "center"
                }}
            >
                {["Knowledge base for Notion", "Automation for plant care", "CRM for Twitch streamers"].map((s) => (
                    <motion.button
                        key={s}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.03, backgroundColor: "var(--bg-glass-hover)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            setQuery(s);
                            setIsFocused(true);
                        }}
                        className="glass-pill"
                        style={{
                            padding: "6px 14px",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                    >
                        {s}
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
}
