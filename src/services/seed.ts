import { collection, doc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

// Ejecutar una sola vez para poblar la colección "productos" en Firestore.
// Llama seedProducts() desde cualquier pantalla o desde un botón de admin.

const PRODUCTOS = [
  { id: '1', name: 'Pancitos Franceses',      price: 2.50, weight: '250 g', category: 'panes',     subcat: 'franceses',          presentacion: '5 unidades', imgUrl: 'Pancitos Franceses 1.png',                 available: true },
  { id: '2', name: 'Baguette Plain',           price: 3.00, weight: '300 g', category: 'baguettes', subcat: 'baguette_plain',     presentacion: '5 unidades', imgUrl: 'Pancitos Baguette tradicionales 1.png',    available: true },
  { id: '3', name: 'Baguette Parmesano',       price: 3.25, weight: '300 g', category: 'baguettes', subcat: 'baguette_parmesano', presentacion: '5 unidades', imgUrl: 'Pancitos Baguette Parmesano 1.png',        available: true },
  { id: '4', name: 'Baguette Orégano',         price: 3.25, weight: '300 g', category: 'baguettes', subcat: 'baguette_oregano',   presentacion: '5 unidades', imgUrl: 'Pancitos Baguette Oregano 1.png',          available: true },
  { id: '5', name: 'Panes Dulces',             price: 2.75, weight: '200 g', category: 'panes',     subcat: 'dulces',             presentacion: '5 unidades', imgUrl: 'Pancitos Dulces 1.png',                    available: true },
  { id: '6', name: 'Panes Dulces Chocolate',   price: 3.00, weight: '200 g', category: 'dulces',    subcat: 'dulces_chocolate',   presentacion: '5 unidades', imgUrl: 'Pancitos Dulces chocolate 1.png',          available: true },
  { id: '7', name: 'Pizza Margarita',          price: 4.50, weight: '350 g', category: 'pizza',     subcat: 'pizza',              presentacion: '2 unidades', imgUrl: 'Pizza Margarita 1.png',                    available: true },
];

export async function seedProducts(): Promise<void> {
  const col = collection(db, 'productos');
  await Promise.all(
    PRODUCTOS.map((p) => setDoc(doc(col, p.id), p))
  );
  console.log('✅ Productos guardados en Firestore');
}
