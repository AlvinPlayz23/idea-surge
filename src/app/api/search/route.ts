import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 60;

// Call Exa MCP via JSON-RPC POST — no persistent SSE client needed.
async function callExaMcp(
    toolName: string,
    args: Record<string, unknown>,
    exaApiKey: string | undefined,
): Promise<string> {
    const url = exaApiKey
        ? `https://mcp.exa.ai/mcp?tools=web_search_exa,crawling_exa&exaApiKey=${exaApiKey}`
        : "https://mcp.exa.ai/mcp?tools=web_search_exa,crawling_exa";

    const body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: toolName, arguments: args },
    });

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
        },
        body,
        signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Exa MCP error (${res.status}): ${text}`);
    }

    const responseText = await res.text();

    // Response comes as SSE — parse "data: {...}" lines
    for (const line of responseText.split("\n")) {
        if (line.startsWith("data: ")) {
            try {
                const data = JSON.parse(line.slice(6));
                const text = data?.result?.content?.[0]?.text;
                if (text) return text;
            } catch { /* continue */ }
        }
    }

    // Fallback: try parsing as plain JSON
    try {
        const data = JSON.parse(responseText);
        const text = data?.result?.content?.[0]?.text;
        if (text) return text;
    } catch { /* ignore */ }

    return "No results returned.";
}

export async function POST(req: Request) {
    const body = await req.json();
    const { query, settings } = body as {
        query: string;
        settings: { baseUrl: string; modelId: string; apiKey: string; exaApiKey?: string };
    };

    if (!settings?.apiKey) {
        return new Response(
            JSON.stringify({ error: "LLM API key not configured. Open Settings ⚙ to add one." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const exaKey = settings.exaApiKey?.trim() || process.env.EXA_API_KEY;

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
      "source": ["string", "string"],
      "category": "string"
    }
  ]
}

Quality bar:
- Produce 3 to 5 distinct ideas.
- Use web_search_exa first to discover signals, then use crawling_exa on at least 2 promising URLs for deeper insights.
- Make marketSignal evidence-specific (communities, trends, stats, recurring complaints).
- Include 1 to 3 source URLs or source identifiers per idea.
- category must be short (1-3 words) and meaningful (e.g., "Developer Tools", "Healthcare Ops", "Creator Economy").
- Keep each field concise and concrete.`;

    try {
        const result = streamText({
            model,
            system: systemPrompt,
            prompt: `Find amazing SaaS opportunities for: "${query}"`,
            tools: {
                web_search_exa: tool({
                    description: "Search the web for broad SaaS signals, trends, market gaps, and source URLs",
                    parameters: z.object({
                        query: z.string().describe("The search query"),
                        numResults: z.number().optional().describe("Number of results (default: 8)"),
                        livecrawl: z.enum(["fallback", "preferred"]).optional(),
                    }),
                    execute: async ({ query: q, numResults = 8, livecrawl = "fallback" }: { query: string; numResults?: number; livecrawl?: "fallback" | "preferred" }) => {
                        const results = await callExaMcp(
                            "web_search_exa",
                            { query: q, numResults, livecrawl, type: "auto" },
                            exaKey
                        );
                        return { results };
                    },
                } as any),
                crawling_exa: tool({
                    description: "Read the full content of a specific URL to extract deep insights",
                    parameters: z.object({
                        url: z.string().describe("The full URL to crawl and read"),
                    }),
                    execute: async ({ url }: { url: string }) => {
                        const content = await callExaMcp(
                            "crawling_exa",
                            { url },
                            exaKey
                        );
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
