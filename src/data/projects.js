/**
 * Featured projects — the single source of truth for both the Github window
 * and the terminal's `projects` / `project <n>` commands.
 *
 * Schema:
 *   id          number   stable identifier, also used by `project <n>` in the CLI
 *   title       string   display name
 *   description string   what it actually does — keep it concrete
 *   tags        string[] real stack only
 *   repoLink    string   public repo URL
 *   demoLink    string?  live deployment, or null
 *   image       string?  local screenshot under src/assets/, or null for a
 *                        generated placeholder tile. See TODO below.
 *
 * TODO(screenshots): every card currently falls back to a generated tile.
 * Drop real screenshots into src/assets/projects/ and set `image` to the
 * imported asset — stock photos are worse than no photo.
 */

export const projects = [
  {
    id: 1,
    title: "SnapSeek — Real-Time AI Chat",
    description:
      "Full-stack chat platform with live messaging over Socket.io and AI replies generated through LangChain and Google Gemini. Includes JWT authentication, transactional email, and a Redux Toolkit client.",
    tags: [
      "React",
      "Redux Toolkit",
      "Node.js",
      "Express",
      "MongoDB",
      "Socket.io",
      "LangChain",
      "Google Gemini",
      "JWT",
      "Tailwind CSS",
    ],
    repoLink: "https://github.com/DakshChauhan2005/SnapSeek",
    demoLink: null,
    image: null,
  },
  {
    id: 2,
    title: "RAG Codebase Chatbot",
    description:
      "Ask natural-language questions about any GitHub repository and get answers grounded in the real code, with file and line citations. Ingests a repo, chunks and embeds it, then retrieves relevant context per query using Mistral.",
    tags: [
      "Node.js",
      "Express",
      "LangChain",
      "Mistral AI",
      "RAG",
      "Vector Search",
    ],
    repoLink: "https://github.com/DakshChauhan2005/RAG-Based-Chatbot",
    demoLink: null,
    image: null,
  },
  {
    id: 3,
    title: "Neighbourhood Service Marketplace",
    description:
      "Kalpathon hackathon submission (Track 1, PS-01) built with team VibeX — a marketplace connecting customers to verified local service providers. My role was API building and testing. Features category and location search, a role-based booking workflow, a provider dashboard, and review-driven ratings.",
    tags: [
      "React 19",
      "Redux Toolkit",
      "React Router",
      "Tailwind CSS",
      "Node.js",
      "Hackathon",
      "Team Project",
    ],
    repoLink: "https://github.com/DakshChauhan2005/Vibex_ayushsingh",
    demoLink: "https://vibex-ayushsingh.vercel.app",
    image: null,
  },
  {
    id: 4,
    title: "Dropout Cafe — Menu Management",
    description:
      "Restaurant menu application pairing a public-facing menu with a protected admin dashboard for managing items and categories, backed by an Express and MongoDB API with JWT and bcrypt authentication.",
    tags: [
      "React",
      "Vite",
      "React Router",
      "Node.js",
      "Express",
      "MongoDB",
      "JWT",
      "bcrypt",
    ],
    repoLink: "https://github.com/DakshChauhan2005/dropout-cafe",
    demoLink: "https://dropout-cafe.vercel.app",
    image: null,
  },
  {
    id: 5,
    title: "Full-Stack Authentication System",
    description:
      "Production-shaped auth stack built from scratch: registration, login, hashed credentials, JWT sessions over cookies, server-side request validation, and email delivery for verification and recovery. Split across an Express 5 API and a separate React client (see the Auth-client repo).",
    tags: [
      "React 19",
      "Tailwind CSS",
      "Node.js",
      "Express 5",
      "MongoDB",
      "JWT",
      "bcrypt",
      "Nodemailer",
    ],
    repoLink: "https://github.com/DakshChauhan2005/Auth-server",
    demoLink: null,
    image: null,
  },
  {
    id: 6,
    title: "Fetch-n-Send — Agentic CLI Workflow",
    description:
      "Terminal AI agent on LangChain and Mistral that picks its own tools inside a persistent chat loop — Tavily for live web search, Nodemailer for sending Gmail — and decides per message whether to answer directly or call one.",
    tags: [
      "Node.js",
      "LangChain",
      "Mistral AI",
      "Tavily",
      "Nodemailer",
      "AI Agents",
      "CLI",
    ],
    repoLink: "https://github.com/DakshChauhan2005/Fetch-n-Send--Agentic-Workflow",
    demoLink: null,
    image: null,
  },
];

export default projects;
