# IdeaSurge — AI SaaS Discovery Engine

**IdeaSurge** is a production-grade SaaS idea discoverer that leverages real-time web research to find underserved niches, market signals, and validated opportunities.

![IdeaSurge UI](C:\Users\bijim\.gemini\antigravity\brain\002749f9-e9c9-4f43-9c57-2e243f335e5a\ideasurge_ui_verify_01.png)

## ✨ Features

- **Deep Research Engine**: Powered by **Tavily AI**. Unlike generic search, it uses advanced AI-optimized search depths and full-page extraction to verify market signals before generating ideas.
- **Inspect the Source**: Click on any research badge in the UI to open a **Raw Data Inspector**. Verify exactly what the AI read on Reddit, Product Hunt, or niche blogs.
- **BYO-LLM & Search Key**: Configure your LLM and Tavily API Key directly via the UI settings.
- **Privacy First**: All configurations are stored locally in your browser's `localStorage`.
- **Streaming Results**: Rich idea cards are streamed in real-time as the AI synthesizes findings.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Configuration

1. Open [http://localhost:3000](http://localhost:3000)
2. Click the **Settings** (gear icon) in the top right.
3. Provide your LLM and Search details:
   - **Base URL**: e.g., `https://api.openai.com/v1` or your local proxy.
   - **Model ID**: e.g., `gpt-4o`, `deepseek-chat`, etc.
   - **LLM API Key**: Your provider's secret key.
   - **Tavily API Key**: Required for the research step. Get one at [tavily.com](https://tavily.com).

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI Integration**: [AI SDK](https://sdk.vercel.ai/)
- **Search Tooling**: [Tavily AI](https://tavily.com/) (Search & Extract API)
- **Styling**: Tailwind CSS & CSS Variables

## 📜 License

MIT
