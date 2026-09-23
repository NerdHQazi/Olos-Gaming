'use client';
import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import AppFooter from './AppFooter';

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070E1A] text-white flex">
      {/* Desktop sidebar - static column */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar - slide-in drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">
            <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-black/60 backdrop-blur-sm"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <AppTopbar title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
