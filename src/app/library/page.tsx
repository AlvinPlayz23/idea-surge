import { prisma } from "@/lib/prisma";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
    let pickedIdeas: any[] = [];

    try {
        pickedIdeas = await prisma.ideaRecord.findMany({
            where: { status: "PICKED" },
            orderBy: [{ pickedAt: "desc" }, { createdAt: "desc" }],
        });
    } catch {
        // Safe fallback if database is down/paused
    }

    return <LibraryClient initialIdeas={pickedIdeas} />;
}
