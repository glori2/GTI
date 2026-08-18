"use client";
import { useState } from "react";

const DUMMY_PRODUCTS = [
  { id: 1, name: "Beras Premium 5 Kg", price: 78000 },
  { id: 2, name: "Minyak Goreng 2 L", price: 36000 },
  { id: 3, name: "Gula Pasir 1 Kg", price: 16000 },
  { id: 4, name: "Tepung Terigu 1 Kg", price: 12000 },
];

export default function PosPage() {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);

  const addToCart = (product: typeof DUMMY_PRODUCTS[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex h-full">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Pilih Barang (Dummy)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DUMMY_PRODUCTS.map((prod) => (
            <button 
              key={prod.id} 
              onClick={() => addToCart(prod)}
              className="bg-white p-4 rounded-xl shadow-sm border text-left hover:border-blue-500 transition"
            >
              <div className="font-medium text-gray-900">{prod.name}</div>
              <div className="text-blue-600 font-bold mt-2">Rp {prod.price.toLocaleString("id-ID")}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Sidebar Kasir */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Keranjang (TRX-001)</h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Keranjang kosong</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.qty} x Rp {item.price.toLocaleString("id-ID")}</div>
                </div>
                <div className="font-bold">Rp {(item.qty * item.price).toLocaleString("id-ID")}</div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-4 text-xl">
            <span className="font-medium">Total</span>
            <span className="font-bold text-blue-600">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={cart.length === 0}>
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
