export interface Idea {
    id: string;
    title: string;
    oneLiner: string;
    problem: string;
    targetMarket: string;
    marketSignal: string;
    revenueModel: string;
    source: string[];
    createdAt: string;
}

export type DeepDiveFocus = "market" | "mvp" | "risks" | "pricing" | "custom";

export interface DeepDiveRequest {
    ideaId: string;
    mode: "preset" | "custom";
    focus: DeepDiveFocus;
    prompt?: string;
}

export interface DeepDiveSection {
    key: string;
    title: string;
    content: string;
}

export interface DeepDiveResult {
    ideaId: string;
    summary: string;
    sections: DeepDiveSection[];
    sources: string[];
    generatedAt: string;
}

export interface IdeaStoreState {
    version: 1;
    ideas: Idea[];
    deepDives: Record<string, DeepDiveResult[]>;
}
