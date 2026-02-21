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
            return (results + answer).slice(0, 10000) || "No results found.";
        }
    } catch { /* fall through */ }
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
            return `⚠️ Page blocked or inaccessible: ${url}\n\nTavily could not extract meaningful content. The page may require authentication or block scrapers.`;
        }
        const errData = await res.json().catch(() => ({}));
        return `⚠️ Extraction failed (${res.status}): ${errData?.message || "Unknown error"}\nURL: ${url}`;
    } catch (e: any) {
        return `⚠️ Network error reading page: ${e?.message || "timeout"}\nURL: ${url}`;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query, settings } = body as {
            query: string;
            settings: { baseUrl: string; modelId: string; apiKey: string; tavilyApiKey: string };
        };

        const tavilyKey = settings.tavilyApiKey || process.env.TAVILY_API_KEY;

        if (!settings?.apiKey) {
            return new Response(
                JSON.stringify({ error: "LLM API key not configured. Open Settings ⚙ to add one." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!tavilyKey) {
            return new Response(
                JSON.stringify({ error: "Tavily API key not configured. Open Settings ⚙ to add one for research." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const openai = createOpenAI({
            baseURL: settings.baseUrl || "https://api.openai.com/v1",
            apiKey: settings.apiKey,
        });

        const model = openai(settings.modelId || "gpt-4o-mini");

        const systemPrompt = `You are IdeaSurge, a silent SaaS research engine.
Use tools for research, then output strict JSON only.

Rules:
- No narration, no markdown, no code fences.
- Never include think/reasoning tags.
- Return one JSON object with this exact shape:
{
  "ideas": [
    {
      "title": "string",
      "oneLiner": "string",
      "problem": "string",
      "targetMarket": "string",
      "marketSignal": "string",
      "revenueModel": "string",
      "source": ["string", "string"]
    }
  ]
}

Quality bar:
- Produce 3 to 5 distinct ideas.
- Use webSearch first, then readPage on at least 2 promising URLs.
- Make marketSignal evidence-specific (communities, trends, stats, recurring complaints).
- Include 1 to 3 source URLs or source identifiers per idea.
- Keep each field concise and concrete.`;

        const result = streamText({
            model,
            system: systemPrompt,
            prompt: `Find amazing SaaS opportunities for: "${query}"`,
            tools: {
                webSearch: tool({
                    description: "Search the web for broad SaaS signals, trends, and source URLs",
                    parameters: z.object({
                        query: z.string().describe("The search query to look up"),
                    }),
                    execute: async ({ query: q }: { query: string }) => {
                        const results = await webSearch(q, tavilyKey);
                        return { results };
                    },
                } as any),
                readPage: tool({
                    description: "Read the full content of a specific URL to extract deep insights (Reddit, Blogs, etc)",
                    parameters: z.object({
                        url: z.string().describe("The full URL to read"),
                    }),
                    execute: async ({ url }: { url: string }) => {
                        const content = await readPage(url, tavilyKey);
                        return { content };
                    },
                } as any),
            } as any,
            maxSteps: 15,
            temperature: 0.7,
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

