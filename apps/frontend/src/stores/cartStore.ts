import type { PaymentCondition, PaymentMethod, TeamDto, ParticipantDto } from "@minibox/shared";
import { create } from "zustand";

export interface CartItem {
  menuItemId: string;
  number: number;
  description: string;
  price: number;
  quantity: number;
}

interface CartState {
  team: TeamDto | null;
  participant: ParticipantDto | null;
  items: CartItem[];
  condition: PaymentCondition;
  paymentMethod: PaymentMethod | null;
  setTeam: (team: TeamDto | null) => void;
  setParticipant: (participant: ParticipantDto | null) => void;
  addItem: (item: { menuItemId: string; number: number; description: string; price: number }, quantity: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  setCondition: (condition: PaymentCondition) => void;
  setPaymentMethod: (paymentMethod: PaymentMethod | null) => void;
  reset: () => void;
}

const initialState = {
  team: null as TeamDto | null,
  participant: null as ParticipantDto | null,
  items: [] as CartItem[],
  condition: "IMMEDIATE" as PaymentCondition,
  paymentMethod: null as PaymentMethod | null,
};

export const useCartStore = create<CartState>((set) => ({
  ...initialState,
  setTeam: (team) => set({ team, participant: null }),
  setParticipant: (participant) => set({ participant }),
  addItem: (item, quantity) =>
    set((state) => {
      const existing = state.items.find((cartItem) => cartItem.menuItemId === item.menuItemId);
      if (existing) {
        return {
          items: state.items.map((cartItem) =>
            cartItem.menuItemId === item.menuItemId
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem,
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity }] };
    }),
  updateQuantity: (menuItemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((item) => item.menuItemId !== menuItemId)
          : state.items.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item)),
    })),
  removeItem: (menuItemId) =>
    set((state) => ({ items: state.items.filter((item) => item.menuItemId !== menuItemId) })),
  setCondition: (condition) =>
    set((state) => ({ condition, paymentMethod: condition === "ON_CREDIT" ? null : state.paymentMethod })),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  reset: () => set({ ...initialState }),
}));

export function getCartTotal(items: CartItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
}
