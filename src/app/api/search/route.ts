import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 60;

async function webSearch(query: string): Promise<string> {
    const serperKey = process.env.SERPER_API_KEY;

    // 1. Serper (best quality, requires API key)
    if (serperKey) {
        try {
            const res = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: query, num: 8 }),
                signal: AbortSignal.timeout(10000),
            });
            const data = await res.json();
            const results = (data.organic || [])
                .slice(0, 8)
                .map((r: { title: string; snippet: string; link: string }) =>
                    `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.link}`
                )
                .join("\n\n");
            if (results) return results;
        } catch { /* fall through */ }
    }

    // 2. Jina AI free search (no key required)
    try {
        const jinaUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
        const res = await fetch(jinaUrl, {
            headers: { Accept: "text/plain", "X-Retain-Images": "none" },
            signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
            const text = await res.text();
            return text.slice(0, 6000) || "No results found.";
        }
    } catch { /* fall through */ }

    return "Web search unavailable. Answer from your own knowledge as best as possible."
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query, settings } = body as {
            query: string;
            settings: { baseUrl: string; modelId: string; apiKey: string };
        };

        if (!settings?.apiKey) {
            return new Response(
                JSON.stringify({ error: "API key not configured. Open Settings ⚙ to add one." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const openai = createOpenAI({
            baseURL: settings.baseUrl || "https://api.openai.com/v1",
            apiKey: settings.apiKey,
        });

        const model = openai(settings.modelId || "gpt-4o-mini");

        const systemPrompt = `You are IdeaSurge, an expert SaaS idea analyst. Your job is to find real, validated, and exciting SaaS startup ideas based on user queries.

IMPORTANT: Do NOT output any <think>, <reasoning>, or internal monologue blocks. Go directly to your final answer.

For each idea you surface, structure it EXACTLY in this format (use markdown):

---
## 💡 [Idea Title]
**One-liner:** [One sentence pitch]
**Problem:** [The pain point this solves]
**Target market:** [Who would pay for this]
**Market signal:** [Evidence from web research — trends, communities, or real complaints you found]
**Revenue model:** [How it makes money]
**Source:** [URL or source name]
---

Surface 3–5 distinct, high-quality ideas. Use the webSearch tool to find real evidence. Focus on underserved niches with clear willingness to pay. Be concrete and specific — no generic ideas.`;

        const result = streamText({
            model,
            system: systemPrompt,
            prompt: `Find amazing SaaS opportunities for: "${query}"

Search the web for market signals, underserved niches, and validated demand. Look for reddit complaints, product hunt trends, twitter discussions, Y combinator ideas, and existing tools to understand gaps.`,
            tools: {
                webSearch: tool({
                    description:
                        "Search the web for SaaS trends, market signals, startup ideas, and validation data",
                    parameters: z.object({
                        query: z.string().describe("The search query to look up"),
                    }),
                    execute: async ({ query: q }) => {
                        const results = await webSearch(q);
                        return { results };
                    },
                }),
            },
            maxSteps: 5,
            temperature: 0.7,
        });

        return result.toDataStreamResponse();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
