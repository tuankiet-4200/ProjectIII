const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const origin = apiBase.replace(/\/api\/?$/, "");

export const getPublicImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${normalized}`;
};
