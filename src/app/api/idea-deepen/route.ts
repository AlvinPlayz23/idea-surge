import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 60;

// Call Exa MCP via JSON-RPC POST
async function callExaMcp(
    toolName: string,
    args: Record<string, unknown>,
    exaApiKey: string | undefined,
): Promise<string> {
    const url = exaApiKey
        ? `https://mcp.exa.ai/mcp?tools=web_search_exa,crawling_exa&exaApiKey=${exaApiKey}`
        : "https://mcp.exa.ai/mcp?tools=web_search_exa,crawling_exa";

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: toolName, arguments: args },
        }),
        signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Exa MCP error (${res.status}): ${text}`);
    }

    const responseText = await res.text();

    for (const line of responseText.split("\n")) {
        if (line.startsWith("data: ")) {
            try {
                const data = JSON.parse(line.slice(6));
                const text = data?.result?.content?.[0]?.text;
                if (text) return text;
            } catch { /* continue */ }
        }
    }

    try {
        const data = JSON.parse(responseText);
        const text = data?.result?.content?.[0]?.text;
        if (text) return text;
    } catch { /* ignore */ }

    return "No results returned.";
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
            settings: { baseUrl: string; modelId: string; apiKey: string; exaApiKey?: string };
        };

        const exaKey = settings?.exaApiKey?.trim() || process.env.EXA_API_KEY;

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
- Use web_search_exa, then crawling_exa for at least 2 high-signal sources.
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
                web_search_exa: tool({
                    description: "Search for high-signal validation data, competitors, user pain points, and trends",
                    parameters: z.object({
                        query: z.string().describe("Search query"),
                        numResults: z.number().optional(),
                        livecrawl: z.enum(["fallback", "preferred"]).optional(),
                    }),
                    execute: async ({ query, numResults = 8, livecrawl = "fallback" }: { query: string; numResults?: number; livecrawl?: "fallback" | "preferred" }) => {
                        const results = await callExaMcp(
                            "web_search_exa",
                            { query, numResults, livecrawl, type: "auto" },
                            exaKey
                        );
                        return { results };
                    },
                } as any),
                crawling_exa: tool({
                    description: "Read a URL deeply for concrete evidence, pricing data, or competitor analysis",
                    parameters: z.object({
                        url: z.string().describe("URL to read"),
                    }),
                    execute: async ({ url }: { url: string }) => {
                        const content = await callExaMcp("crawling_exa", { url }, exaKey);
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
