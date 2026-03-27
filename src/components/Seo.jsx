import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Learnify";
const SITE_URL = String(import.meta.env.VITE_SITE_URL || "https://learnifyedu.store").replace(/\/+$/, "");
const SITE_IMAGE = `${SITE_URL}/logo.jpg?v=20260226`;
const SITE_DESCRIPTION =
  "Learnify is an AI-powered online learning platform for web development, data structures, AI/ML, cloud, cybersecurity and language learning courses.";
const SITE_KEYWORDS = [
  "Learnify",
  "online tech courses",
  "web development course",
  "data structures course",
  "AI ML course",
  "data science learning",
  "cloud devops course",
  "cybersecurity course",
  "language learning platform",
  "project-based learning",
  "online certification courses",
];

const normalizeKeywords = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value || "");
};

const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return SITE_URL;
};

const buildAbsoluteUrl = (value = "/") => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${getBaseUrl()}${normalizedPath}`;
};

const upsertMeta = (attribute, key, content) => {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  let link = document.head.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
};

const updateStructuredData = (markup) => {
  const existing = document.head.querySelector("#learnify-structured-data");

  if (!markup) {
    existing?.remove();
    return;
  }

  const script = existing || document.createElement("script");
  script.id = "learnify-structured-data";
  script.type = "application/ld+json";
  script.textContent = markup;

  if (!existing) {
    document.head.appendChild(script);
  }
};

function Seo({
  title = `${SITE_NAME} | Online Tech Courses for Web Development, AI/ML & Data Science`,
  description = SITE_DESCRIPTION,
  keywords = SITE_KEYWORDS,
  canonicalPath,
  image = SITE_IMAGE,
  type = "website",
  noIndex = false,
  structuredData = null,
}) {
  const location = useLocation();
  const keywordContent = normalizeKeywords(keywords) || normalizeKeywords(SITE_KEYWORDS);
  const canonicalUrl = buildAbsoluteUrl(canonicalPath || location.pathname || "/");
  const imageUrl = buildAbsoluteUrl(image || SITE_IMAGE);
  const robotsContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const structuredDataMarkup = structuredData ? JSON.stringify(structuredData) : "";

  useEffect(() => {
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywordContent);
    upsertMeta("name", "robots", robotsContent);
    upsertMeta("name", "googlebot", robotsContent);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:site", "@learnifyedu");
    upsertLink("canonical", canonicalUrl);
    updateStructuredData(structuredDataMarkup);
  }, [
    canonicalUrl,
    description,
    imageUrl,
    keywordContent,
    robotsContent,
    structuredDataMarkup,
    title,
    type,
  ]);

  return null;
}

export default Seo;
