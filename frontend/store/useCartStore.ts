import { create } from 'zustand';
import { cartService } from '@/services/cart.service';
import { CartGroup } from '@/types';

interface CartState {
  groups: CartGroup[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  groups: [],
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartService.getCart();
      set({
        groups: cart.groups || [],
        totalItems: cart.total_items || 0,
        totalAmount: cart.total_amount || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (productId: string, quantity: number) => {
    try {
      const cart = await cartService.addItem(productId, quantity);
      set({
        groups: cart.groups || [],
        totalItems: cart.total_items || 0,
        totalAmount: cart.total_amount || 0,
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  },

  updateItem: async (productId: string, quantity: number) => {
    try {
      const cart = await cartService.updateItem(productId, quantity);
      set({
        groups: cart.groups || [],
        totalItems: cart.total_items || 0,
        totalAmount: cart.total_amount || 0,
      });
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  },

  removeItem: async (productId: string) => {
    try {
      const cart = await cartService.removeItem(productId);
      set({
        groups: cart.groups || [],
        totalItems: cart.total_items || 0,
        totalAmount: cart.total_amount || 0,
      });
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  },

  clearCart: () => {
    set({
      groups: [],
      totalItems: 0,
      totalAmount: 0,
    });
  },
}));
