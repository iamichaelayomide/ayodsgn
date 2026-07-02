import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const repoRoot = process.cwd();
const sourceRoot = process.env.PLAYGROUND_SOURCE || "C:/Users/USER/Desktop/Projects/New Portfolio";
const outputRoot = path.join(repoRoot, "assets", "playground");
const tmpRoot = path.join(repoRoot, "output", "playground-optimization");

const groups = [
  {
    source: "Interaction Work",
    output: "interactions",
    type: "video"
  },
  {
    source: "UI Exploration",
    output: "ui",
    type: "image"
  },
  {
    source: "Illustration Work",
    output: "artworks",
    type: "image"
  }
];

function slugify(fileName) {
  return path.basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with ${code}: ${stderr}`));
      }
    });
  });
}

async function listFiles(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);
    if (info.isFile()) files.push(fullPath);
  }
  return files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

async function optimizeImage(sourcePath, outputDir) {
  const slug = slugify(sourcePath);
  const fullPath = path.join(outputDir, `${slug}.webp`);
  const thumbPath = path.join(outputDir, `${slug}-thumb.webp`);

  await sharp(sourcePath, { limitInputPixels: false })
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toFile(fullPath);

  await sharp(sourcePath, { limitInputPixels: false })
    .rotate()
    .resize({ width: 520, height: 380, fit: "cover", position: "attention" })
    .webp({ quality: 70, effort: 5 })
    .toFile(thumbPath);
}

async function optimizeVideo(sourcePath, outputDir) {
  const slug = slugify(sourcePath);
  const videoPath = path.join(outputDir, `${slug}.mp4`);
  const posterPng = path.join(tmpRoot, `${slug}.png`);
  const posterPath = path.join(outputDir, `${slug}-poster.webp`);

  await runFfmpeg([
    "-y",
    "-i", sourcePath,
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "30",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an",
    videoPath
  ]);

  await runFfmpeg([
    "-y",
    "-ss", "00:00:00.6",
    "-i", sourcePath,
    "-frames:v", "1",
    posterPng
  ]);

  await sharp(posterPng)
    .resize({ width: 520, height: 380, fit: "cover", position: "attention" })
    .webp({ quality: 70, effort: 5 })
    .toFile(posterPath);
}

async function main() {
  await rm(outputRoot, { recursive: true, force: true });
  await rm(tmpRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await mkdir(tmpRoot, { recursive: true });

  for (const group of groups) {
    const inputDir = path.join(sourceRoot, group.source);
    const outputDir = path.join(outputRoot, group.output);
    await mkdir(outputDir, { recursive: true });
    const files = await listFiles(inputDir);
    for (const file of files) {
      if (group.type === "video") {
        await optimizeVideo(file, outputDir);
      } else {
        await optimizeImage(file, outputDir);
      }
      console.log(`Optimized ${path.basename(file)}`);
    }
  }

  await rm(tmpRoot, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
