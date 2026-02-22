import { IdeaRecord } from "@prisma/client";
import { Idea } from "@/lib/types";

export function ideaRecordToIdea(record: IdeaRecord): Idea {
    const source = Array.isArray(record.source)
        ? record.source.map((s) => String(s))
        : [];

    return {
        id: record.id,
        title: record.title,
        oneLiner: record.oneLiner,
        problem: record.problem,
        targetMarket: record.targetMarket,
        marketSignal: record.marketSignal,
        revenueModel: record.revenueModel,
        source,
        category: record.category,
        createdAt: record.createdAt.toISOString(),
    };
}
