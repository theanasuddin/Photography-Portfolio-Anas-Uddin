import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/site.config";
import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import { html } from "satori-html";
import { getI18n } from "@/i18n/index";

const getLang = (pathname) => {
  for (const lang of ["en", "bn"]) {
    if (pathname.indexOf(`/${lang}/`) === 0) return lang;
  }
  return "en";
};

const ogOptions: SatoriOptions = {
  fonts: [
    {
      data: fs.readFileSync(
        path.resolve(
          process.cwd(),
          "node_modules/@hdud/common/assets/汇文明朝体.otf",
        ),
      ),
      name: "Huiwen",
      style: "normal",
      weight: 400,
    },
  ],
  height: 630,
  width: 1200,
};

const markup = (i18n) =>
  html`<div tw="flex flex-col w-full h-full bg-[#1d1f21] text-[#c9cacc]">
    <div
      tw="flex items-end justify-start w-full p-10 text-xl border-b border-[#2bbc89]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="96"
        viewBox="0 0 15.84 9.04"
      >
        <path
          d="M5.79,10.48H2.57L2,12.32H0L3.32,3.4H5l3.34,8.92H6.41ZM3.06,9H5.29L4.17,5.65Z"
          transform="translate(0 -3.4)"
          fill="#ef3734"
        />
        <path
          d="M15.84,3.4V9.27a3,3,0,0,1-.92,2.32,3.51,3.51,0,0,1-2.5.85,3.57,3.57,0,0,1-2.48-.83A3,3,0,0,1,9,9.34V3.4h1.84V9.29a1.67,1.67,0,0,0,.42,1.27,1.6,1.6,0,0,0,1.16.4c1,0,1.56-.54,1.58-1.63V3.4Z"
          transform="translate(0 -3.4)"
          fill="#ef3734"
        />
      </svg>
      <p tw="ml-3 font-semibold">${i18n("mate.title")}</p>
    </div>
    <div class="flex flex-1 p-10 flex-col text-4xl">
      <p>${i18n("mate.description")}</p>
    </div>
    <div class="flex p-10 flex-col text-4xl">
      <p class="flex justify-end">
        By: ${siteConfig.author} (${siteConfig.site})
      </p>
    </div>
  </div>`;

export default async function (context) {
  const i18n = await getI18n(getLang(context.url.pathname), "design");
  const svg = await satori(markup(i18n), ogOptions);
  const png = new Resvg(svg).render().asPng();
  return [
    png,
    {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    },
  ];
}
