"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { logAudit } from "@/utils/auditLogger";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; purchase_price: number; stock: number };
type SelectedProduct = Product & { qty: number; newPrice: number };

export default function NewPurchasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("LUNAS");
  const [dueDate, setDueDate] = useState("");
  
  const [selectedItems, setSelectedItems] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ambil Master Data
    const fetchData = async () => {
      const [{ data: supps }, { data: prods }] = await Promise.all([
        supabase.from("suppliers").select("id, name"),
        supabase.from("products").select("id, name, purchase_price, stock")
      ]);
      if (supps) setSuppliers(supps);
      if (prods) setProducts(prods.map(p => ({ ...p, purchase_price: Number(p.purchase_price) })));
    };
    fetchData();
  }, [supabase]);

  const addProductToInvoice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    if (!prodId) return;
    
    const prod = products.find(p => p.id === prodId);
    if (prod && !selectedItems.find(i => i.id === prodId)) {
      setSelectedItems([...selectedItems, { ...prod, qty: 1, newPrice: prod.purchase_price }]);
    }
    e.target.value = ""; // reset dropdown
  };

  const updateItem = (id: string, field: "qty" | "newPrice", value: number) => {
    setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.qty * item.newPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Pilih minimal 1 barang!");
    
    setLoading(true);
    
    // 1. Simpan Transaksi Pembelian (Purchases)
    const { data: purchaseData, error: purchaseError } = await supabase.from("purchases").insert([{
      invoice_number: invoiceNo || `INV-${Date.now()}`,
      supplier_id: supplierId || null,
      total_amount: totalAmount,
      payment_status: paymentStatus,
      due_date: paymentStatus === "HUTANG" ? dueDate : null
    }]).select().single();

    if (purchaseData && !purchaseError) {
      // 2. Simpan Detail Item dan Update Stok
      for (const item of selectedItems) {
        // Simpan purchase items
        await supabase.from("purchase_items").insert([{
          purchase_id: purchaseData.id,
          product_id: item.id,
          quantity: item.qty,
          purchase_price: item.newPrice,
          subtotal: item.qty * item.newPrice
        }]);

        // TAMBAH STOK & Update Harga Beli Modal Baru (Opsional, jika harga modal naik/turun)
        await supabase.from("products").update({ 
          stock: item.stock + item.qty,
          purchase_price: item.newPrice // Update harga modal rata-rata/terakhir
        }).eq("id", item.id);
      }

      await logAudit(supabase, "STOK_MASUK", `Menerima stok masuk invoice #${purchaseData.invoice_number} senilai Rp ${totalAmount}`);
      
      router.push("/purchases");
      router.refresh();
    } else {
      alert("Gagal menyimpan data!");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Form Stok Masuk (Pembelian)</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* Info Invoice & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nomor Invoice Supplier</label>
            <input type="text" required value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full border p-2 rounded focus:ring-2" placeholder="INV-2026/08/..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Supplier</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full border p-2 rounded focus:ring-2">
              <option value="">-- Pilih Supplier (Atau Kosongi) --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Pilih Barang */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">Tambahkan Barang ke Invoice</label>
          <select onChange={addProductToInvoice} className="w-full border p-2 rounded bg-gray-50 font-medium text-blue-600 focus:ring-2">
            <option value="">+ Ketik/Pilih Barang untuk Ditambahkan</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Sisa: {p.stock})</option>)}
          </select>
        </div>

        {/* Tabel Barang Terpilih */}
        {selectedItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3 w-32">Harga Beli Baru</th>
                  <th className="p-3 w-24">Qty Masuk</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">
                      <input type="number" value={item.newPrice} onChange={e => updateItem(item.id, "newPrice", Number(e.target.value))} className="w-full border p-1 rounded text-sm" />
                    </td>
                    <td className="p-3">
                      <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} className="w-full border p-1 rounded text-sm" />
                    </td>
                    <td className="p-3 text-right font-bold text-gray-700">
                      {(item.qty * item.newPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 font-bold hover:text-red-700">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total & Status Pembayaran */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Status Pembayaran</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full border p-2 rounded mb-3">
              <option value="LUNAS">✅ Lunas (Cash/Transfer)</option>
              <option value="HUTANG">⏳ Hutang (Bayar Nanti)</option>
            </select>
            
            {paymentStatus === "HUTANG" && (
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">Jatuh Tempo (Due Date) *</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border-red-300 border p-2 rounded focus:ring-2 focus:ring-red-200" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center items-end">
            <span className="text-gray-500 font-medium">Total Tagihan Invoice</span>
            <span className="text-4xl font-extrabold text-blue-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading || selectedItems.length === 0} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Menyimpan Data..." : "Simpan Stok Masuk"}
          </button>
        </div>
      </form>
    </div>
  );
}
