"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
    "SaaS for remote team management",
    "AI tools for small businesses",
    "Subscription software for restaurants",
    "Niche B2B tools under $100/mo",
    "Developer productivity tools",
    "Automation for e-commerce sellers",
    "SaaS for content creators",
    "Healthcare & wellness software",
];

interface Props {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: Props) {
    const [query, setQuery] = useState("");
    const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % SUGGESTIONS.length;
            setPlaceholder(SUGGESTIONS[i]);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const submit = () => {
        const q = query.trim();
        if (q && !isLoading) onSearch(q);
    };

    return (
        <div style={{ width: "100%", maxWidth: "680px", margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    overflow: "hidden",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: "0 0 0 0 transparent",
                }}
                onFocus={() => { }}
            >
                {/* Search icon */}
                <div style={{ padding: "0 1rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder={placeholder}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.95rem",
                        padding: "1rem 0",
                        caretColor: "var(--accent)",
                    }}
                />
                <button
                    onClick={submit}
                    disabled={isLoading || !query.trim()}
                    style={{
                        background: isLoading ? "var(--bg)" : "var(--accent)",
                        border: "none",
                        color: isLoading ? "var(--text-secondary)" : "#000",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        letterSpacing: "0.05em",
                        padding: "0.75rem 1.5rem",
                        cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
                        transition: "background 0.2s, opacity 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        whiteSpace: "nowrap",
                        opacity: !query.trim() ? 0.5 : 1,
                    }}
                >
                    {isLoading ? (
                        <>
                            <span
                                style={{
                                    width: "12px",
                                    height: "12px",
                                    border: "2px solid var(--text-muted)",
                                    borderTopColor: "var(--accent)",
                                    borderRadius: "50%",
                                    display: "inline-block",
                                    animation: "spin-slow 0.8s linear infinite",
                                }}
                            />
                            Searching…
                        </>
                    ) : (
                        "Discover →"
                    )}
                </button>
            </div>
            {/* Suggestions chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem", justifyContent: "center" }}>
                {SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                        key={s}
                        onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                        disabled={isLoading}
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: "100px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            padding: "0.25rem 0.65rem",
                            cursor: "pointer",
                            transition: "border-color 0.2s, color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
