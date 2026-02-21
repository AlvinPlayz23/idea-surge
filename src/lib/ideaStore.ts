import { DeepDiveResult, Idea, IdeaStoreState } from "@/lib/types";

const STORE_KEY = "ideasurge_idea_store";
const STORE_VERSION = 1;

const EMPTY_STATE: IdeaStoreState = {
    version: 1,
    ideas: [],
    deepDives: {},
};

function isIdea(value: unknown): value is Idea {
    const idea = value as Idea;
    return Boolean(
        idea &&
        typeof idea.id === "string" &&
        typeof idea.title === "string" &&
        typeof idea.oneLiner === "string" &&
        typeof idea.problem === "string" &&
        typeof idea.targetMarket === "string" &&
        typeof idea.marketSignal === "string" &&
        typeof idea.revenueModel === "string" &&
        Array.isArray(idea.source) &&
        typeof idea.createdAt === "string"
    );
}

function isDeepDive(value: unknown): value is DeepDiveResult {
    const item = value as DeepDiveResult;
    return Boolean(
        item &&
        typeof item.ideaId === "string" &&
        typeof item.summary === "string" &&
        Array.isArray(item.sections) &&
        Array.isArray(item.sources) &&
        typeof item.generatedAt === "string"
    );
}

function sanitize(raw: unknown): IdeaStoreState {
    if (!raw || typeof raw !== "object") return EMPTY_STATE;
    const input = raw as Partial<IdeaStoreState>;

    const ideas = Array.isArray(input.ideas) ? input.ideas.filter(isIdea) : [];
    const deepDives: Record<string, DeepDiveResult[]> = {};

    if (input.deepDives && typeof input.deepDives === "object") {
        for (const [key, value] of Object.entries(input.deepDives)) {
            if (Array.isArray(value)) {
                deepDives[key] = value.filter(isDeepDive);
            }
        }
    }

    return {
        version: STORE_VERSION,
        ideas,
        deepDives,
    };
}

export function loadIdeaStore(): IdeaStoreState {
    if (typeof window === "undefined") return EMPTY_STATE;
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return EMPTY_STATE;
        return sanitize(JSON.parse(raw));
    } catch {
        return EMPTY_STATE;
    }
}

export function saveIdeaStore(state: IdeaStoreState): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORE_KEY, JSON.stringify(sanitize(state)));
}

export function saveIdeas(ideas: Idea[]): void {
    const current = loadIdeaStore();
    saveIdeaStore({
        ...current,
        ideas,
    });
}

export function getIdeas(): Idea[] {
    return loadIdeaStore().ideas;
}

export function getIdeaById(ideaId: string): Idea | null {
    return loadIdeaStore().ideas.find((idea) => idea.id === ideaId) ?? null;
}

export function addDeepDive(ideaId: string, deepDive: DeepDiveResult): void {
    const current = loadIdeaStore();
    const existing = current.deepDives[ideaId] ?? [];
    saveIdeaStore({
        ...current,
        deepDives: {
            ...current.deepDives,
            [ideaId]: [deepDive, ...existing],
        },
    });
}

export function getDeepDivesByIdeaId(ideaId: string): DeepDiveResult[] {
    return loadIdeaStore().deepDives[ideaId] ?? [];
}
