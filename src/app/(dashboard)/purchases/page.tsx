import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const supabase = createClient();
  
  // Mengambil data pembelian beserta nama supplier
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stok Masuk (Pembelian)</h1>
          <p className="text-gray-500">Catat invoice dari supplier & lacak hutang toko.</p>
        </div>
        <Link href="/purchases/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + Catat Stok Masuk
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {purchases?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data pembelian barang masuk.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Status Bayar</th>
                <th className="p-4 text-right">Total Tagihan (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {purchases?.map((trx: any, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4">{new Date(trx.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="p-4 font-medium text-blue-600">{trx.invoice_number}</td>
                  <td className="p-4">{trx.suppliers?.name || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trx.payment_status === 'LUNAS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {trx.payment_status}
                    </span>
                    {trx.payment_status === 'HUTANG' && trx.due_date && (
                      <div className="text-xs text-red-500 mt-1">Tempo: {new Date(trx.due_date).toLocaleDateString("id-ID")}</div>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-800">
                    {Number(trx.total_amount).toLocaleString("id-ID")}
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
