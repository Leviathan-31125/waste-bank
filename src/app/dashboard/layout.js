import DashboardSidebar from '@/components/DashboardSidebar'
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
        <DashboardSidebar />
      </div>
    </div>
  )
}