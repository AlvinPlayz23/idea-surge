import { DeepDiveResult, Idea } from "@/lib/types";

interface IdeaOutputPayload {
    ideas?: Array<{
        title?: string;
        oneLiner?: string;
        problem?: string;
        targetMarket?: string;
        marketSignal?: string;
        revenueModel?: string;
        source?: string[] | string;
    }>;
}

function hashText(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 7);
}

function normalizeSource(source: string[] | string | undefined): string[] {
    if (Array.isArray(source)) {
        return source
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (!source) return [];
    return source
        .split(/,|\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function stripThinkTags(text: string): string {
    let stripped = text.replace(/<(think|thinking|reasoning|reflection)>[\s\S]*?<\/\1>/gi, "");
    stripped = stripped.replace(/<(think|thinking|reasoning|reflection)>[\s\S]*/i, "");
    stripped = stripped.replace(/<\/(think|thinking|reasoning|reflection)>/gi, "");
    return stripped.trim();
}

function extractJsonText(text: string): string | null {
    const clean = stripThinkTags(text).trim();
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenceMatch?.[1] ?? clean;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return candidate.slice(start, end + 1);
}

function parseMarkdownIdeas(text: string, createdAt: string): Idea[] {
    const sections = stripThinkTags(text).split(/\n---\n/).filter((s) => s.includes("##"));
    const timePart = Number.isNaN(new Date(createdAt).getTime()) ? Date.now() : new Date(createdAt).getTime();
    return sections.map((section, index) => {
        const title = section.match(/##\s+💡\s*(.*)/)?.[1]?.trim() || "SaaS Idea";
        const oneLiner = section.match(/\*\*One-liner:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const problem = section.match(/\*\*Problem:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const targetMarket = section.match(/\*\*Target market:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const marketSignal = section.match(/\*\*Market signal:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const revenueModel = section.match(/\*\*Revenue model:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const sourceRaw = section.match(/\*\*Source:\*\*\s*(.*)/)?.[1]?.trim() || "";
        const seed = `${createdAt}-${index}-${title}-${problem}`;
        return {
            id: `${timePart}-${index}-${hashText(seed)}`,
            title,
            oneLiner,
            problem,
            targetMarket,
            marketSignal,
            revenueModel,
            source: normalizeSource(sourceRaw),
            createdAt,
        };
    });
}

function parseJsonIdeas(text: string, createdAt: string): Idea[] {
    const jsonText = extractJsonText(text);
    if (!jsonText) return [];

    try {
        const parsed = JSON.parse(jsonText) as IdeaOutputPayload;
        const items = Array.isArray(parsed.ideas) ? parsed.ideas : [];
        const timePart = Number.isNaN(new Date(createdAt).getTime()) ? Date.now() : new Date(createdAt).getTime();

        return items.map((item, index) => {
            const title = item.title?.trim() || `SaaS Idea ${index + 1}`;
            const problem = item.problem?.trim() || "";
            const seed = `${createdAt}-${index}-${title}-${problem}`;
            return {
                id: `${timePart}-${index}-${hashText(seed)}`,
                title,
                oneLiner: item.oneLiner?.trim() || "",
                problem,
                targetMarket: item.targetMarket?.trim() || "",
                marketSignal: item.marketSignal?.trim() || "",
                revenueModel: item.revenueModel?.trim() || "",
                source: normalizeSource(item.source),
                createdAt,
            };
        });
    } catch {
        return [];
    }
}

export function parseIdeasFromText(text: string, createdAt = new Date().toISOString()): Idea[] {
    const fromJson = parseJsonIdeas(text, createdAt).filter((idea) => idea.title && idea.problem);
    if (fromJson.length > 0) return fromJson;
    return parseMarkdownIdeas(text, createdAt).filter((idea) => idea.title && idea.problem);
}

export function parseDeepDiveFromText(text: string, ideaId: string): DeepDiveResult | null {
    const jsonText = extractJsonText(text);
    if (!jsonText) return null;

    try {
        const parsed = JSON.parse(jsonText) as {
            summary?: string;
            sections?: Array<{ key?: string; title?: string; content?: string }>;
            sources?: string[];
        };

        const sections = Array.isArray(parsed.sections)
            ? parsed.sections
                .filter((s) => s && typeof s.title === "string" && typeof s.content === "string")
                .map((s, idx) => ({
                    key: s.key?.trim() || `section-${idx + 1}`,
                    title: s.title!.trim(),
                    content: s.content!.trim(),
                }))
            : [];

        if (!parsed.summary || sections.length === 0) return null;

        return {
            ideaId,
            summary: parsed.summary.trim(),
            sections,
            sources: Array.isArray(parsed.sources)
                ? parsed.sources.map((s) => String(s).trim()).filter(Boolean)
                : [],
            generatedAt: new Date().toISOString(),
        };
    } catch {
        return null;
    }
}
