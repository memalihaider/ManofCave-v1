'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Building,
  UserPlus,
  Bell,
  Image,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  Scissors,
  Package,
  ShoppingCart,
  Star,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  PieChart,
  Activity,
  Target,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Tag
} from 'lucide-react';

interface SidebarProps {
  role: 'branch_admin' | 'super_admin';
  onLogout: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?:string;
}

const branchAdminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Clients',
    href: '/admin/clients',
    icon: Users,
  },
  {
    title: 'Appointments',
    href: '/admin/appointments',
    icon: Calendar,
  },
  {
    title: 'Staff',
    href: '/admin/staff',
    icon: Users,
  },
  {
    title: 'Services',
    href: '/admin/services',
    icon: Scissors,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Tag,
  },
  {
    title: 'Feedbacks',
    href: '/admin/feedbacks',
    icon: Tag,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: Tag,
  },
  {
    title: 'Membership',
    href: '/admin/membership',
    icon: Award,
  },
  {
    title: 'Expenses',
    href: '/admin/expenses',
    icon: DollarSign,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  
  {
    title: 'Messages',
    href: '/admin/messages',
    icon: MessageCircle,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

const superAdminNavItems = [
  {
    title: 'Dashboard',
    href: '/super-admin',
    icon: BarChart3,
  },
  {
    title: 'Clients',
    href: '/super-admin/clients',
    icon: Users,
  },
  {
    title: 'Branches',
    href: '/super-admin/branches',
    icon: Building,
  },
  {
    title: 'Staff Management',
    href: '/super-admin/staff',
    icon: Users,
  },
  {
    title: 'Categories',
    href: '/super-admin/categories',
    icon: Tag,
  },
   {
    title: 'Services',
    href: '/super-admin/services',
    icon: Scissors,
  },
  {
    title: 'Products',
    href: '/super-admin/products',
    icon: Package,
  },
  {
    title: 'Membership',
    href: '/super-admin/membership',
    icon: Award,
  },
  {
    title: 'Users',
    href: '/super-admin/users',
    icon: Award,
  },
  {
    title: 'All Appointments',
    href: '/super-admin/appointments',
    icon: Calendar,
  },
   {
    title: 'All Orders',
    href: '/super-admin/orders',
    icon: Calendar,
  },
  {
    title: 'All Feedback',
    href: '/super-admin/feedback',
    icon: Calendar,
  },
  
//  {
//     title: 'Analytics',
//     href: '/super-admin/analytics',
//     icon: PieChart,
//   },
  {
    title: 'Expenses',
    href: '/super-admin/expenses',
    icon: DollarSign,
  },
  {
    title: 'Financial',
    href: '/super-admin/financial',
    icon: DollarSign,
  },
  
  {
    title: 'Mobile App',
    href: '/mobile-app',
    icon: Phone,
  },
  {
    title: 'CMS',
    href: '/cms',
    icon: FileText,
  },
  
  {
    title: 'Messages',
    href: '/super-admin/messages',
    icon: MessageCircle,
  },
  
  
  // {
  //   title: 'Settings',
  //   href: '/super-admin/settings',
  //   icon: Settings,
  // },
];

function SidebarContent({ role, onLogout, onToggle, isCollapsed = false }: Omit<SidebarProps, 'isOpen'> & { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const navItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;

  return (
    <div className="flex h-full flex-col  bg-primary border-r border-secondary/10">
      {/* Logo */}
      <div className="flex h-16 items-center  px-4 lg:px-6">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 mt-1 bg-secondary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 shadow-lg shadow-secondary/20">
              <Scissors className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-serif font-bold text-white tracking-tighter mt-1">
                MAN OF <span className="text-secondary">CAVE</span>
              </span>
            )}
          </Link>
        
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 h-full -mt-2">
        <div className="space-y-1 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
                    isCollapsed && "justify-center px-0",
                    isActive 
                      ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
                      : "text-gray-400 hover:text-secondary hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-secondary")} />
                  {!isCollapsed && <span className="text-sm">{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4  -mt-7 ml-7">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10",
            isCollapsed && "justify-center px-0"
          )}
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({ role, onLogout, isOpen = true, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "h-full shrink-0 bg-white border-r transition-all duration-300 ease-in-out",
        // Mobile: slide in/out completely (fixed positioning for mobile overlay)
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        // Desktop: normal flex item with appropriate width
        "lg:static lg:w-16",
        isOpen && "lg:w-64"
      )}>
        <SidebarContent role={role} onLogout={onLogout} onToggle={onToggle} isCollapsed={!isOpen} />
      </div>
    </>
  );
}

export function AdminMobileSidebar({ role, onLogout, isOpen, onToggle }: SidebarProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}