'use client';
import Link from 'next/link';

export default function DashboardSidebar() {
  
  // Fungsi untuk menutup drawer secara manual
  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById('my-drawer-2')
    if (drawerCheckbox) {
      drawerCheckbox.checked = false
    }
  }

  return (
    <ul className="menu p-4 w-65 min-h-full bg-base-100 text-base-content">
        <li><img src='/logo-bms2.png' className='max-w-52 w-full mx-auto' alt='Bank Sampah BMS2'/></li>
        
        <li className="menu-title">Monitor</li>
        <li><Link href="/dashboard" prefetch={false} onClick={closeDrawer}>Dashboard</Link></li>
        
        <li className="menu-title">Data Master</li>
        <li><Link href="/dashboard/customers" prefetch={false} onClick={closeDrawer}>List Nasabah</Link></li>
        <li><Link href="/dashboard/collectors" prefetch={false} onClick={closeDrawer}>List Pengepul</Link></li>
        <li><Link href="/dashboard/waste-types" prefetch={false} onClick={closeDrawer}>Jenis Sampah dan Harga</Link></li>
        <li><Link href="/dashboard/batch" prefetch={false} onClick={closeDrawer}>Batch</Link></li>
        
        <li className="menu-title">Transaksi</li>
        <li><Link href="/dashboard/deposit" prefetch={false} onClick={closeDrawer}>Deposit Sampah</Link></li>
        <li><Link href="/dashboard/withdraw" prefetch={false} onClick={closeDrawer}>Tarik Tunai Nasabah</Link></li>
        <li><Link href="/dashboard/sell" prefetch={false} onClick={closeDrawer}>Jual Sampah</Link></li>
        
        <li className="menu-title">Laporan</li>
        <li><Link href="/dashboard/report" prefetch={false} onClick={closeDrawer}>Riwayat Transaksi</Link></li>
        
        <div className="divider mt-auto"></div>
        <Link href="/api/auth/signout" prefetch={false}><button className='w-full bg-red-500 text-white py-2 px-3 rounded-md'>Logout</button></Link>
    </ul>
  )
}