import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProductoDB = {
  id?:          string;
  name:         string;
  price:        number;
  weight:       string;
  category:     string;
  subcat:       string;
  presentacion: string;
  imgUrl:       string;
  available:    boolean;
  createdAt?:   unknown;
};

export type CuponDB = {
  id?:          string;
  codigo:       string;
  tipo:         'porcentaje' | 'monto_fijo';
  descuento:    number;
  minimoCompra: number;
  usosMaximos:  number;
  usosActuales: number;
  activo:       boolean;
  expiracion:   string;
};

export type PedidoDB = {
  id?:          string;
  userId:       string;
  items:        { productId: string; name: string; price: number; qty: number }[];
  subtotal:     number;
  delivery:     number;
  descuento?:   number;
  cuponId?:     string;
  cuponCodigo?: string;
  total:        number;
  status:       'Pendiente' | 'En Proceso' | 'Entregado' | 'Cancelado';
  address:      string;
  payMethod:    string;
  createdAt?:   unknown;
  updatedAt?:   unknown;
};

export type UsuarioDB = {
  uid:         string;
  email:       string;
  displayName: string;
  role:        'cliente' | 'admin';
  phone?:      string;
  address?:    string;
  createdAt?:  unknown;
  updatedAt?:  unknown;
};

// ─── Productos ────────────────────────────────────────────────────────────────

export async function getProductos(): Promise<ProductoDB[]> {
  const snap = await getDocs(collection(db, 'productos'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ProductoDB))
    .filter((p) => p.available !== false);
}

export function onProductosChange(callback: (productos: ProductoDB[]) => void) {
  return onSnapshot(
    collection(db, 'productos'),
    (snap) => callback(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ProductoDB))
        .filter((p) => p.available !== false)
    )
  );
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function crearPedido(
  pedido: Omit<PedidoDB, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'pedidos'), {
    ...pedido,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPedidoById(pedidoId: string): Promise<PedidoDB | null> {
  const snap = await getDoc(doc(db, 'pedidos', pedidoId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PedidoDB;
}

function sortByCreatedAt(docs: PedidoDB[]): PedidoDB[] {
  return docs.sort((a, b) => {
    const ta = (a.createdAt as any)?.toMillis?.() ?? (a.createdAt as any)?.seconds ?? 0;
    const tb = (b.createdAt as any)?.toMillis?.() ?? (b.createdAt as any)?.seconds ?? 0;
    return tb - ta;
  });
}

export async function getPedidosUsuario(userId: string): Promise<PedidoDB[]> {
  const snap = await getDocs(collection(db, 'pedidos'));
  return sortByCreatedAt(
    snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as PedidoDB))
      .filter((p) => p.userId === userId)
  );
}

export function onPedidosUsuarioChange(
  userId: string,
  callback: (pedidos: PedidoDB[]) => void
) {
  return onSnapshot(
    collection(db, 'pedidos'),
    (snap) => callback(
      sortByCreatedAt(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PedidoDB))
          .filter((p) => p.userId === userId)
      )
    )
  );
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  status: PedidoDB['status']
): Promise<void> {
  await updateDoc(doc(db, 'pedidos', pedidoId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─── Ofertas ──────────────────────────────────────────────────────────────────

export type OfertaDB = {
  id?:           string;
  title:         string;
  description:   string;
  badge:         string;
  discount:      number;
  originalPrice: number;
  salePrice:     number;
  imgUrl:        string;
  active:        boolean;
  createdAt?:    unknown;
};

export function onOfertasChange(callback: (ofertas: OfertaDB[]) => void) {
  return onSnapshot(
    collection(db, 'ofertas'),
    (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as OfertaDB))
        .filter((o) => o.active !== false);
      all.sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? (a.createdAt as any)?.seconds ?? 0;
        const tb = (b.createdAt as any)?.toMillis?.() ?? (b.createdAt as any)?.seconds ?? 0;
        return tb - ta;
      });
      callback(all);
    }
  );
}

// ─── Cupones ──────────────────────────────────────────────────────────────────

export async function validarCupon(
  codigo: string,
  subtotal: number
): Promise<{ ok: true; cupon: CuponDB } | { ok: false; error: string }> {
  const snap = await getDocs(collection(db, 'cupones'));
  const cupon = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CuponDB))
    .find((c) => c.codigo.toUpperCase() === codigo.trim().toUpperCase());

  if (!cupon)       return { ok: false, error: 'Código de cupón inválido' };
  if (!cupon.activo) return { ok: false, error: 'Este cupón no está activo' };

  if (cupon.expiracion) {
    const exp = new Date(cupon.expiracion);
    exp.setHours(23, 59, 59, 999);
    if (exp < new Date()) return { ok: false, error: 'Este cupón ha expirado' };
  }

  if (cupon.usosMaximos > 0 && cupon.usosActuales >= cupon.usosMaximos)
    return { ok: false, error: 'Este cupón ya alcanzó su límite de usos' };

  if (subtotal < cupon.minimoCompra)
    return { ok: false, error: `Compra mínima de $${cupon.minimoCompra.toFixed(2)} para usar este cupón` };

  return { ok: true, cupon };
}

export async function registrarUsoCupon(cuponId: string): Promise<void> {
  await updateDoc(doc(db, 'cupones', cuponId), { usosActuales: increment(1) });
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export async function actualizarUsuario(
  uid: string,
  data: Partial<Omit<UsuarioDB, 'uid' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
