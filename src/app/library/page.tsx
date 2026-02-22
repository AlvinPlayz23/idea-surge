import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
    const recycledIdeas = await prisma.ideaRecord.findMany({
        where: { status: "RECYCLED" },
        orderBy: [{ recycledAt: "desc" }, { createdAt: "desc" }],
    });

    const grouped = recycledIdeas.reduce<Record<string, typeof recycledIdeas>>((acc, item) => {
        const key = item.category || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const categories = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    return (
        <main style={{ minHeight: "100vh", padding: "2rem 1.25rem 3rem", maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "0.3rem" }}>
                        Recycled Idea Library
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                        Unpicked ideas are auto-recycled here. Pick one, deepen it, and brainstorm.
                    </p>
                </div>
                <Link
                    href="/"
                    style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        borderRadius: "2px",
                        padding: "0.45rem 0.75rem",
                        textDecoration: "none",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                    }}
                >
                    Back to search
                </Link>
            </div>

            {categories.length === 0 ? (
                <section style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1.25rem", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                    No recycled ideas yet. Generate ideas and leave some unpicked, then run a new search to recycle them.
                </section>
            ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {categories.map(([category, items]) => (
                        <section key={category} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: "3px", padding: "1rem" }}>
                            <div style={{ display: "inline-block", background: "var(--accent-dim)", border: "1px solid rgba(245,166,35,0.35)", color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: 700, borderRadius: "2px", padding: "0.2rem 0.5rem", marginBottom: "0.75rem" }}>
                                {category} ({items.length})
                            </div>

                            <div style={{ display: "grid", gap: "0.7rem" }}>
                                {items.map((idea) => (
                                    <Link
                                        key={idea.id}
                                        href={`/ideas/${idea.id}`}
                                        style={{
                                            border: "1px solid var(--border)",
                                            borderRadius: "2px",
                                            padding: "0.75rem",
                                            textDecoration: "none",
                                            color: "inherit",
                                            background: "rgba(255,255,255,0.01)",
                                        }}
                                    >
                                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                                            {idea.title}
                                        </div>
                                        <div style={{ fontSize: "0.82rem", color: "var(--accent)", marginBottom: "0.35rem", fontStyle: "italic" }}>
                                            {idea.oneLiner}
                                        </div>
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                                            {idea.problem}
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
