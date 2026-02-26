"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Search, ChevronLeft, ArrowRight, Zap, Target, Signal, Coins } from "lucide-react";

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

export default function ExploreClient({ initialIdeas }: { initialIdeas: IdeaRow[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = initialIdeas.filter(idea => {
        const query = searchQuery.toLowerCase();
        return (
            idea.title.toLowerCase().includes(query) ||
            idea.oneLiner.toLowerCase().includes(query) ||
            (idea.category || "").toLowerCase().includes(query)
        );
    });

    // Group filtered ideas by category
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
            {/* Background elements */}
            <div className="mesh-bg">
                <div className="mesh-blob blob-1" style={{ background: "var(--accent-glow)", width: "60vw", height: "60vw", top: "-20%", left: "-10%" }} />
                <div className="mesh-blob blob-2" style={{ background: "var(--accent-glow-strong)", width: "50vw", height: "50vw", bottom: "-10%", right: "-10%" }} />
            </div>

            {/* Grid overlay */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3, zIndex: 0, pointerEvents: "none", maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)" }} />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
                {/* Header Section */}
                <header style={{ paddingTop: "4rem", paddingBottom: "3rem", borderBottom: "1px solid var(--border-glass-strong)", marginBottom: "3rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
                        <div style={{ maxWidth: "600px" }}>
                            <Link
                                href="/"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.5rem 1rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)",
                                    borderRadius: "99px", color: "var(--text-secondary)", textDecoration: "none",
                                    fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                                    marginBottom: "2rem", transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-glass-hover)" }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-glass)" }}
                            >
                                <ChevronLeft size={16} /> Back to Generator
                            </Link>

                            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 6vw, 4.5rem)", letterSpacing: "-0.04em", color: "var(--text-primary)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem", textTransform: "uppercase" }}>
                                The <span style={{ color: "var(--accent-teal)", WebkitTextStroke: "1px var(--accent-blue)", textShadow: "0 0 40px var(--accent-glow)" }}>Recycle</span> Bin
                            </h1>
                            <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                                Ideas discarded by other founders. One person's pass is another person's unicorn. Filter the noise and find your next venture.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div style={{ flex: "1 1 300px", minWidth: "300px", maxWidth: "400px", alignSelf: "flex-end" }}>
                            <div style={{ position: "relative" }}>
                                <Search style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} size={20} />
                                <input
                                    type="text"
                                    placeholder="Search markets, ideas, categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%", padding: "1.25rem 1.25rem 1.25rem 3.5rem",
                                        background: "var(--bg-input)", border: "1px solid var(--border-glass-strong)",
                                        borderRadius: "16px", color: "var(--text-primary)", fontSize: "1rem", outline: "none",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transition: "all 0.3s ease",
                                        fontFamily: "var(--font-body)"
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-teal)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-glow-alpha)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-glass-strong)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                {categories.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "6rem 2rem", textAlign: "center" }}>
                        <Compass size={64} style={{ margin: "0 auto 1.5rem", color: "var(--border-glass-strong)" }} />
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.5rem" }}>Nothing Found</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>{searchQuery ? "No ideas match your search criteria." : "The pool is currently empty. Start generating ideas!"}</p>
                    </motion.div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
                        {categories.map(([category, items]) => (
                            <section key={category}>
                                {/* Category Header */}
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--text-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                                        {category}
                                    </h2>
                                    <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, var(--border-glass-strong), transparent)" }} />
                                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-teal)" }}>
                                        {String(items.length).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Cards Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
                                    <AnimatePresence>
                                        {items.map((idea, idx) => (
                                            <motion.div
                                                key={idea.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <Link
                                                    href={`/ideas/${idea.id}`}
                                                    style={{
                                                        display: "block",
                                                        height: "100%",
                                                        background: "var(--bg-card)",
                                                        border: "1px solid var(--border-glass)",
                                                        borderRadius: "20px",
                                                        padding: "2rem",
                                                        textDecoration: "none",
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        transition: "all 0.3s ease",
                                                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "var(--accent-teal)";
                                                        e.currentTarget.style.transform = "translateY(-5px)";
                                                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-teal)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "var(--border-glass)";
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
                                                    }}
                                                >
                                                    {/* Card Header */}
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                                                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, paddingRight: "1rem" }}>
                                                            {idea.title}
                                                        </h3>
                                                        <div style={{ background: "var(--bg-glass-heavy)", padding: "0.5rem", borderRadius: "50%", color: "var(--text-primary)" }}>
                                                            <ArrowRight size={20} />
                                                        </div>
                                                    </div>

                                                    <p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "2rem" }}>
                                                        {idea.oneLiner}
                                                    </p>

                                                    {/* Card Meta Stats (Brutalist style) */}
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", borderTop: "1px solid var(--border-glass)", paddingTop: "1.5rem" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase" }}>
                                                            <Zap size={14} color="var(--accent-blue)" /> {idea.targetMarket.substring(0, 20)}...
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase" }}>
                                                            <Coins size={14} color="var(--accent-teal)" /> Monetization
                                                        </div>
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
