import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { glassMode, wallpaperUrl } = useTheme();

  return (
    <div className="min-h-screen bg-background grain relative">
      {/* Glass Mode Wallpaper Background */}
      {glassMode && (
        <div className="fixed inset-0 z-0">
          {wallpaperUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${wallpaperUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-pink-900/30" />
          )}
          {/* Subtle overlay for better readability */}
          <div className="absolute inset-0 bg-background/40 dark:bg-background/60" />
        </div>
      )}

      <div className="relative z-10">
        <Sidebar onCollapse={setSidebarCollapsed} />
        <Header sidebarCollapsed={sidebarCollapsed} />
        
        <main 
          className={cn(
            "pt-16 min-h-screen transition-all duration-300",
            sidebarCollapsed ? "ml-[72px]" : "ml-64",
            "max-md:ml-0" // Mobile responsive - no sidebar margin
          )}
        >
          <motion.div
            key={window.location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
