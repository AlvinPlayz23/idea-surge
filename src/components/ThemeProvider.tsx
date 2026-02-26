"use client";

import { useEffect } from "react";
import { getSettings } from "@/lib/settings";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const applyTheme = () => {
            const settings = getSettings();
            document.documentElement.setAttribute("data-theme", settings.theme);
        };

        applyTheme();

        // Listen for storage changes in other tabs
        window.addEventListener("storage", (e) => {
            if (e.key === "ideasurge_settings") {
                applyTheme();
            }
        });

        // We can also use a custom event for local changes if needed
        window.addEventListener("theme-change", applyTheme);

        return () => {
            window.removeEventListener("storage", applyTheme);
            window.removeEventListener("theme-change", applyTheme);
        };
    }, []);

    return <>{children}</>;
}
