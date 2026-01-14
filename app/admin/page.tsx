
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, LogOut, ChevronRight, MessageCircle, Package, Scissors } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/stores/currency.store";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { formatCurrency } = useCurrencyStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Mock data - in real app, this would come from API
  const todayStats = {
    appointments: 24,
    revenue: 1240,
    customers: 18,
    avgRating: 4.8,
  };

  const todayAppointments = [
    { id: 1, time: "9:00 AM", customer: "John Doe", service: "Haircut", status: "completed", barber: "Mike" },
    { id: 2, time: "10:00 AM", customer: "Jane Smith", service: "Beard Trim", status: "in-progress", barber: "Alex" },
    { id: 3, time: "11:00 AM", customer: "Bob Johnson", service: "Premium Package", status: "scheduled", barber: "Mike" },
    { id: 4, time: "2:00 PM", customer: "Alice Brown", service: "Haircut", status: "scheduled", barber: "Sarah" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
   
      <div className="flex h-screen bg-[#f8f9fa]">
        {/* Sidebar */}
        <AdminSidebar
          role="branch_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0",
          sidebarOpen ? "lg:ml-0" : "lg:ml-1"
        )}>
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role="branch_admin"
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <div>
                  <h1 className="text-2xl font-serif font-bold text-primary">Branch 01 Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage your branch operations</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrencySwitcher />
                <span className="text-sm text-muted-foreground hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex border-primary/10 text-primary hover:bg-primary/5">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto min-h-0 bg-[#f8f9fa]">
            <div className="h-full p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Appointments</CardTitle>
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{todayStats.appointments}</div>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      +12% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue</CardTitle>
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{formatCurrency(todayStats.revenue)}</div>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      +8% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Customers Served</CardTitle>
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Users className="h-4 w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{todayStats.customers}</div>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      +5% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Rating</CardTitle>
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{todayStats.avgRating}</div>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      +0.2 from yesterday
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Today's Appointments */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-serif">
                      <Clock className="w-5 h-5 text-secondary" />
                      Today's Appointments
                    </CardTitle>
                    <CardDescription>
                      Current schedule and status for today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-secondary/30 hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-secondary/5 transition-colors">
                              <span className="text-xs font-bold text-primary">{appointment.time.split(' ')[0]}</span>
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">{appointment.time.split(' ')[1]}</span>
                            </div>
                            <div>
                              <div className="font-bold text-primary">{appointment.customer}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Scissors className="w-3 h-3" />
                                {appointment.service}
                              </div>
                              <div className="text-xs text-secondary font-medium mt-0.5">with {appointment.barber}</div>
                            </div>
                          </div>
                          <Badge className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                            appointment.status === "completed" ? "bg-green-100 text-green-700" :
                            appointment.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-6 text-secondary hover:text-secondary hover:bg-secondary/5 font-bold text-xs uppercase tracking-widest">
                      View Full Schedule
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
                    <CardDescription>
                      Common administrative tasks and management
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <Button className="w-full justify-between h-14 px-6 rounded-xl border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group" variant="outline">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-secondary" />
                        <span className="font-medium">Manage Staff Schedule</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Button>
                    <Button className="w-full justify-between h-14 px-6 rounded-xl border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group" variant="outline">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-secondary" />
                        <span className="font-medium">View Branch Calendar</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Button>
                    <Button className="w-full justify-between h-14 px-6 rounded-xl border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group" variant="outline">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-secondary" />
                        <span className="font-medium">Financial Reports</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Button>
                    <Button className="w-full justify-between h-14 px-6 rounded-xl border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group" variant="outline">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-secondary" />
                        <span className="font-medium">Customer Feedback</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Button>
                    <Button className="w-full justify-between h-14 px-6 rounded-xl border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group" variant="outline">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-secondary" />
                        <span className="font-medium">Inventory Management</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="mt-8 border-none shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates and notifications from your branch
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50/50 border border-green-100 rounded-xl transition-all hover:bg-green-50">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">Appointment completed</p>
                        <p className="text-sm text-muted-foreground">John Doe's haircut finished at 9:30 AM</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">2 min ago</span>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl transition-all hover:bg-blue-50">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">New booking received</p>
                        <p className="text-sm text-muted-foreground">Premium package booked for tomorrow</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">15 min ago</span>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl transition-all hover:bg-amber-50">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">Staff schedule updated</p>
                        <p className="text-sm text-muted-foreground">Mike's shift changed for next week</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">1 hour ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    
  );
}
