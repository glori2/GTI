"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const dataOmzet = [
  { name: "Senin", omzet: 2100000 },
  { name: "Selasa", omzet: 3400000 },
  { name: "Rabu", omzet: 1800000 },
  { name: "Kamis", omzet: 4250000 },
  { name: "Jumat", omzet: 3900000 },
  { name: "Sabtu", omzet: 5800000 },
  { name: "Minggu", omzet: 6100000 },
];

const dataMetode = [
  { name: "CASH", qty: 85 },
  { name: "QRIS", qty: 42 },
];

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Grafik Omzet Mingguan */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">Grafik Omzet 7 Hari Terakhir</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataOmzet} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Rp ${val / 1000000}M`} dx={-10} />
              <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
              <Line type="monotone" dataKey="omzet" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik Metode Pembayaran */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">Metode Pembayaran (Transaksi)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataMetode} margin={{ top: 5, right: 20, left: 20, bottom: 5 }} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
              <Tooltip cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="qty" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
