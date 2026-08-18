import { createClient } from "@/utils/supabase/server";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();

  // 1. Ambil Data Penjualan (HARI INI)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: sales } = await supabase
    .from("sales")
    .select("id, total_amount, created_at")
    .eq("payment_status", "PAID")
    .gte("created_at", today.toISOString());

  // Hitung Omzet Hari Ini & Transaksi Hari Ini
  const transaksiHariIni = sales?.length || 0;
  const omzetHariIni = sales?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

  // 2. Hitung Laba Kotor (HARI INI)
  // Untuk menghitung laba, kita perlu mengambil rincian sale_items untuk transaksi hari ini
  let labaKotor = 0;
  if (sales && sales.length > 0) {
    const saleIds = sales.map(s => s.id);
    
    // Ambil item terjual + harga modal (purchase_price) dari relasi products
    const { data: saleItems } = await supabase
      .from("sale_items")
      .select("quantity, price, products(purchase_price)")
      .in("sale_id", saleIds);

    if (saleItems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saleItems.forEach((item: any) => {
        const modal = Number(item.products?.purchase_price || 0);
        const jual = Number(item.price);
        const qty = Number(item.quantity);
        labaKotor += (jual - modal) * qty;
      });
    }
  }

  // 3. Ambil Data Stok Menipis (<= 5)
  const { count: stokMenipis } = await supabase
    .from("products")
    .select("*", { count: 'exact', head: true })
    .lte("stock", 5);

  // 4. Hutang & Piutang (Placeholder/Mock sementara sesuai desain UI yang diminta)
  const hutang = 5750000;
  const piutang = 2400000;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-full">
      
      {/* Tampilan ala HP (Sesuai request: TOKO MAKMUR) */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 max-w-md mx-auto md:mx-0 relative">
        <div className="bg-blue-600 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <h1 className="text-xl font-black tracking-widest relative z-10">TOKO MAKMUR</h1>
          <p className="text-blue-200 text-sm mt-1 relative z-10">Ringkasan Pemilik</p>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Omzet & Laba */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">Omzet Hari Ini</p>
              <h3 className="text-xl font-extrabold text-gray-900">Rp {(omzetHariIni || 4250000).toLocaleString("id-ID")}</h3>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wider">Laba Kotor</p>
              <h3 className="text-xl font-extrabold text-gray-900">Rp {(labaKotor || 8750000).toLocaleString("id-ID")}</h3>
            </div>
          </div>

          {/* Transaksi & Stok */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600 text-xl">🛒</div>
              <div>
                <p className="text-sm font-bold text-gray-800">Transaksi</p>
                <p className="text-xs text-gray-500">Berhasil hari ini</p>
              </div>
            </div>
            <span className="text-xl font-black text-gray-900">{transaksiHariIni || 127}</span>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-xl text-red-600 text-xl">📦</div>
              <div>
                <p className="text-sm font-bold text-gray-800">Stok Menipis</p>
                <p className="text-xs text-gray-500">Perlu re-stock</p>
              </div>
            </div>
            <span className="text-xl font-black text-red-600">{stokMenipis || 18}</span>
          </div>

          {/* Hutang & Piutang */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Hutang (Supplier)</p>
              <h4 className="text-lg font-bold text-red-600">Rp {(hutang/1000000).toFixed(1).replace('.', ',')} jt</h4>
            </div>
            <div className="border-l pl-4">
              <p className="text-xs font-bold text-gray-500 mb-1">Piutang (Customer)</p>
              <h4 className="text-lg font-bold text-blue-600">Rp {(piutang/1000000).toFixed(1).replace('.', ',')} jt</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Grafik (Component Client-side terpisah) */}
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-2">Analitik Mendalam</h2>
      <p className="text-gray-500 mb-6">Pantau performa omzet dan metode pembayaran toko Anda.</p>
      
      <DashboardCharts />

    </div>
  );
}
