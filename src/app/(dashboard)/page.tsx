import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  // Ambil Data Transaksi
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("payment_status", "PAID");

  // Hitung Omzet dan Total Transaksi
  const totalTransaksi = sales?.length || 0;
  const omzetTotal = sales?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

  // Ambil Data Stok Menipis (Misal batas menipis < 5, karena min_stock bisa bervariasi)
  // Untuk query lebih optimal: .lte("stock", 5)
  const { count: stokMenipis } = await supabase
    .from("products")
    .select("*", { count: 'exact', head: true })
    .lte("stock", 5);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Ringkasan</h1>
      
      {salesError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          Gagal memuat data transaksi: {salesError.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Omzet Keseluruhan</p>
          <h3 className="text-3xl font-bold text-green-600 mt-2">Rp {omzetTotal.toLocaleString("id-ID")}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalTransaksi}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Stok Menipis ({"<"} 5 item)</p>
          <h3 className="text-3xl font-bold text-red-600 mt-2">{stokMenipis || 0} Barang</h3>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Selamat Datang di GTI SmartPOS!</h3>
        <p className="text-blue-600">Sistem Kasir dan Manajemen UMKM Anda sudah terhubung secara *real-time* ke database. Silakan gunakan menu di sebelah kiri untuk menavigasi aplikasi.</p>
      </div>
    </div>
  );
}
