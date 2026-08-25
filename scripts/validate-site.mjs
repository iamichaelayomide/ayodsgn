import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "projects/index.html",
  "services/index.html",
  "about/index.html",
  "contact/index.html",
  "assets/site.css",
  "assets/case-study.css",
  "assets/site.js",
  "assets/og/ayodsgn-social-preview-v1.jpg"
];

for (const file of requiredFiles) {
  await access(file);
}

const js = await readFile("assets/site.js", "utf8");
const css = await readFile("assets/site.css", "utf8");
const caseStudyCss = await readFile("assets/case-study.css", "utf8");
const home = await readFile("index.html", "utf8");

const requiredSnippets = [
  ["site title", "Ayo Design Studio"],
  ["primary nav", "main-nav"],
  ["responsive styles", "@media"],
  ["mobile menu script", "menu-toggle"],
  ["blue-surface foreground token", "--on-blue: #ffffff"],
  ["future blue-surface contract", "[data-surface=\"blue\"]"],
  ["case-study blue CTA contrast", "color: var(--on-blue, #fff)"],
  ["default Open Graph preview", "https://ayodsgn.com/assets/og/ayodsgn-social-preview-v1.jpg"],
  ["large Twitter preview", "twitter:card\" content=\"summary_large_image"]
];

for (const [label, snippet] of requiredSnippets) {
  const haystack = `${js}\n${css}\n${caseStudyCss}\n${home}`;
  if (!haystack.includes(snippet)) {
    throw new Error(`Missing ${label}: ${snippet}`);
  }
}

console.log("Site validation passed");
