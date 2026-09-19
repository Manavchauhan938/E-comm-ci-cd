import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { getGuestId } from '../lib/utils';
import { useUiStore } from './uiStore';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,
      guestId: getGuestId(),
      setGuestId: (guestId) => set({ guestId }),
      fetchCart: async () => {
        set({ loading: true });
        try {
          const guestId = get().guestId;
          const { data } = await api.get('/cart', { params: { guestId } });
          set({ cart: data.data });
          return data.data;
        } finally {
          set({ loading: false });
        }
      },
      addItem: async (productId, quantity = 1) => {
        const { data } = await api.post('/cart/items', {
          productId,
          quantity,
          guestId: get().guestId,
        });
        set({ cart: data.data });
        useUiStore.getState().openCartDrawer();
        useUiStore.getState().toast({ type: 'success', message: 'Added to cart' });
        return data.data;
      },
      updateItem: async (itemId, quantity) => {
        const { data } = await api.patch(`/cart/items/${itemId}`, {
          quantity,
          guestId: get().guestId,
        });
        set({ cart: data.data });
        return data.data;
      },
      removeItem: async (itemId) => {
        const { data } = await api.delete(`/cart/items/${itemId}`, {
          params: { guestId: get().guestId },
        });
        set({ cart: data.data });
        return data.data;
      },
    }),
    {
      name: 'ecomm-cart',
      partialize: (s) => ({ guestId: s.guestId }),
    }
  )
);
