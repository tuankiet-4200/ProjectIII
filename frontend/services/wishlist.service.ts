import api from '@/lib/axios';

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  slug: string;
  description?: string;
  images: string[];
  stock_quantity: number;
  shop?: {
    id: string;
    name: string;
  };
}

export const wishlistService = {
  getWishlist: async (): Promise<WishlistProduct[]> => {
    const { data } = await api.get('/wishlist');
    return data;
  },

  toggleWishlist: async (productId: string): Promise<{ added: boolean; message: string }> => {
    const { data } = await api.post('/wishlist/toggle', { product_id: productId });
    return data;
  },

  checkWishlist: async (productId: string): Promise<{ wishlisted: boolean }> => {
    const { data } = await api.get(`/wishlist/check/${productId}`);
    return data;
  },
};
