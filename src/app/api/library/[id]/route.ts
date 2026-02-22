import { prisma } from "@/lib/prisma";
import { ideaRecordToIdea } from "@/lib/ideaRecord";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const record = await prisma.ideaRecord.findUnique({ where: { id } });
        if (!record) {
            return new Response(JSON.stringify({ error: "Idea not found." }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ idea: ideaRecordToIdea(record) }), {
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
