'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',             label: 'Chat',    icon: '💬' },
  { href: '/estoque',      label: 'Estoque', icon: '📦' },
  { href: '/vendas',       label: 'Vendas',  icon: '💰' },
  { href: '/movimentacoes', label: 'Histórico', icon: '📋' },
  { href: '/ajuda',        label: 'Ajuda',   icon: '❓' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-wine-950 text-white min-h-screen p-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🍷</span>
        <div>
          <p className="font-bold text-sm leading-tight">GV Wine</p>
          <p className="text-xs text-wine-300 leading-tight">Gestão de Estoque</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${active
                  ? 'bg-wine-700 text-white font-medium'
                  : 'text-wine-200 hover:bg-wine-800 hover:text-white'
                }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <p className="text-xs text-wine-500 px-2 mt-4">GV Wine Web · v1.0</p>
    </aside>
  );
}
