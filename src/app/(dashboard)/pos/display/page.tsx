"use client";

import { useState, useEffect } from "react";

type CartItem = { id: string; name: string; price: number; qty: number };
type PaymentStatus = { isCheckout: boolean; total: number; method: string; status: string; trxId: string };

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);

  // Listen to LocalStorage Changes from POS Window
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem("smartpos_cart");
      const savedPayment = localStorage.getItem("smartpos_payment");
      
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedPayment) setPayment(JSON.parse(savedPayment));
    };

    // Initial Load
    handleStorageChange();

    // Listen for cross-tab events
    window.addEventListener("storage", handleStorageChange);
    
    // Fallback polling (if same tab/window for testing)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Panel - Ads / Promo Video */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center relative">
        <div className="text-center space-y-6 z-10 p-10">
          <h1 className="text-5xl font-extrabold text-blue-500">GTI SmartPOS</h1>
          <p className="text-2xl text-gray-300">Solusi Kasir & Manajemen Toko UMKM</p>
          <div className="mt-10 p-8 border-4 border-dashed border-gray-700 rounded-3xl">
            <h3 className="text-3xl text-yellow-400 font-bold mb-4">PROMO HARI INI!</h3>
            <p className="text-xl">Dapatkan diskon 10% untuk pembayaran menggunakan QRIS.</p>
          </div>
        </div>
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80" />
      </div>

      {/* Right Panel - Cart & Checkout Status */}
      <div className="w-[500px] bg-white text-gray-900 flex flex-col shadow-2xl">
        <div className="p-8 border-b bg-gray-50">
          <h2 className="text-3xl font-bold text-center">Toko GTI Makmur</h2>
        </div>

        {payment?.isCheckout ? (
          // CHECKOUT SCREEN
          <div className="flex-1 p-8 flex flex-col items-center justify-center bg-blue-50">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Total Tagihan</h3>
            <div className="text-6xl font-extrabold text-blue-600 mb-8">Rp {payment.total.toLocaleString("id-ID")}</div>
            
            {payment.method.includes("QRIS") && payment.status === "WAITING" && (
              <div className="text-center bg-white p-6 rounded-3xl shadow-xl">
                <p className="text-gray-500 mb-4 font-medium">Silakan Scan QRIS berikut:</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_DYN_${payment.trxId}_${payment.total}`} 
                  alt="QRIS" 
                  className="mx-auto w-56 h-56"
                />
              </div>
            )}

            {payment.status === "PAID" && (
              <div className="text-center animate-bounce mt-10">
                <div className="text-8xl mb-4">✅</div>
                <h3 className="text-3xl font-bold text-green-600">Pembayaran Berhasil</h3>
                <p className="text-gray-500 mt-2">Terima kasih atas kunjungan Anda!</p>
              </div>
            )}
            
            {payment.method === "CASH" && payment.status === "WAITING" && (
              <div className="text-center">
                <div className="text-8xl mb-4">💵</div>
                <h3 className="text-2xl font-bold text-gray-700">Menunggu Pembayaran Tunai...</h3>
              </div>
            )}
          </div>
        ) : (
          // CART SCREEN
          <>
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-xl">
                  Belum ada barang belanjaan
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <div className="font-bold text-xl">{item.name}</div>
                      <div className="text-lg text-gray-500">{item.qty} x Rp {item.price.toLocaleString("id-ID")}</div>
                    </div>
                    <div className="font-bold text-2xl">Rp {(item.qty * item.price).toLocaleString("id-ID")}</div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-8 bg-blue-600 text-white">
              <div className="flex justify-between items-center text-2xl font-medium">
                <span>TOTAL BELANJA</span>
                <span className="font-extrabold text-4xl">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
