import { getCollection } from "astro:content";
import path from "node:path";

const LOCALE_SUFFIX_RE = /\.(bn|en)$/i;
const EXTENSION_RE = /\.mdx?$/i;

const getWorkName = (work: { id: string; filePath?: string }) =>
  path.basename(work.filePath ?? work.id).replace(EXTENSION_RE, "");

export const getWorkLocale = (workId: string) =>
  getWorkName({ id: workId }).match(LOCALE_SUFFIX_RE)?.[1].toLowerCase() ?? "en";

export const getWorkSlug = (workId: string) =>
  getWorkName({ id: workId }).replace(LOCALE_SUFFIX_RE, "");

export const getWorks = async (locale = "en"): Promise<any[]> => {
  const imageInfo = await getCollection("imageInfo");
  const worksData = await getCollection("works");
  const normalizedLocale = locale.toLowerCase();
  const works = imageInfo.reduce((ans, item) => {
    const matches = worksData.filter(
      (it) => it.data.base === item.id && getWorkLocale(it.filePath ?? it.id) === normalizedLocale,
    );
    const fallback =
      normalizedLocale === "en"
        ? []
        : worksData.filter((it) => it.data.base === item.id && getWorkLocale(it.filePath ?? it.id) === "en");
    const work = matches[0] ?? fallback[0];
    if (!work) {
      throw new Error(`Work ${item.id} page not found for locale ${normalizedLocale}. Please check.`);
    }
    return [
      ...ans,
      {
        ...work,
        data: {
          ...work.data,
          slug: getWorkSlug(work.filePath ?? work.id),
          locale: getWorkLocale(work.filePath ?? work.id),
          members: item.data,
        },
      },
    ];
  }, []);
  return works as any[];
};

export default getWorks;
