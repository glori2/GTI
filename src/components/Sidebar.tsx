"use client";
import Link from 'next/link';
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Ambil role dari tabel profiles
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) {
          setRole(data.role); // OWNER, ADMIN, KASIR, GUDANG, AKUNTANSI
        }
      }
    };
    fetchRole();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Cek Hak Akses
  const canAccessDashboard = ['OWNER', 'ADMIN'].includes(role || '');
  const canAccessPos = ['OWNER', 'KASIR'].includes(role || '');
  const canAccessProducts = ['OWNER', 'ADMIN', 'GUDANG'].includes(role || '');
  const canAccessReports = ['OWNER', 'ADMIN', 'AKUNTANSI'].includes(role || '');

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b font-bold text-xl text-blue-600">
        GTI SmartPOS
      </div>
      <div className="px-6 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-widest">
        Login sbg: {role || 'Memuat...'}
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {(canAccessDashboard || !role) && <Link href="/" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Dashboard</Link>}
        {(canAccessPos || !role) && <Link href="/pos" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium text-blue-600">Kasir (POS)</Link>}
        {(canAccessProducts || !role) && <Link href="/products" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Barang</Link>}
        {(canAccessReports || !role) && <Link href="/reports" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Laporan</Link>}
      </nav>
      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          className="w-full text-left block px-4 py-2 text-center text-red-600 hover:bg-red-50 rounded-lg font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
