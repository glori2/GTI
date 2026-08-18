import { createClient } from "@/utils/supabase/server";

export default async function ProductsPage() {
  const supabase = createClient();
  
  // Mengambil data barang dari Supabase
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Barang</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + Tambah Barang
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error ? (
          <div className="p-6 text-red-500">Gagal memuat data: {error.message}</div>
        ) : products?.length === 0 ? (
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
                <th className="p-4 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-500">{product.sku || product.barcode || "-"}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">Rp {Number(product.selling_price).toLocaleString("id-ID")}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button className="text-red-600 hover:underline">Hapus</button>
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
