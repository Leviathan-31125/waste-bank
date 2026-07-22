import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-2"
        type="checkbox"
        className="drawer-toggle"
      />

      <div className="drawer-content flex min-h-screen flex-col bg-base-200">
        {/* Navbar Mobile */}
        <div className="navbar w-full bg-base-100 px-5 shadow-sm lg:hidden">
          <div className="flex w-full items-center justify-between">
            <label
              htmlFor="my-drawer-2"
              className="
                flex min-h-0 h-9 items-center justify-center
                rounded-lg bg-primary px-3
                text-sm font-bold text-white
                shadow-md
                transition-all duration-200
                hover:bg-primary/90
                active:scale-95
                cursor-pointer
              "
              aria-label="Buka menu navigasi"
            >
              MENU
            </label>

            <div className="text-sm font-bold text-base-content">
              Bank Sampah BMS2
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-5 sm:p-6">
          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-50">
        <label
          htmlFor="my-drawer-2"
          aria-label="Tutup menu navigasi"
          className="drawer-overlay"
        />

        <DashboardSidebar />
      </div>
    </div>
  )
}