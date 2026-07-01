import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "projects/index.html",
  "services/index.html",
  "about/index.html",
  "contact/index.html",
  "assets/site.css",
  "assets/site.js"
];

for (const file of requiredFiles) {
  await access(file);
}

const js = await readFile("assets/site.js", "utf8");
const css = await readFile("assets/site.css", "utf8");
const home = await readFile("index.html", "utf8");

const requiredSnippets = [
  ["site title", "Ayo Design Studio"],
  ["primary nav", "main-nav"],
  ["responsive styles", "@media"],
  ["mobile menu script", "menu-toggle"]
];

for (const [label, snippet] of requiredSnippets) {
  const haystack = `${js}\n${css}\n${home}`;
  if (!haystack.includes(snippet)) {
    throw new Error(`Missing ${label}: ${snippet}`);
  }
}

console.log("Site validation passed");
