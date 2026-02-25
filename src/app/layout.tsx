import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "IdeaSurge — AI SaaS Idea Finder",
    description:
        "Discover breakthrough SaaS opportunities using AI-powered web research. Find your next big idea.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
