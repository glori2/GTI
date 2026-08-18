"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { logAudit } from "@/utils/auditLogger";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  selling_price: number;
};

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus barang: ${name}?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      await logAudit(supabase, "HAPUS_BARANG", `Menghapus barang: ${name}`);
      fetchProducts(); // Refresh data
    }
  };

  const handleEditStock = async (id: string, currentStock: number, name: string) => {
    const newStockStr = window.prompt(`Masukkan stok baru untuk ${name}:`, currentStock.toString());
    if (newStockStr === null) return; // User cancelled

    const newStock = parseInt(newStockStr, 10);
    if (isNaN(newStock) || newStock < 0) return alert("Jumlah stok tidak valid!");

    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
    if (error) {
      alert("Gagal mengubah stok: " + error.message);
    } else {
      await logAudit(supabase, "UBAH_STOK", `Mengubah stok ${name} dari ${currentStock} menjadi ${newStock}`);
      fetchProducts();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Barang</h1>
        <Link href="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + Tambah Barang
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Memuat data barang...</div>
        ) : error ? (
          <div className="p-6 text-red-500">Gagal memuat data: {error}</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Belum ada data barang. Silakan tambah barang baru.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Nama Barang</th>
                <th className="p-4 font-medium text-gray-600">SKU / Barcode</th>
                <th className="p-4 font-medium text-gray-600">Stok</th>
                <th className="p-4 font-medium text-gray-600">Harga Jual</th>
                <th className="p-4 font-medium text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-500">{product.sku || product.barcode || "-"}</td>
                  <td className="p-4">
                    <span className={`font-bold ${product.stock <= 5 ? "text-red-600" : "text-green-600"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">Rp {Number(product.selling_price).toLocaleString("id-ID")}</td>
                  <td className="p-4 text-right space-x-3">
                    <button 
                      onClick={() => handleEditStock(product.id, product.stock, product.name)}
                      className="text-blue-600 hover:underline font-medium bg-blue-50 px-3 py-1 rounded"
                    >
                      ✏️ Ubah Stok
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-red-600 hover:underline font-medium bg-red-50 px-3 py-1 rounded"
                    >
                      🗑️ Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
