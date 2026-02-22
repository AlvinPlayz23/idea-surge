import crypto from "node:crypto";
import { Idea } from "@/lib/types";

function normalize(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function computeIdeaFingerprint(idea: Idea): string {
    const payload = [
        normalize(idea.title),
        normalize(idea.problem),
        normalize(idea.targetMarket),
        normalize(idea.revenueModel),
    ].join("|");

    return crypto.createHash("sha256").update(payload).digest("hex");
}
