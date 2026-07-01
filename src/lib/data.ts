export const siteConfig = {
  name: "Eric Li",
  title: "Software Engineer / Computer Science & Statistics",
  intro:
    "BSc Computer Science (Specialist) and Statistics (Major) at the University of Toronto, with experience in data engineering, backend development, and NLP-powered systems.",
  email: "ericqi.li@mail.utoronto.ca",
  phone: "778-929-1402",
  links: {
    github: "https://github.com/ericli",
    linkedin: "https://linkedin.com/in/ericli",
    resume: "/resume.pdf",
  },
};

export const aboutContent = {
  paragraph:
    "I'm a Computer Science and Statistics student at the University of Toronto with hands-on experience building production data pipelines, backend services, and NLP systems. At RBC, I worked as a Data Engineer on CDC pipelines, transit hierarchy tooling, and incident report classification. At Deutsche Telekom, I built office automation workflows with Java and integrated workflow engine APIs. I'm passionate about turning messy, real-world data into reliable software.",
};

export const experiences = [
  {
    company: "Royal Bank of Canada",
    role: "Data Engineer",
    period: "May 2024 – April 2025",
    location: "Toronto, ON",
    highlights: [
      "Designed and implemented a Python (Pandas) CDC pipeline to clean and transform large datasets, generate surrogate keys, and keep records in near–real-time sync across multiple sources.",
      "Re-engineered the transit hierarchy used for risk assessment with Python/Pandas, and built a React validation app with backend services to manage hierarchy changes.",
      "Built an end-to-end NLP pipeline in spaCy to convert free-text incident reports into structured fields, training a supervised model to auto-tag event type, business line, and root cause.",
    ],
  },
  {
    company: "Deutsche Telekom",
    role: "Software Engineer",
    period: "May 2023 – August 2023",
    location: "Beijing, China",
    highlights: [
      "Built an office automation web application on the Cumulocity workflow engine, designing flowchart-based employee management workflows and department-specific UIs.",
      "Implemented the Java backend with full CRUD database operations and integrated workflow engine APIs for seamless data exchange and system reliability.",
    ],
  },
];

export const projects = [
  {
    title: "Scriptorium Code Template Manager",
    description:
      "Web app for creating, executing, and sharing code templates in multiple languages, with role-based permissions and JWT authentication.",
    tags: ["Next.js", "Node.js", "TypeScript", "Prisma", "PostgreSQL", "Docker"],
    github: "https://github.com/ericli/scriptorium",
    demo: "https://scriptorium-demo.vercel.app",
    gradient: "from-indigo-500/60 via-blue-600/40 to-violet-600/30",
  },
  {
    title: "University Community Application",
    description:
      "Multifaceted Java Swing application for a university community with social, club, food, trading, and lost-and-found features, including a restaurant recommendation module with average prices and ratings.",
    tags: ["Java", "Swing", "OOP", "UI/UX"],
    github: "https://github.com/ericli/university-community",
    demo: "https://github.com/ericli/university-community",
    gradient: "from-violet-500/60 via-purple-600/40 to-fuchsia-600/30",
  },
];

export const skillGroups = [
  {
    category: "Languages",
    skills: ["Python", "Java", "C/C++", "TypeScript", "JavaScript", "SQL"],
  },
  {
    category: "Frameworks",
    skills: ["React", "Next.js", "Node.js", "Express", "Django", "Flask"],
  },
  {
    category: "Data & AI",
    skills: ["Pandas", "spaCy", "NLP", "Prisma", "PostgreSQL"],
  },
  {
    category: "Tools",
    skills: ["Git", "Docker", "Linux", "VS Code", "IntelliJ", "Vercel"],
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];
