'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

const SHELL_HIDDEN = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = SHELL_HIDDEN.includes(pathname);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
