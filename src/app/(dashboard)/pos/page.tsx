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

  // State untuk Modal Pembayaran
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS_STATIC" | "QRIS_DYNAMIC">("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"WAITING" | "PAID">("WAITING");
  const [transactionId, setTransactionId] = useState("");

  // Ambil Data Barang dari Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("id, name, selling_price, stock");
      if (data) {
        setProducts(data.map(p => ({ id: p.id, name: p.name, price: Number(p.selling_price), stock: p.stock })));
      }
      setLoading(false);
    };
    fetchProducts();
  }, [supabase]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Fungsi Mulai Checkout
  const handleCheckout = () => {
    const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTransactionId(trxId);
    setPaymentStatus("WAITING");
    setIsCheckout(true);
  };

  // Simulasi Webhook/Callback dari Payment Gateway untuk QRIS Dinamis
  const simulatePaymentGatewayCallback = () => {
    setPaymentStatus("PAID");
  };

  // Selesaikan Transaksi & Simpan ke DB
  const processTransaction = async () => {
    // Simpan ke tabel sales (Disederhanakan)
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

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
      // Simpan detail barang ke sale_items
      const itemsToInsert = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.qty,
        price: item.price,
        subtotal: item.price * item.qty
      }));
      await supabase.from("sale_items").insert(itemsToInsert);
    }

    // Reset Kasir
    alert(`Pembayaran Diterima!\nRp ${total.toLocaleString("id-ID")}\nTransaksi: #${transactionId}`);
    setIsCheckout(false);
    setCart([]);
  };

  return (
    <div className="flex h-full relative">
      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Pilih Barang</h2>
        {loading ? (
          <p>Memuat barang dari database...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.length === 0 ? <p className="text-gray-500">Belum ada barang.</p> : products.map((prod) => (
              <button key={prod.id} onClick={() => addToCart(prod)} className="bg-white p-4 rounded-xl shadow-sm border text-left hover:border-blue-500 transition">
                <div className="font-medium text-gray-900">{prod.name}</div>
                <div className="text-blue-600 font-bold mt-2">Rp {prod.price.toLocaleString("id-ID")}</div>
                <div className="text-xs text-gray-400 mt-1">Stok: {prod.stock}</div>
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
              {/* Opsi Metode */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">Metode Pembayaran</h3>
                {(["CASH", "QRIS_STATIC", "QRIS_DYNAMIC"] as const).map(method => (
                  <button 
                    key={method} 
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition ${paymentMethod === method ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
                  >
                    {method === "CASH" ? "💵 Tunai / Cash" : method === "QRIS_STATIC" ? "📱 QRIS Statis (Level 1)" : "⚡ QRIS Dinamis API (Level 2)"}
                  </button>
                ))}
              </div>

              {/* Area Tampilan QRIS / Konfirmasi */}
              <div className="bg-gray-50 p-6 rounded-xl border flex flex-col items-center justify-center min-h-[300px] text-center">
                {paymentMethod === "CASH" && (
                  <div>
                    <div className="text-6xl mb-4">💵</div>
                    <h4 className="font-bold text-lg mb-2">Pembayaran Tunai</h4>
                    <p className="text-sm text-gray-500 mb-6">Terima uang tunai dari pelanggan dan berikan kembalian jika ada.</p>
                    <button onClick={processTransaction} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 w-full">Konfirmasi Lunas</button>
                  </div>
                )}

                {paymentMethod === "QRIS_STATIC" && (
                  <div>
                    <h4 className="font-bold mb-2">QRIS Statis Toko</h4>
                    <p className="text-xs text-gray-500 mb-4">Pelanggan scan QR ini dan memasukkan nominal Rp {total.toLocaleString("id-ID")} secara manual.</p>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_STATIS_TOKO_MAKMUR`} alt="QRIS Statis" className="mx-auto mb-4 p-2 bg-white rounded-lg border shadow-sm w-40 h-40" />
                    <button onClick={processTransaction} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 w-full">Cek Mutasi & Lunas</button>
                  </div>
                )}

                {paymentMethod === "QRIS_DYNAMIC" && (
                  <div>
                    <h4 className="font-bold mb-2">QRIS Dinamis</h4>
                    <p className="text-xs text-gray-500 mb-4">Otomatis terisi nominal Rp {total.toLocaleString("id-ID")}</p>
                    {paymentStatus === "WAITING" ? (
                      <>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_DYN_${transactionId}_${total}`} alt="QRIS Dinamis" className="mx-auto mb-4 p-2 bg-white rounded-lg border shadow-sm w-40 h-40" />
                        <div className="flex items-center justify-center space-x-2 text-orange-600 mb-4">
                          <span className="animate-spin text-xl">⏳</span>
                          <span className="text-sm font-semibold">Menunggu Pembayaran...</span>
                        </div>
                        <button onClick={simulatePaymentGatewayCallback} className="text-xs text-gray-400 underline mt-4">*(Simulasi API: Klik untuk memalsukan respon sukses PJP)*</button>
                      </>
                    ) : (
                      <div className="py-8">
                        <div className="text-5xl mb-4">✅</div>
                        <h4 className="font-bold text-xl text-green-600 mb-2">Pembayaran Diterima!</h4>
                        <p className="text-sm text-gray-500">API Gateway telah mengonfirmasi transaksi ini.</p>
                        <button onClick={processTransaction} className="mt-6 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 w-full">Cetak Struk Transaksi</button>
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
    </div>
  );
}
