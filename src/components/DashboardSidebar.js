'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DashboardSidebar() {
  const [loading, setLoading] = useState(false);

  // Menutup sidebar setelah menu dipilih pada tampilan HP
  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById('my-drawer-2');

    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
    }
  };

  return (
    <ul className="menu min-h-full w-65 bg-base-100 p-4 text-base-content">
      <li>
        <img
          src="/logo-bms2.png"
          className="mx-auto w-full max-w-52"
          alt="Bank Sampah BMS2"
        />
      </li>

      <li className="menu-title !text-primary font-bold">
        Monitor
      </li>

      <li>
        <Link
          href="/dashboard"
          prefetch={false}
          onClick={closeDrawer}
        >
          Halaman Depan
        </Link>
      </li>

      <li className="menu-title !text-primary font-bold">
        Data Master
      </li>
      <li>
        <Link
          href="/dashboard/customers"
          prefetch={false}
          onClick={closeDrawer}
        >
          Nasabah
        </Link>
      </li>

      <li>
        <Link
          href="/dashboard/collectors"
          prefetch={false}
          onClick={closeDrawer}
        >
          Pengepul
        </Link>
      </li>

      <li>
        <Link
          href="/dashboard/waste-types"
          prefetch={false}
          onClick={closeDrawer}
        >
          Sampah &amp; Harga
        </Link>
      </li>

      <li>
        <Link
          href="/dashboard/batch"
          prefetch={false}
          onClick={closeDrawer}
        >
          Batch
        </Link>
      </li>

      <li className="menu-title !text-primary font-bold">
        Transaksi
      </li>
      <li>
        <Link
          href="/dashboard/deposit"
          prefetch={false}
          onClick={closeDrawer}
        >
          Deposit Sampah
        </Link>
      </li>

      <li>
        <Link
          href="/dashboard/withdraw"
          prefetch={false}
          onClick={closeDrawer}
        >
          Tarik Tunai Nasabah
        </Link>
      </li>

      <li>
        <Link
          href="/dashboard/sell"
          prefetch={false}
          onClick={closeDrawer}
        >
          Jual Sampah
        </Link>
      </li>

      <li className="menu-title !text-primary font-bold">
        Laporan
      </li>
      <li>
        <Link
          href="/dashboard/report"
          prefetch={false}
          onClick={closeDrawer}
        >
          Riwayat Transaksi
        </Link>
      </li>

      <div className="divider mt-auto"></div>

      <Link href="/api/auth/signout" prefetch={false}>
        <button
          type="button"
          className="w-full rounded-md bg-red-500 px-3 py-2 text-white"
          disabled={loading}
          onClick={() => setLoading(true)}
        >
          Logout
        </button>
      </Link>
    </ul>
  );
}