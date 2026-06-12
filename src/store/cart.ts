import { useEffect, useState } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  img: ReturnType<typeof require>;
};

export type CuponAplicado = {
  id: string;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  descuento: number;
};

// ─── Estado global (módulo singleton) ────────────────────────────────────────

let _items: CartItem[] = [];
let _coupon: CuponAplicado | null = null;

const _listeners       = new Set<(items: CartItem[]) => void>();
const _couponListeners = new Set<(c: CuponAplicado | null) => void>();

function notify() {
  const snapshot = [..._items];
  _listeners.forEach((l) => l(snapshot));
}

function notifyCoupon() {
  _couponListeners.forEach((l) => l(_coupon));
}

// ─── Acciones ────────────────────────────────────────────────────────────────

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const existing = _items.find((i) => i.id === item.id);
  if (existing) {
    _items = _items.map((i) =>
      i.id === item.id ? { ...i, qty: i.qty + qty } : i
    );
  } else {
    _items = [..._items, { ...item, qty }];
  }
  notify();
}

export function updateQty(id: string, delta: number) {
  _items = _items
    .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
    .filter((i) => i.qty > 0);
  notify();
}

export function removeFromCart(id: string) {
  _items = _items.filter((i) => i.id !== id);
  notify();
}

export function clearCart() {
  _items  = [];
  _coupon = null;
  notify();
  notifyCoupon();
}

export function applyCoupon(c: CuponAplicado) { _coupon = c; notifyCoupon(); }
export function removeCoupon()               { _coupon = null; notifyCoupon(); }
export function getCoupon()                  { return _coupon; }

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const [items,  setItems]  = useState<CartItem[]>(() => [..._items]);
  const [coupon, setCoupon] = useState<CuponAplicado | null>(() => _coupon);

  useEffect(() => {
    const listener = (snapshot: CartItem[]) => setItems(snapshot);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  useEffect(() => {
    const listener = (c: CuponAplicado | null) => setCoupon(c);
    _couponListeners.add(listener);
    return () => { _couponListeners.delete(listener); };
  }, []);

  return {
    items,
    coupon,
    totalItems: items.reduce((sum, i) => sum + i.qty, 0),
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
}
