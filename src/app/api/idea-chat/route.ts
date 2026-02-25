import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 60;

const requestSchema = z.object({
    idea: z.object({
        id: z.string(),
        title: z.string(),
        oneLiner: z.string(),
        problem: z.string(),
        targetMarket: z.string(),
        marketSignal: z.string(),
        revenueModel: z.string(),
        source: z.array(z.string()),
    }),
    deepDive: z
        .object({
            summary: z.string(),
            sections: z.array(
                z.object({
                    title: z.string(),
                    content: z.string(),
                })
            ),
            sources: z.array(z.string()),
        })
        .nullable(),
    messages: z.array(
        z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1),
        })
    ),
    settings: z.object({
        baseUrl: z.string(),
        modelId: z.string(),
        apiKey: z.string(),
    }),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = requestSchema.safeParse(body);

        if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid chat payload." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { idea, deepDive, messages, settings } = parsed.data;

        if (!settings.apiKey) {
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

        const deepDiveContext = deepDive
            ? `
Deep-dive summary: ${deepDive.summary}
Deep-dive sections:
${deepDive.sections.map((s) => `- ${s.title}: ${s.content}`).join("\n")}
Deep-dive sources: ${deepDive.sources.join(", ")}`
            : "No deep-dive context available yet.";

        const system = `You are IdeaSurge Brainstorm Assistant.
You help users refine one SaaS idea with practical, detailed, execution-oriented advice.

Rules:
- Be concise, clear, and directly useful.
- Use bullets when listing steps.
- If user asks for plans, provide phased actions.
- Ask one clarifying follow-up question only when necessary.
- Do not include hidden reasoning tags.`;

        const contextMessage = `Current idea context:
Title: ${idea.title}
One-liner: ${idea.oneLiner}
Problem: ${idea.problem}
Target market: ${idea.targetMarket}
Market signal: ${idea.marketSignal}
Revenue model: ${idea.revenueModel}
Idea sources: ${idea.source.join(", ")}
${deepDiveContext}`;

        const mergedMessages = [
            { role: "user" as const, content: contextMessage },
            ...messages,
        ];

        const result = await generateText({
            model,
            system,
            messages: mergedMessages,
            temperature: 0.6,
            maxTokens: 3000,
        } as any);

        return new Response(JSON.stringify({ reply: result.text }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
