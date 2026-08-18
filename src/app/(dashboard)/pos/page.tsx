"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Tipe Data
type Product = { id: string; name: string; price: number; stock: number };
type CartItem = Product & { qty: number };

export default function PosPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS_STATIC" | "QRIS_DYNAMIC">("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"WAITING" | "PAID">("WAITING");
  const [transactionId, setTransactionId] = useState("");
  const [receiptData, setReceiptData] = useState<{ id: string; items: CartItem[]; total: number; method: string } | null>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Ambil Data Barang
  useEffect(() => {
    fetchProducts();
  }, [supabase]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, selling_price, stock");
    if (data) {
      setProducts(data.map(p => ({ id: p.id, name: p.name, price: Number(p.selling_price), stock: p.stock })));
    }
    setLoading(false);
  };

  // BROADCAST ke Customer Display via LocalStorage
  useEffect(() => {
    localStorage.setItem("smartpos_cart", JSON.stringify(cart));
    localStorage.setItem("smartpos_payment", JSON.stringify({ isCheckout, total, method: paymentMethod, status: paymentStatus, trxId: transactionId }));
  }, [cart, isCheckout, total, paymentMethod, paymentStatus, transactionId]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Stok habis!");
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert("Mencapai batas stok maksimal!");
          return prev;
        }
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleCheckout = () => {
    const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTransactionId(trxId);
    setPaymentStatus("WAITING");
    setIsCheckout(true);
  };

  const processTransaction = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    // 1. Simpan Transaksi Utama
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert([{
        receipt_number: transactionId,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: "PAID",
        user_id: userId
      }])
      .select()
      .single();

    if (!saleError && saleData) {
      // 2. Simpan Detail & Potong Stok Otomatis
      const itemsToInsert = [];
      for (const item of cart) {
        itemsToInsert.push({
          sale_id: saleData.id,
          product_id: item.id,
          quantity: item.qty,
          price: item.price,
          subtotal: item.price * item.qty
        });
        
        // POTONG STOK DI DATABASE
        const newStock = item.stock - item.qty;
        await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
      }
      await supabase.from("sale_items").insert(itemsToInsert);
    }

    // Tampilkan Struk & Bersihkan Kasir
    setReceiptData({ id: transactionId, items: [...cart], total, method: paymentMethod });
    setIsCheckout(false);
    setCart([]);
    fetchProducts(); // Refresh stok terbaru di layar kasir
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex h-full relative">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Pilih Barang</h2>
        <a href="/pos/display" target="_blank" className="text-sm text-blue-600 underline mb-4 inline-block">Buka Layar Customer Display (Tab Baru)</a>
        
        {loading ? (
          <p>Memuat barang dari database...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.length === 0 ? <p className="text-gray-500">Belum ada barang.</p> : products.map((prod) => (
              <button key={prod.id} onClick={() => addToCart(prod)} disabled={prod.stock <= 0} className={`p-4 rounded-xl shadow-sm border text-left transition ${prod.stock <= 0 ? "bg-gray-200 opacity-50 cursor-not-allowed" : "bg-white hover:border-blue-500"}`}>
                <div className="font-medium text-gray-900">{prod.name}</div>
                <div className="text-blue-600 font-bold mt-2">Rp {prod.price.toLocaleString("id-ID")}</div>
                <div className="text-xs text-gray-500 mt-1">Sisa Stok: {prod.stock}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Keranjang */}
      <div className="w-96 bg-white border-l flex flex-col z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Keranjang Kasir</h2>
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
        
        {/* Tombol Print Jika Ada Transaksi Selesai */}
        {receiptData && (
          <div className="p-4 bg-green-50 border-t border-green-200 text-center">
            <p className="text-sm text-green-700 mb-2">Transaksi <strong>#{receiptData.id}</strong> berhasil.</p>
            <button onClick={printReceipt} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">🖨️ Cetak Struk Terakhir</button>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-4 text-xl">
            <span className="font-medium">Total</span>
            <span className="font-bold text-blue-600">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <button onClick={handleCheckout} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition disabled:opacity-50" disabled={cart.length === 0}>
            Pilih Pembayaran
          </button>
        </div>
      </div>

      {/* Modal Pembayaran */}
      {isCheckout && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Pembayaran</h2>
                <p className="text-gray-500">#{transactionId}</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">Rp {total.toLocaleString("id-ID")}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">Metode Pembayaran</h3>
                {(["CASH", "QRIS_STATIC", "QRIS_DYNAMIC"] as const).map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`w-full p-4 rounded-xl border-2 text-left font-medium transition ${paymentMethod === method ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                    {method === "CASH" ? "💵 Tunai / Cash" : method === "QRIS_STATIC" ? "📱 QRIS Statis" : "⚡ QRIS Dinamis API"}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border flex flex-col items-center justify-center min-h-[300px] text-center">
                {paymentMethod === "CASH" && (
                  <div>
                    <h4 className="font-bold text-lg mb-2">Tunai</h4>
                    <button onClick={processTransaction} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 w-full">Selesaikan Pembayaran</button>
                  </div>
                )}

                {paymentMethod === "QRIS_DYNAMIC" && (
                  <div>
                    <h4 className="font-bold mb-2">QRIS Dinamis</h4>
                    {paymentStatus === "WAITING" ? (
                      <>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_DYN_${transactionId}_${total}`} alt="QRIS" className="mx-auto mb-4 w-40 h-40" />
                        <span className="text-orange-600 text-sm font-semibold">⏳ Menunggu Pembayaran...</span>
                        <button onClick={() => setPaymentStatus("PAID")} className="block text-xs text-blue-500 underline mt-4">Simulasi: Pelanggan Sudah Bayar</button>
                      </>
                    ) : (
                      <div>
                        <h4 className="font-bold text-xl text-green-600 mb-2">✅ Diterima!</h4>
                        <button onClick={processTransaction} className="mt-6 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl">Proses Transaksi</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setIsCheckout(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* STRUK THERMAL 58mm (Disembunyikan di layar, hanya muncul saat print) */}
      {receiptData && (
        <div id="print-area" className="hidden print:block w-[58mm] bg-white text-black p-2 font-mono text-[12px] leading-tight mx-auto">
          <div className="text-center mb-4">
            <h1 className="font-bold text-lg">GTI SmartPOS</h1>
            <p>Toko Kelontong & UMKM</p>
            <p>========================</p>
          </div>
          
          <div className="mb-2">
            <p>Tgl: {new Date().toLocaleString('id-ID')}</p>
            <p>Trx: {receiptData.id}</p>
            <p>Metode: {receiptData.method}</p>
          </div>
          <p>------------------------</p>

          <div className="my-2 space-y-2">
            {receiptData.items.map(item => (
              <div key={item.id}>
                <div>{item.name}</div>
                <div className="flex justify-between">
                  <span>{item.qty} x {item.price}</span>
                  <span>{item.qty * item.price}</span>
                </div>
              </div>
            ))}
          </div>

          <p>------------------------</p>
          <div className="flex justify-between font-bold text-[14px] my-2">
            <span>TOTAL</span>
            <span>Rp {receiptData.total.toLocaleString("id-ID")}</span>
          </div>
          <p>========================</p>
          <div className="text-center mt-4">
            <p>Terima Kasih</p>
            <p>Barang yang dibeli tidak dapat ditukar/dikembalikan.</p>
          </div>
        </div>
      )}

    </div>
  );
}
