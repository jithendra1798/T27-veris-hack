import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const filePath = path.join(process.cwd(), "..", "assets", "camel-diagram.png");

  try {
    const image = await readFile(filePath);

    return new Response(new Uint8Array(image), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/png",
      },
    });
  } catch {
    return new Response("CaMeL diagram not found yet.", { status: 404 });
  }
}
