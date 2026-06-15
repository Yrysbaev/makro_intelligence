'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users, DollarSign,
  Warehouse, Upload, Settings, ChevronLeft,
  ChevronRight, BarChart3, GitCompareArrows,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/comparison', label: '2025 vs 2026', icon: GitCompareArrows },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-[#0f172a] text-slate-300 transition-all duration-300 border-r border-slate-700/50 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center border-b border-slate-700/50 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shrink-0">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-sm font-bold text-white leading-tight block">Makro</span>
              <span className="text-xs text-blue-400 font-medium leading-tight block">Intelligence</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Main Menu
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-white' : 'text-slate-400')} size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-2">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-slate-800/60 px-3 py-3 mx-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">Admin User</p>
                <p className="truncate text-[10px] text-slate-500">admin@makro.com</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
