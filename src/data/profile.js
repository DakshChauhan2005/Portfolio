/**
 * Personal details — the single source of truth for the terminal, the dock's
 * external links, and the document metadata.
 *
 * Nothing in this file may be placeholder text. Anything not yet known is left
 * as an empty array and the corresponding terminal command is not registered,
 * so a visitor never sees "Company A" or "your.email@example.com".
 */

export const profile = {
  name: "Daksh Chauhan",
  role: "Full-Stack Developer",
  summary:
    "Full-stack developer focused on backend systems, IoT, and problem solving. I build MERN applications, REST APIs, and AI-assisted tools, and I like the parts of engineering where the hardware and the server meet.",
};

export const contact = {
  email: "dakahchauhan111@gmail.com",
  github: "https://github.com/DakshChauhan2005",
  linkedin: "https://www.linkedin.com/in/dakshchauhan-/",
};

/**
 * Mirrors public/note.txt, which the Notes window renders verbatim.
 * Keep the two in sync when either changes.
 */
export const skills = {
  Frontend: ["HTML5", "CSS3", "JavaScript", "React.js", "TailwindCSS", "Next.js"],
  Backend: ["Node.js", "Express.js", "REST APIs", "JWT Auth"],
  Databases: ["MongoDB", "PostgreSQL", "Firebase"],
  DevOps: ["Git & GitHub", "Docker", "Netlify", "Render"],
  "IoT & Embedded": [
    "ESP32",
    "Arduino",
    "NPK Sensors",
    "pH / TDS / EC Sensors",
    "OLED Display",
  ],
  "Problem Solving": [
    "Data Structures & Algorithms",
    "Time & Space Complexity",
    "Competitive Coding Basics",
  ],
  Tools: ["VS Code", "Postman", "Linux", "Figma"],
};

/**
 * TODO(daksh): fill these in.
 *
 * Shape: { role, org, period, points: string[] }
 * While this array is empty the `experience` command is hidden from the
 * terminal rather than printing invented employers.
 */
export const experience = [];

/**
 * TODO(daksh): fill this in.
 *
 * Shape: { degree, institution, period, details: string[] }
 * Hidden from the terminal while empty, same reasoning as above.
 */
export const education = [];

/**
 * Verified achievements only — things with a repo, a certificate, or a result.
 */
export const achievements = [
  "Kalpathon Hackathon — Neighbourhood Service Marketplace with team VibeX (Track 1, PS-01), responsible for API building and testing.",
];
