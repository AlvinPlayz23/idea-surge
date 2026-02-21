import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 60;

async function webSearch(query: string, apiKey: string): Promise<string> {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: "advanced",
                include_answer: "basic",
            }),
            signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
            const data = await res.json();
            const results = (data.results || [])
                .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
                .join("\n\n");
            const answer = data.answer ? `\n\nSummary Answer: ${data.answer}` : "";
            return (results + answer).slice(0, 12000) || "No results found.";
        }
    } catch {
        // fallthrough
    }
    return "Search unavailable.";
}

async function readPage(url: string, apiKey: string): Promise<string> {
    try {
        const res = await fetch("https://api.tavily.com/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                urls: [url],
                extract_depth: "advanced",
            }),
            signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
            const data = await res.json();
            const content = data.results?.[0]?.content;
            if (content && content.length > 80) return content.slice(0, 15000);
            return `Page blocked or inaccessible: ${url}`;
        }
    } catch {
        // fallthrough
    }
    return `Extraction unavailable for URL: ${url}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { idea, request: deepDiveRequest, settings } = body as {
            idea: {
                id: string;
                title: string;
                oneLiner: string;
                problem: string;
                targetMarket: string;
                marketSignal: string;
                revenueModel: string;
                source: string[];
            };
            request: {
                ideaId: string;
                mode: "preset" | "custom";
                focus: "market" | "mvp" | "risks" | "pricing" | "custom";
                prompt?: string;
            };
            settings: { baseUrl: string; modelId: string; apiKey: string; tavilyApiKey: string };
        };

        const tavilyKey = settings?.tavilyApiKey || process.env.TAVILY_API_KEY;

        if (!idea?.id || !deepDiveRequest?.ideaId) {
            return new Response(JSON.stringify({ error: "Invalid request payload." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!settings?.apiKey) {
            return new Response(JSON.stringify({ error: "LLM API key not configured." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!tavilyKey) {
            return new Response(JSON.stringify({ error: "Tavily API key not configured." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const openai = createOpenAI({
            baseURL: settings.baseUrl || "https://api.openai.com/v1",
            apiKey: settings.apiKey,
        });

        const model = openai(settings.modelId || "gpt-4o-mini");
        const focusInstruction =
            deepDiveRequest.mode === "custom" && deepDiveRequest.prompt
                ? `Prioritize this user request: ${deepDiveRequest.prompt}`
                : `Prioritize this focus area: ${deepDiveRequest.focus}`;

        const systemPrompt = `You are IdeaSurge DeepDive. Research deeply using tools, then output strict JSON only.
Never output markdown or code fences.

Return exactly:
{
  "summary": "string",
  "sections": [
    { "key": "mvp", "title": "MVP & execution", "content": "string" },
    { "key": "market", "title": "Market validation", "content": "string" },
    { "key": "risks", "title": "Risks & mitigations", "content": "string" },
    { "key": "pricing", "title": "Pricing & packaging", "content": "string" }
  ],
  "sources": ["string", "string"]
}

Rules:
- Use webSearch, then readPage for at least 2 high-signal sources.
- Be concrete and implementation-ready.
- Tailor depth to the requested focus.
- sources should include 3 to 8 URLs/source identifiers.`;

        const result = streamText({
            model,
            system: systemPrompt,
            prompt: `Deepen this SaaS idea:
Title: ${idea.title}
One-liner: ${idea.oneLiner}
Problem: ${idea.problem}
Target market: ${idea.targetMarket}
Market signal: ${idea.marketSignal}
Revenue model: ${idea.revenueModel}
Known sources: ${(idea.source || []).join(", ")}

${focusInstruction}`,
            tools: {
                webSearch: tool({
                    description: "Search for high-signal validation data, competitors, user pain, and trends",
                    parameters: z.object({
                        query: z.string().describe("Search query"),
                    }),
                    execute: async ({ query }: { query: string }) => {
                        const results = await webSearch(query, tavilyKey);
                        return { results };
                    },
                } as any),
                readPage: tool({
                    description: "Read a URL deeply for concrete evidence",
                    parameters: z.object({
                        url: z.string().describe("URL to inspect"),
                    }),
                    execute: async ({ url }: { url: string }) => {
                        const content = await readPage(url, tavilyKey);
                        return { content };
                    },
                } as any),
            } as any,
            maxSteps: 15,
            temperature: 0.5,
        } as any);

        return (result as any).toDataStreamResponse();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
