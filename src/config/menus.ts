import { siteConfig } from "@/site.config";
export const getMenus = (textMap, locale) => {
  const target = locale === "en" ? "" : `/${locale}`;
  const hasAnimate = locale === "en";
  const getHref = (str) => `${target}${str}`;
  const checkActive = (restr) => (path) =>
    new RegExp(`^${target}${restr}`).test(path);
  return [
    {
      label: textMap["all"],
      href: getHref("/"),
      isActive: (path) => ["/", ""].map(getHref).includes(path),
      hasAnimate,
    },
    {
      label: textMap["works"],
      href: getHref("/works/"),
      isActive: checkActive("\/works\/?$"),
      hasAnimate,
    },
    {
      label: textMap["about"],
      href: getHref("/about/"),
      isActive: checkActive("\/about\/?$"),
      hasAnimate,
    },
    {
      label: textMap["contact"],
      href: "https://contact-anas.netlify.app/",
      target: "_blank",
      rel: "noopener noreferrer",
      isActive: (path) => false,
      hasAnimate,
    },
  ];
};
