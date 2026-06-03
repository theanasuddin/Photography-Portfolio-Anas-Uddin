import type { APIContext } from "astro";
import getPng from "@/components/pages/site_image";

export async function GET(context: APIContext) {
  const [body, init] = await getPng(context);
  return new Response(body as any, init as any);
}
