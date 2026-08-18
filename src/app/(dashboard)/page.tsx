export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Ringkasan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Omzet Hari Ini</p>
          <h3 className="text-2xl font-bold text-green-600 mt-2">Rp 4.250.000</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">127</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Stok Menipis</p>
          <h3 className="text-2xl font-bold text-red-600 mt-2">18 Barang</h3>
        </div>
      </div>
    </div>
  );
}
