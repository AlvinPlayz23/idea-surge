"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Search, ChevronLeft, ArrowUpRight, FolderHeart, Sparkles, Map } from "lucide-react";

type IdeaRow = {
    id: string;
    category: string | null;
    title: string;
    oneLiner: string;
    problem: string;
    targetMarket: string;
    marketSignal: string;
    revenueModel: string;
    source: string[];
    createdAt: Date;
};

export default function LibraryClient({ initialIdeas }: { initialIdeas: IdeaRow[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = initialIdeas.filter(idea => {
        const query = searchQuery.toLowerCase();
        return (
            idea.title.toLowerCase().includes(query) ||
            idea.oneLiner.toLowerCase().includes(query) ||
            (idea.category || "").toLowerCase().includes(query)
        );
    });

    const grouped = filtered.reduce<Record<string, IdeaRow[]>>(
        (acc, item) => {
            const key = item.category || "Uncategorized";
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        },
        {}
    );

    const categories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    return (
        <main style={{ minHeight: "100vh", position: "relative", padding: "0 0 6rem 0", overflow: "hidden" }}>
            {/* Elegant Background elements */}
            <div className="mesh-bg" style={{ opacity: 0.4 }}>
                <div className="mesh-blob blob-1" style={{ background: "var(--accent-blue)", width: "70vw", height: "70vw", top: "-30%", left: "15%", filter: "blur(120px)" }} />
                <div className="mesh-blob blob-2" style={{ background: "var(--accent-purple)", width: "50vw", height: "50vw", bottom: "0%", right: "-10%", filter: "blur(100px)", opacity: 0.5 }} />
            </div>

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
                {/* Header Section */}
                <header style={{ paddingTop: "5rem", paddingBottom: "4rem", display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", textAlign: "center" }}>
                    <Link
                        href="/"
                        className="glass-pill"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.6rem 1.5rem", color: "var(--text-primary)", textDecoration: "none",
                            fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em",
                            transition: "all 0.3s ease",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.03)",
                            backdropFilter: "blur(20px)"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        <ChevronLeft size={16} /> STUDIO
                    </Link>

                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                                letterSpacing: "-0.03em",
                                color: "var(--text-primary)",
                                fontWeight: 300,
                                lineHeight: 1.1,
                                marginBottom: "1rem"
                            }}
                        >
                            Your <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-teal))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Archive</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6, fontFamily: "var(--font-body)", fontWeight: 400 }}
                        >
                            Curated concepts and saved ventures. The building blocks for your next great product.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        style={{ width: "100%", maxWidth: "600px", marginTop: "1rem" }}
                    >
                        <div style={{ position: "relative" }}>
                            <Search style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} size={20} />
                            <input
                                type="text"
                                placeholder="Search your vault..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "1.25rem 1.25rem 1.25rem 3.5rem",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "20px", color: "var(--text-primary)", fontSize: "1rem", outline: "none",
                                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", backdropFilter: "blur(12px)",
                                    fontFamily: "var(--font-body)", fontWeight: 500
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-purple)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(147, 51, 234, 0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.boxShadow = "none"; }}
                            />
                        </div>
                    </motion.div>
                </header>

                {categories.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "6rem 2rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <FolderHeart size={48} style={{ margin: "0 auto 1.5rem", color: "var(--text-muted)", opacity: 0.5, strokeWidth: 1 }} />
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text-primary)", fontWeight: 400, marginBottom: "0.5rem" }}>The Vault is Empty</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", fontWeight: 300 }}>{searchQuery ? "No matches in your archives." : "Save ideas you discover to build your library."}</p>
                    </motion.div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
                        {categories.map(([category, items], sectionIdx) => (
                            <section key={category}>
                                {/* Category Header */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 * sectionIdx }}
                                    style={{ display: "flex", alignItems: "baseline", gap: "1.5rem", marginBottom: "2.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}
                                >
                                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                        {category}
                                    </h2>
                                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 400 }}>
                                        {items.length} {items.length === 1 ? 'Concept' : 'Concepts'}
                                    </span>
                                </motion.div>

                                {/* Luxury List Layout */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(255,255,255,0.05)", borderRadius: "24px", overflow: "hidden" }}>
                                    <AnimatePresence>
                                        {items.map((idea, idx) => (
                                            <motion.div
                                                key={idea.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: idx * 0.05, ease: "easeOut" }}
                                            >
                                                <Link
                                                    href={`/ideas/${idea.id}`}
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr auto",
                                                        gap: "2rem",
                                                        alignItems: "center",
                                                        background: "var(--bg-base)",
                                                        padding: "2rem",
                                                        textDecoration: "none",
                                                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                                        position: "relative",
                                                        overflow: "hidden"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "var(--bg-glass-hover)";
                                                        const icon = e.currentTarget.querySelector('.card-icon');
                                                        if (icon) (icon as HTMLElement).style.transform = "translate(4px, -4px) scale(1.1)";
                                                        if (icon) (icon as HTMLElement).style.color = "var(--text-primary)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "var(--bg-base)";
                                                        const icon = e.currentTarget.querySelector('.card-icon');
                                                        if (icon) (icon as HTMLElement).style.transform = "translate(0, 0) scale(1)";
                                                        if (icon) (icon as HTMLElement).style.color = "var(--text-muted)";
                                                    }}
                                                >
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                                                            {idea.title}
                                                        </h3>
                                                        <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.5, fontWeight: 300 }}>
                                                            {idea.oneLiner}
                                                        </p>

                                                        {idea.targetMarket && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500, fontFamily: "var(--font-body)" }}>
                                                                <Map size={14} color="var(--accent-purple)" />
                                                                {idea.targetMarket.substring(0, 60)}{idea.targetMarket.length > 60 ? '...' : ''}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="card-icon" style={{
                                                        color: "var(--text-muted)",
                                                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "50%",
                                                        background: "rgba(255,255,255,0.03)",
                                                        border: "1px solid rgba(255,255,255,0.05)"
                                                    }}>
                                                        <ArrowUpRight size={20} strokeWidth={1.5} />
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
