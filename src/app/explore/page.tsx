import { prisma } from "@/lib/prisma";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
    // Attempt DB fetch, fallback to empty array if PRISMA/NEON is down (e.g. paused)
    let recycledIdeas: any[] = [];
    try {
        recycledIdeas = await prisma.ideaRecord.findMany({
            where: { status: "RECYCLED" },
            orderBy: [{ recycledAt: "desc" }, { createdAt: "desc" }],
        });
    } catch {
        // Safe fallback
    }

    return <ExploreClient initialIdeas={recycledIdeas} />;
}
