import fs from "fs";
import path from "path";
import sharp from "sharp";
import pLimit from "p-limit";
import os from "os";

const limit = pLimit(os.cpus().length);

const publicPath = path.resolve("./public");
const sizeInfoDir = path.resolve("./src/data/imageInfo.json");
const worksPageDir = path.resolve("./src/data/works");
const saveDir = path.resolve("./public/images/works");
const targetDirBase = path.resolve("./source-image");
const watermark = "";
const targetDirSub = "";
const targetDir = path.join(targetDirBase, targetDirSub);

const MAX_SIZE = 50 * 1024;

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function findAndMoveMd(dir) {
  const name = path.basename(dir);
  fs.readdirSync(dir)
    .filter((file) => /\.md$/i.test(file))
    .forEach((file) => {
      const fileName = file === "main.md" ? `${name}.md` : file;
      const filePath = path.join(dir, file);
      const targetPath = path.join(worksPageDir, fileName);
      fs.copyFileSync(filePath, targetPath);
    });
}

function generateTextWatermark(text, imageWidth, imageHeight) {
  const fontSize = Math.floor(imageWidth / 40);
  const svgHeight = Math.floor(fontSize * 2);

  const svg = `
    <svg width="${imageWidth}" height="${svgHeight}">
      <style>
        .title {
          fill: rgba(255,255,255,0.4);
          font-size: ${fontSize}px;
          font-weight: bold;
          font-family: sans-serif;
        }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title">${text}</text>
    </svg>
  `;

  return {
    svgBuffer: Buffer.from(svg),
    svgHeight,
  };
}

function getAllImageFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllImageFiles(filePath));
    } else if (/\.(jpe?g|png)$/i.test(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

function saveImageInfo(sizeInfo, imgPath, metadata) {
  const filepath = imgPath.replace(publicPath, "").replace(/\\/g, "/");
  const dir = path.dirname(filepath);
  const name = path.basename(filepath);
  if (!sizeInfo[dir]) sizeInfo[dir] = {};
  sizeInfo[dir][name] = [metadata.width, metadata.height];
}

const k = 1.3;
const MIN_QUALITY = 10;
const MAX_QUALITY = 70;
const MAX_WEBP_DIM = 16383;

async function compressImage(filePath, sizeInfo) {
  const baseName = filePath
    .replace(/\.(jpe?g|png)$/i, "")
    .replace(targetDirBase, saveDir);

  const webpPath = `${baseName}.webp`;
  const avifPath = `${baseName}.avif`;
  let image = sharp(filePath);
  const metadata = await image.metadata();
  saveImageInfo(sizeInfo, baseName, metadata);
  if (fs.existsSync(webpPath) && fs.existsSync(avifPath)) {
    return;
  }

  ensureDirExists(webpPath);

  const inputStat = fs.statSync(filePath);
  const isSmall = inputStat.size <= MAX_SIZE;

  let watermarkWidthHeight = [metadata.width, metadata.height];

  if (metadata.width > MAX_WEBP_DIM || metadata.height > MAX_WEBP_DIM) {
    const scale = Math.min(
      MAX_WEBP_DIM / metadata.width,
      MAX_WEBP_DIM / metadata.height,
    );
    const newWidth = Math.floor(metadata.width * scale);
    const newHeight = Math.floor(metadata.height * scale);

    image = image.resize(newWidth, newHeight);
    watermarkWidthHeight = [newWidth, newHeight];
  }

  if (watermark) {
    const { svgBuffer, svgHeight } = generateTextWatermark(
      watermark,
      ...watermarkWidthHeight,
    );
    image = image.composite([
      {
        input: svgBuffer,
        top: Math.floor((metadata.height - svgHeight) / 2),
        left: 0,
      },
    ]);
  }

  let quality;
  const multask = [];

  if (isSmall) {
    quality = 50;
    multask.push(image.clone().webp({ quality }).toBuffer());
    multask.push(image.clone().avif({ quality }).toBuffer());
  } else {
    const baseWebp = await image
      .clone()
      .webp({ quality: MAX_QUALITY })
      .toBuffer();
    const baseSize = baseWebp.length;

    quality = Math.round(MAX_QUALITY * Math.pow(MAX_SIZE / baseSize, 1 / k));
    quality = Math.min(Math.max(quality, MIN_QUALITY), MAX_QUALITY);

    multask.push(image.clone().webp({ quality }).toBuffer());
    multask.push(image.clone().avif({ quality }).toBuffer());
  }
  const [webpBuffer, avifBuffer] = await Promise.all(multask);

  fs.writeFileSync(webpPath, webpBuffer);
  fs.writeFileSync(avifPath, avifBuffer);
}

async function main() {
  if (!fs.existsSync(targetDir)) {
    return;
  }

  const jpgFiles = getAllImageFiles(targetDir);
  const sizeInfo = {};
  const dirs = new Set();
  const tasks = jpgFiles.map((file) =>
    limit(async () => {
      try {
        dirs.add(path.dirname(file));
        await compressImage(file, sizeInfo);
      } catch (err) {}
    }),
  );
  await Promise.all(tasks);
  fs.writeFileSync(sizeInfoDir, JSON.stringify(sizeInfo));
  dirs.forEach((dir) => findAndMoveMd(dir));
}

main();
