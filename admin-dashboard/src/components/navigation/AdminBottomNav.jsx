import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Package, Receipt, Settings } from 'lucide-react';

const items = [
  { to: '/', label: 'Beranda', Icon: LayoutDashboard, end: true },
  { to: '/produk', label: 'Produk', Icon: Package },
  { to: '/pesanan', label: 'Pesanan', Icon: Receipt },
  { to: '/pengaturan-umum', label: 'Pengaturan', Icon: Settings },
];

export default function AdminBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx('min-h-16 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold', isActive ? 'text-primary' : 'text-gray-400')}>
            {({ isActive }) => <><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /><span>{label}</span></>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
