"use client";
import Link from 'next/link';
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b font-bold text-xl text-blue-600">
        GTI SmartPOS
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Dashboard</Link>
        <Link href="/pos" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium text-blue-600">Kasir (POS)</Link>
        <Link href="/products" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Barang</Link>
        <Link href="/reports" className="block px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">Laporan</Link>
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
