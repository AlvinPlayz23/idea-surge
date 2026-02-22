import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeIdeaFingerprint } from "@/lib/ideaFingerprint";
import { Idea } from "@/lib/types";

const ideaSchema = z.object({
    id: z.string(),
    title: z.string(),
    oneLiner: z.string(),
    problem: z.string(),
    targetMarket: z.string(),
    marketSignal: z.string(),
    revenueModel: z.string(),
    source: z.array(z.string()),
    category: z.string().optional(),
    createdAt: z.string(),
});

const bodySchema = z.object({
    ideas: z.array(ideaSchema),
});

export async function POST(req: Request) {
    try {
        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid payload." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const ideas = parsed.data.ideas as Idea[];
        for (const idea of ideas) {
            const fingerprint = computeIdeaFingerprint(idea);
            const existing = await prisma.ideaRecord.findUnique({ where: { fingerprint } });
            if (existing?.status === "PICKED") {
                continue;
            }

            await prisma.ideaRecord.upsert({
                where: { fingerprint },
                create: {
                    fingerprint,
                    title: idea.title,
                    oneLiner: idea.oneLiner,
                    problem: idea.problem,
                    targetMarket: idea.targetMarket,
                    marketSignal: idea.marketSignal,
                    revenueModel: idea.revenueModel,
                    source: idea.source,
                    category: idea.category?.trim() || "Uncategorized",
                    status: "RECYCLED",
                    recycledAt: new Date(),
                },
                update: {
                    title: idea.title,
                    oneLiner: idea.oneLiner,
                    problem: idea.problem,
                    targetMarket: idea.targetMarket,
                    marketSignal: idea.marketSignal,
                    revenueModel: idea.revenueModel,
                    source: idea.source,
                    category: idea.category?.trim() || "Uncategorized",
                    status: "RECYCLED",
                    recycledAt: new Date(),
                },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
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
