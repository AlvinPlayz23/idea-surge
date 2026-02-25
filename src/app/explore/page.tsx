import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Compass, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
    const recycledIdeas = await prisma.ideaRecord.findMany({
        where: { status: "RECYCLED" },
        orderBy: [{ recycledAt: "desc" }, { createdAt: "desc" }],
    });

    const grouped = recycledIdeas.reduce<Record<string, typeof recycledIdeas>>((acc: Record<string, typeof recycledIdeas>, item) => {
        const key = item.category || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const categories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    return (
        <main style={{ minHeight: "100vh", padding: "2rem 1.5rem 4rem", maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
            <div className="mesh-bg">
                <div className="mesh-blob blob-1" style={{ background: "rgba(16, 185, 129, 0.15)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", position: "relative", zIndex: 10 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", letterSpacing: "-0.02em", marginBottom: "0.3rem", color: "var(--text-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Compass className="text-gradient-accent" size={32} color="var(--accent-teal)" />
                        Explore Recycled Ideas
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
                        Discover ideas that others searched for but didn't pick.
                    </p>
                </div>
                <Link
                    href="/"
                    className="glass-pill"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.6rem 1.25rem", color: "var(--text-secondary)", textDecoration: "none",
                        fontSize: "0.9rem", fontWeight: 500, transition: "all 0.2s"
                    }}
                >
                    <ChevronLeft size={16} /> Back to Search
                </Link>
            </div>

            {categories.length === 0 ? (
                <section className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-secondary)", position: "relative", zIndex: 10 }}>
                    <Compass size={48} color="var(--border-glass-strong)" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                    <p style={{ fontSize: "1.1rem" }}>No recycled ideas yet.</p>
                    <p style={{ fontSize: "0.95rem", opacity: 0.7, marginTop: "0.5rem" }}>As people search for ideas, the ones they discard will appear here.</p>
                </section>
            ) : (
                <div style={{ display: "grid", gap: "2rem", position: "relative", zIndex: 10 }}>
                    {categories.map(([category, items]) => (
                        <section key={category}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--accent-teal)", fontWeight: 600, borderRadius: "99px", padding: "0.4rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                                {category} <span style={{ opacity: 0.7, fontWeight: 400 }}>{items.length}</span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
                                {items.map((idea) => (
                                    <Link
                                        key={idea.id}
                                        href={`/ideas/${idea.id}`}
                                        className="glass-panel"
                                        style={{
                                            padding: "1.5rem", textDecoration: "none", color: "inherit",
                                            display: "flex", flexDirection: "column", gap: "0.75rem",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                                            {idea.title}
                                        </div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontStyle: "italic", flex: 1 }}>
                                            {idea.oneLiner}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </main>
    );
}
