import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = createClient();

  // Ambil Data Transaksi
  const { data: sales } = await supabase
    .from("sales")
    .select("receipt_number, total_amount, payment_method, created_at")
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false });

  const omzetTotal = sales?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
  
  // Simulasi Engine Pajak: PPh Final UMKM (0.5%)
  // Sesuai aturan PP 20 Tahun 2026, jika omzet belum mencapai Rp500jt bagi OP, pajak bisa 0.
  // Untuk demo, kita sediakan dua skenario.
  const pphTerutang = omzetTotal * 0.005; // 0,5% dari omzet bruto

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan & Pajak UMKM</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
          ⬇ Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Modul Analitik Ringkas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold border-b pb-3 mb-4">Laporan Keuangan</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Transaksi Lunas</span>
              <span className="font-bold">{sales?.length || 0} Trx</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Omzet Bruto (Kotor)</span>
              <span className="font-bold text-green-600">Rp {omzetTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Modul Tax Engine */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
          <h2 className="text-lg font-semibold border-b pb-3 mb-4 text-orange-800">Tax Engine (PPh Final UMKM)</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Skema Pajak Aktif</span>
              <span className="font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded">PP No. 20 Tahun 2026 (0,5%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dasar Pengenaan Pajak (DPP)</span>
              <span className="font-bold">Rp {omzetTotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dashed">
              <span className="text-gray-800 font-medium">Estimasi PPh Terutang</span>
              <span className="font-bold text-orange-600 text-xl">Rp {pphTerutang.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            *Catatan: Bagi Wajib Pajak Orang Pribadi (WP OP), jika total peredaran bruto setahun belum melebihi fasilitas bebas pajak (Rp 500.000.000), maka estimasi PPh Final ini tidak perlu disetorkan. Aplikasi ini adalah alat bantu hitung, bukan pengganti pelaporan resmi DJP.
          </p>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b bg-gray-50">Riwayat Penjualan Terbaru</h2>
        {sales?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data penjualan.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">No. Transaksi</th>
                <th className="p-4">Metode Pembayaran</th>
                <th className="p-4 text-right">Nilai Transaksi (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales?.map((sale, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4">{new Date(sale.created_at).toLocaleString("id-ID")}</td>
                  <td className="p-4 font-mono text-gray-600">{sale.receipt_number}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      sale.payment_method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium">{(Number(sale.total_amount)).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
