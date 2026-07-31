export const siteConfig = {
  name: "Eric Li",
  title: "Software Engineer / Computer Science & Statistics",
  intro:
    "BSc Computer Science (Specialist) and Statistics (Major) at the University of Toronto, with experience in data engineering, full-stack development, and AI-powered application tooling.",
  email: "ericqi.li@mail.utoronto.ca",
  phone: "778-929-1402",
  links: {
    github: "https://github.com/ericli",
    linkedin: "https://linkedin.com/in/ericli",
    resume: "/resume.pdf",
  },
};

export const educationContent = {
  school: "University of Toronto",
  degree: "BSc, Computer Science (Specialist), Statistics (Major)",
  period: "Sep 2021 – Jun 2026",
  location: "Toronto, ON",
  coursework: ["Operating Systems", "Databases", "AI", "NLP"],
};

export const aboutContent = {
  paragraph:
    "I'm a Computer Science and Statistics student at the University of Toronto with hands-on experience building production data pipelines, backend services, and NLP systems. At Royal Bank of Canada, I worked as a Data Engineer on CDC pipelines, transit hierarchy tooling, and incident report classification. At Deutsche Telekom, I built office automation workflows with Java and integrated workflow engine APIs. I've also built full-stack projects including an AI-powered job application platform and personal portfolio.",
};

export const experiences = [
  {
    company: "Royal Bank of Canada",
    role: "Data Engineer",
    period: "May 2024 – April 2025",
    location: "Toronto, ON",
    highlights: [
      "Designed and implemented a Python (Pandas) CDC pipeline to clean and transform large datasets, generate surrogate keys, and keep records in near–real-time sync across multiple sources, separating new, updated, and closed units for downstream systems.",
      "Re-engineered the transit hierarchy used for risk assessment by matching transits across legal entity, location, and financial metrics with Python/Pandas, and built a React validation app with backend services to manage hierarchy changes and improve data quality.",
      "Built an end-to-end NLP pipeline in spaCy to convert free-text incident reports into structured fields, labeled a historical dataset, and trained a supervised text-classification model to auto-tag event type, business line, and root cause, improving searchability and reuse of past risk events.",
    ],
  },
  {
    company: "Deutsche Telekom",
    role: "Software Engineer",
    period: "May 2023 – August 2023",
    location: "Beijing, China",
    highlights: [
      "Built an office automation web application using the Cumulocity workflow engine, implementing Java backend services, CRUD operations, and workflow APIs.",
    ],
  },
];

export const projects = [
  {
    title: "AI Job Application Platform & Personal Portfolio",
    period: "May 2026 – Present",
    description:
      "Built a full-stack AI-powered job application platform and personal portfolio using Next.js, TypeScript, Supabase, and PostgreSQL, with a job tracker, OpenAI-powered job description analysis, tailored cover letter generation, and resume recommendations, deployed on Vercel.",
    tags: [
      "Next.js",
      "TypeScript",
      "Supabase",
      "PostgreSQL",
      "OpenAI API",
      "Vercel",
    ],
    github: "https://github.com/ericli",
    demo: "https://ericqli.ca",
    gradient: "from-cyan-500/60 via-blue-600/40 to-indigo-600/30",
  },
  {
    title: "Scriptorium Code Template Manager",
    period: "Jan 2026 – April 2026",
    description:
      "Built a multi-language code template platform using Next.js and Node.js, with backend APIs powered by Prisma, PostgreSQL, JWT authentication, and Docker, plus OpenAI integration for AI-assisted debugging, error explanation, and code correction.",
    tags: [
      "Next.js",
      "Node.js",
      "TypeScript",
      "JavaScript",
      "Prisma",
      "PostgreSQL",
    ],
    github: "https://github.com/ericli/scriptorium",
    demo: "https://scriptorium-demo.vercel.app",
    gradient: "from-indigo-500/60 via-blue-600/40 to-violet-600/30",
  },
  {
    title: "University Community Application",
    period: "Oct 2024 – Dec 2024",
    description:
      "Built a Java Swing university community application featuring social, club, trading, food, lost-and-found, and restaurant recommendation modules.",
    tags: ["Java"],
    github: "https://github.com/ericli/university-community",
    demo: "https://github.com/ericli/university-community",
    gradient: "from-violet-500/60 via-purple-600/40 to-fuchsia-600/30",
  },
];

export const skillGroups = [
  {
    category: "Languages",
    skills: ["Python", "Java", "C/C++", "JavaScript/TypeScript", "SQL"],
  },
  {
    category: "Frameworks",
    skills: ["React", "Node.js", "Express", "Django/Flask"],
  },
  {
    category: "Tools",
    skills: ["Git", "Docker", "Linux", "VS Code", "IntelliJ"],
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];
