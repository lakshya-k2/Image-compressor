import { NextResponse } from "next/server";
import sharp from "sharp";

const PRESETS = {
  instagram: { width: 1080, height: 1080, fit: "cover" },
  story: { width: 1080, height: 1920, fit: "cover" },
  twitter: { width: 1200, height: 675, fit: "cover" },
  original: { width: 0, height: 0, fit: "fill" },
};

export async function POST(request) {
  const data = await request.formData();
  const file = data.get("file");
  const preset = data.get("preset") || "instagram";
  const quality = parseInt(data.get("quality") || "80", 10);

  if (!file || !PRESETS[preset]) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalSize = buffer.byteLength;

  let processor = sharp(buffer);
  if (preset !== "original") {
    const { width, height, fit } = PRESETS[preset];
    processor = processor.resize({ width, height, fit });
  }

  const optimizedBuffer = await processor.jpeg({ quality }).toBuffer();
  const newSize = optimizedBuffer.byteLength;

  return NextResponse.json({
    fileName: file.name,
    processedImage: `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`,
    originalSize,
    newSize,
  });
}
