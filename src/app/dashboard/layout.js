import Link from 'next/link'

export default function DashboardLayout({ children }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        {/* Navbar Mobile */}
        <div className="w-full navbar bg-base-100 lg:hidden">
            <div className='w-full flex justify-between'>
                <div className="flex-none">
                    <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </label>
                </div>
                <div className="font-bold mr-3">Bank Sampah BMS2</div>
            </div>
        </div>
        
        {/* Page Content */}
        <div className="p-6">
            {children}
        </div>
      </div> 
      
      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-65 min-h-full bg-base-100 text-base-content">
            <li className="mb-4 text-2xl font-bold text-primary px-4">Bank Sampah BMS2</li>
            
            <li className="menu-title">Monitor</li>
            <li><Link href="/dashboard" prefetch={false}>Dashboard</Link></li>
            
            <li className="menu-title">Data Master</li>
            <li><Link href="/dashboard/customers" prefetch={false}>List Nasabah</Link></li>
            <li><Link href="/dashboard/collectors" prefetch={false}>List Pengepul</Link></li>
            <li><Link href="/dashboard/waste-types" prefetch={false}>Jenis Sampah dan Harga</Link></li>
            
            <li className="menu-title">Transaksi</li>
            <li><Link href="/dashboard/deposit" prefetch={false}>Deposit Sampah</Link></li>
            <li><Link href="/dashboard/withdraw" prefetch={false}>Tarik Tunai Nasabah</Link></li>
            <li><Link href="/dashboard/sell" prefetch={false}>Jual Sampah</Link></li>
            
            <li className="menu-title">Laporan</li>
            <li><Link href="/dashboard/report" prefetch={false}>Riwayat Transaksi</Link></li>
            
            <div className="divider mt-auto"></div>
            <Link href="/api/auth/signout" prefetch={false}><button className='w-full bg-red-500 text-white py-2 px-3 rounded-md'>Logout</button></Link>
        </ul>
      </div>
    </div>
  )
}