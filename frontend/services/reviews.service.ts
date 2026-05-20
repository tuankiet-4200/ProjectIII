import api from '@/lib/axios';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user: { id: string; full_name: string };
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  avgRating: number;
}

export interface CanReviewResponse {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}

export const reviewsService = {
  getProductReviews: async (productId: string): Promise<ReviewsResponse> => {
    const { data } = await api.get(`/reviews/product/${productId}`);
    return data;
  },

  canReview: async (productId: string): Promise<CanReviewResponse> => {
    const { data } = await api.get(`/reviews/check/${productId}`);
    return data;
  },

  createReview: async (
    productId: string,
    rating: number,
    comment?: string,
  ): Promise<Review> => {
    const { data } = await api.post('/reviews', {
      product_id: productId,
      rating,
      comment,
    });
    return data;
  },
};
