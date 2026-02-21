"use client";

import { useEffect, useState } from "react";

interface Props {
    execution: {
        id: string;
        name: string;
        args: any;
        result?: any;
    };
    onClose: () => void;
}

export default function ToolOutputModal({ execution, onClose }: Props) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Extract content to show
    // Tools return { results: string } for webSearch and { content: string } for readPage
    const getDisplayContent = () => {
        if (!execution.result) return null;

        // Handle webSearch - result is { results: "Title: ...\nURL: ...\n..." }
        if (execution.name === "webSearch") {
            return execution.result.results ?? JSON.stringify(execution.result, null, 2);
        }

        // Handle readPage - result is { content: "..." }
        if (execution.name === "readPage") {
            return execution.result.content ?? JSON.stringify(execution.result, null, 2);
        }

        // Fallback for any other tool
        const raw = execution.result;
        return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    };

    const content = getDisplayContent();

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    width: "100%",
                    maxWidth: "800px",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    animation: "fadeUp 0.3s ease",
                    boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "1rem 1.5rem",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "0.6rem",
                                fontFamily: "var(--font-mono)",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "0.2rem",
                            }}
                        >
                            Tool Execution Results
                        </div>
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.9rem",
                                color: "var(--accent)",
                                fontWeight: 600,
                            }}
                        >
                            {execution.name}({JSON.stringify(execution.args).slice(0, 40)}...)
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            transition: "all 0.2s",
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
                        Esc
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "1.5rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        lineHeight: 1.6,
                        color: "var(--text-primary)",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {execution.result ? (
                        content
                    ) : (
                        <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Waiting for tool results...
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "0.75rem 1.5rem",
                        background: "rgba(255,255,255,0.02)",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            background: "var(--accent)",
                            border: "none",
                            color: "#000",
                            padding: "0.5rem 1.25rem",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
