"use client";

import { motion } from "framer-motion";
import { ToolExecution } from "./StreamingResults";
import { X, Code2, Copy, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
    execution: ToolExecution;
    onClose: () => void;
}

export default function ToolOutputModal({ execution, onClose }: Props) {
    const [copied, setCopied] = useState<'args' | 'res' | null>(null);

    const handleCopy = (type: 'args' | 'res', data: any) => {
        try {
            const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch { }
    };

    // Prevent scrolling behind modal
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; }
    }, []);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-glass-heavy)",
                backdropFilter: "blur(24px)",
                padding: "1rem"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="glass-panel"
                style={{
                    width: "100%",
                    maxWidth: "800px",
                    maxHeight: "85vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                }}
            >
                <div style={{ position: "absolute", top: "-50px", left: "50%", transform: "translateX(-50%)", width: "100%", height: "100px", background: "var(--accent-glow)", filter: "blur(40px)", pointerEvents: "none", zIndex: 0 }} />

                <div style={{
                    padding: "1.5rem 2rem",
                    borderBottom: "1px solid var(--border-glass)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 1
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                            <Code2 size={20} color="var(--text-primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.25rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                                {execution.name}
                            </h2>
                            <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                                Context ID: {execution.id}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                    position: "relative",
                    zIndex: 1
                }}>
                    {/* ARGS SECTION */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Parameters
                            </h3>
                            <button
                                onClick={() => handleCopy('args', execution.args)}
                                style={{ background: "none", border: "none", color: copied === 'args' ? "var(--accent-teal)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                            >
                                {copied === 'args' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                Copy
                            </button>
                        </div>
                        <pre style={{
                            background: "var(--bg-input)",
                            padding: "1rem",
                            borderRadius: "12px",
                            overflowX: "auto",
                            color: "var(--text-secondary)",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-body)", // Using clean body font for JSON now
                            margin: 0,
                            lineHeight: 1.6
                        }}>
                            {JSON.stringify(execution.args, null, 2)}
                        </pre>
                    </div>

                    {/* RESULT SECTION */}
                    {execution.result ? (
                        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Output
                                </h3>
                                <button
                                    onClick={() => handleCopy('res', execution.result)}
                                    style={{ background: "none", border: "none", color: copied === 'res' ? "var(--accent-teal)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                                >
                                    {copied === 'res' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                    Copy
                                </button>
                            </div>
                            <pre style={{
                                background: "var(--bg-input)",
                                padding: "1rem",
                                borderRadius: "12px",
                                overflowX: "auto",
                                color: "var(--text-secondary)",
                                fontSize: "0.85rem",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                maxHeight: "300px",
                                lineHeight: 1.6
                            }}>
                                {typeof execution.result === "string" ? execution.result : JSON.stringify(execution.result, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", padding: "1rem", background: "var(--bg-card)", borderRadius: "16px" }}>
                            <div style={{ width: "16px", height: "16px", border: "2px solid var(--border-glass)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                            Awaiting response payload...
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
