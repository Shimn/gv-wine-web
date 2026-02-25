'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',              label: 'Chat',     icon: '💬' },
  { href: '/estoque',       label: 'Estoque',  icon: '📦' },
  { href: '/vendas',        label: 'Vendas',   icon: '💰' },
  { href: '/movimentacoes', label: 'Histórico',icon: '📋' },
  { href: '/ajuda',         label: 'Ajuda',    icon: '❓' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-wine-950 text-white flex border-t border-wine-800 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2.5 text-[10px] transition-colors min-h-[3.5rem] justify-center
              ${active ? 'text-white' : 'text-wine-400'}`}
          >
            <span className="text-xl mb-0.5">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
