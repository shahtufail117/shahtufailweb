/* ============================================================
   build-articles.js — generate blog/article-*.html from markdown
   Sources:   articles/*.txt  (front-matter + HTML body)
   Template:  templates/article-template.html
   Output:    blog/article-*.html
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, "templates", "article-template.html");
const ARTICLES_DIR = path.join(ROOT, "articles");
const OUTPUT_DIR = path.join(ROOT, "blog");
const SITE_URL = "https://shahtufail.com.np/";
const SOURCE_EXT = /\.(txt|md)$/i;

/* ---- Parse front-matter ("--- key: value ---" header) ---- */
function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("Missing front matter block (--- ... ---)");

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key && value !== "") meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

/* ---- Fill template tokens ---- */
function fillTemplate(template, meta, body) {
  const outName = "article-" + meta.slug + ".html";
  const pageUrl = "blog/" + outName;

  const tokens = {
    __SITE_URL__: SITE_URL,
    __SLUG__: pageUrl.replace(".html", ""),
    __ROOT__: "../",
    __TITLE__: meta.title,
    __DESCRIPTION__: meta.description,
    __CATEGORY__: meta.category,
    __HERO_TITLE__: meta.hero_title,
    __AUTHOR__: meta.author,
    __DATE__: meta.date,
    __READ_TIME__: meta.read_time,
    __SOURCE_NAME__: meta.source_name,
    __SOURCE_URL__: meta.source_url,
    __IMAGE__: meta.image,
    __IMAGE_ALT__: meta.image_alt,
    __IMG_W__: meta.img_w,
    __IMG_H__: meta.img_h,
    __DATE_ISO__: meta.date_iso,
    __CONTENT__: body,
  };

  let output = template;
  for (const [token, value] of Object.entries(tokens)) {
    output = output.split(token).join(value === undefined ? "" : value);
  }
  return output;
}

/* ---- Ensure prerequisites exist ---- */
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error("Template not found:", TEMPLATE_PATH);
  process.exit(1);
}
if (!fs.existsSync(ARTICLES_DIR)) {
  console.error("Articles directory not found:", ARTICLES_DIR);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
const files = fs
  .readdirSync(ARTICLES_DIR)
  .filter((f) => SOURCE_EXT.test(f))
  .sort();

if (files.length === 0) {
  console.error("No article files found in", ARTICLES_DIR);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/* ---- Build each article ---- */
for (const file of files) {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");

  let parsed;
  try {
    parsed = parseFrontMatter(raw);
  } catch (err) {
    console.error("Skipping", file, "-", err.message);
    continue;
  }

  const html = fillTemplate(template, parsed.meta, parsed.body);
  const outName = "article-" + parsed.meta.slug + ".html";

  const leftover = html.match(/__[A-Z_]+__/g);
  if (leftover) {
    console.error("WARNING:", outName, "has unfilled tokens:", leftover.join(", "));
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, outName), html);
  console.log("Built", "blog/" + outName);
}
