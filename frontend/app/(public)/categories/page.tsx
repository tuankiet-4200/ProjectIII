import type { Category } from "@/types";
import CategoriesView from "./CategoriesView";
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    return url.replace('localhost', 'backend');
  }
  return url;
};

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${getApiUrl()}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoriesView categories={categories} />;
}
