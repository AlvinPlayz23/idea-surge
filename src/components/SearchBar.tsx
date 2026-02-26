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
                className=""
                style={{
                    position: "relative",
                    padding: "8px 8px 8px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isFocused ? "0 8px 40px rgba(147, 51, 234, 0.2)" : "0 10px 30px rgba(0,0,0,0.5)",
                    border: isFocused ? "1px solid var(--accent-purple)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "999px",
                    background: isFocused ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
                    backdropFilter: "blur(20px)",
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
                        background: isLoading || !query.trim() ? "transparent" : "var(--text-primary)",
                        border: isLoading || !query.trim() ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--text-primary)",
                        borderRadius: "99px",
                        padding: "14px 28px",
                        color: isLoading || !query.trim() ? "var(--text-muted)" : "var(--bg-base)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        letterSpacing: "0.02em",
                        cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: isLoading || !query.trim() ? "none" : "0 4px 12px rgba(255,255,255,0.15)",
                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading && query.trim()) {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,255,255,0.3)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading && query.trim()) {
                            e.currentTarget.style.background = "var(--text-primary)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,255,255,0.15)";
                        }
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
                        className=""
                        style={{
                            padding: "6px 14px",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "99px"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                    >
                        {s}
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
}
