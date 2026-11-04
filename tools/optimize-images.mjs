// Nén ảnh trong src/assets/ tại chỗ (giữ nguyên tên file, không phải sửa đường dẫn trong HTML):
//   - ảnh rộng hơn MAX_WIDTH px được thu nhỏ về MAX_WIDTH;
//   - JPEG nén lại bằng mozjpeg; PNG nén lại, nếu nhỏ hơn nhiều thì dùng bảng màu (vẫn giữ nền trong suốt);
//   - chỉ ghi đè khi file mới nhỏ hơn ít nhất 10% — chạy lại nhiều lần cũng không làm ảnh xấu thêm.
// Chạy sau khi thêm ảnh mới: npm run images
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("src/assets");
const MAX_WIDTH = 1920;
const MIN_BYTES = 50 * 1024; // ảnh nhỏ hơn thì bỏ qua
const MIN_SAVING = 0.1;

const files = fs.readdirSync(ROOT, { recursive: true }).map(String)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .map((f) => path.join(ROOT, f));

let before = 0;
let after = 0;
let changed = 0;

for (const file of files) {
  const input = fs.readFileSync(file);
  if (input.length < MIN_BYTES) continue;

  // rotate(): xoay theo EXIF trước khi bỏ metadata, nếu không ảnh chụp dọc sẽ bị nằm ngang
  const image = sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  let output;
  if (/\.png$/i.test(file)) {
    const lossless = await image.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    const palette = await image.clone().png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer();
    output = palette.length < lossless.length * 0.7 ? palette : lossless;
  } else {
    output = await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  }

  if (output.length > input.length * (1 - MIN_SAVING)) continue;
  fs.writeFileSync(file, output);
  before += input.length;
  after += output.length;
  changed++;
  console.log(`${path.relative(ROOT, file)}: ${Math.round(input.length / 1024)}K -> ${Math.round(output.length / 1024)}K`);
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(changed ? `Da nen ${changed} anh: ${mb(before)}MB -> ${mb(after)}MB.` : "Khong co anh nao can nen.");
