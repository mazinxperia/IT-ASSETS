import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { glassMode, wallpaperUrl } = useTheme();

  return (
    <div className="min-h-screen bg-background grain relative">
      {glassMode && (
        <div className="fixed inset-0 z-0" style={{ willChange: 'auto' }}>
          {wallpaperUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${wallpaperUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-pink-900/30" />
          )}
          <div className="absolute inset-0 bg-background/40 dark:bg-background/60" />
        </div>
      )}

      <div className="relative z-10">
        <Sidebar onCollapse={setSidebarCollapsed} />
        <Header sidebarCollapsed={sidebarCollapsed} />

        <main
          className={cn(
            "pt-16 h-screen overflow-hidden transition-[margin] duration-200",
            sidebarCollapsed ? "ml-[72px]" : "ml-64",
            "max-md:ml-0"
          )}
        >
          {/* Replaced Framer Motion with plain CSS fade - much faster */}
          <div
            key={window.location.pathname}
            className="h-full p-4 sm:p-6 lg:p-8 overflow-y-auto page-fade-in"
            style={{ scrollBehavior: 'smooth' }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
