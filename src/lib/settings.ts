export interface AppSettings {
    provider: string;
    baseUrl: string;
    modelId: string;
    apiKey: string;
    exaApiKey: string; // optional — Exa MCP works without a key (free tier)
    theme: string;
}

const STORAGE_KEY = "ideasurge_settings";

export const DEFAULT_SETTINGS: AppSettings = {
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelId: "gpt-4o-mini",
    apiKey: "",
    exaApiKey: "",
    theme: "liquid-obsidian",
};

export function getSettings(): AppSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw);
        // Drop legacy tavilyApiKey if present
        const { tavilyApiKey: _tavily, ...rest } = parsed;
        return { ...DEFAULT_SETTINGS, ...rest };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: AppSettings): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
