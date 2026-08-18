"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { logAudit } from "@/utils/auditLogger";
import Barcode from "react-barcode";
import Link from "next/link";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    purchase_price: 0,
    selling_price: 0,
    stock: 0,
    min_stock: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["purchase_price", "selling_price", "stock", "min_stock"].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  const generateBarcode = () => {
    // Membangkitkan angka unik acak untuk format barcode 13 digit atau BRGxxxx
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, barcode: `BRG${randomNum}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Insert ke tabel products Supabase
    const { error: insertError } = await supabase
      .from("products")
      .insert([
        {
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode,
          purchase_price: formData.purchase_price,
          selling_price: formData.selling_price,
          stock: formData.stock,
          min_stock: formData.min_stock,
        }
      ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Catat ke Audit Log
      await logAudit(supabase, "TAMBAH_BARANG", `Menambahkan barang baru: ${formData.name} (${formData.sku})`);
      
      router.push("/products");
      router.refresh(); 
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tambah Barang Baru</h1>
        <Link href="/products" className="text-gray-500 hover:underline">
          Batal & Kembali
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        
        {/* Informasi Dasar */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" placeholder="Contoh: Beras Premium 5 Kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Kode Barang)</label>
              <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" placeholder="Contoh: BRS-PRM-5KG" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <div className="flex gap-2">
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" placeholder="Scan atau generate otomatis" />
                <button type="button" onClick={generateBarcode} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap">
                  Buat Barcode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Barcode menggunakan react-barcode */}
        {formData.barcode && (
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center border border-dashed border-gray-300">
            <span className="text-sm text-gray-500 mb-2">Preview Cetak Barcode:</span>
            <Barcode value={formData.barcode} height={50} displayValue={true} />
          </div>
        )}

        {/* Harga & Stok */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Harga & Stok</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli / Modal (Rp)</label>
              <input type="number" name="purchase_price" required min="0" value={formData.purchase_price} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp) *</label>
              <input type="number" name="selling_price" required min="0" value={formData.selling_price} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal *</label>
              <input type="number" name="stock" required min="0" value={formData.stock} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batas Stok Menipis (Alert)</label>
              <input type="number" name="min_stock" min="0" value={formData.min_stock} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Menyimpan Data..." : "Simpan Barang"}
          </button>
        </div>
      </form>
    </div>
  );
}
