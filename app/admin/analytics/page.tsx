'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/stores/currency.store";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";

export default function AdminAnalytics() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { formatCurrency } = useCurrencyStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [timeRange, setTimeRange] = useState('30d');

  // Mock analytics data
  const analytics = {
    overview: {
      totalRevenue: 45280,
      totalBookings: 1247,
      totalCustomers: 892,
      avgRating: 4.7,
      revenueChange: 12.5,
      bookingsChange: 8.3,
      customersChange: 15.2,
      ratingChange: 0.2
    },
    revenueByService: [
      { service: "Classic Haircut", revenue: 12450, bookings: 355, percentage: 27.5 },
      { service: "Beard Trim", revenue: 8920, bookings: 356, percentage: 19.7 },
      { service: "Hair Color", revenue: 15680, bookings: 184, percentage: 34.6 },
      { service: "Hot Towel Shave", revenue: 8230, bookings: 183, percentage: 18.2 }
    ],
    revenueByDay: [
      { day: "Mon", revenue: 5200 },
      { day: "Tue", revenue: 4800 },
      { day: "Wed", revenue: 6100 },
      { day: "Thu", revenue: 5800 },
      { day: "Fri", revenue: 7200 },
      { day: "Sat", revenue: 8900 },
      { day: "Sun", revenue: 7280 }
    ],
    topStaff: [
      { name: "Mike Johnson", revenue: 18250, bookings: 428, rating: 4.9 },
      { name: "Sarah Chen", revenue: 15680, bookings: 312, rating: 4.8 },
      { name: "Alex Rodriguez", revenue: 11350, bookings: 267, rating: 4.7 }
    ],
    customerRetention: {
      newCustomers: 156,
      returningCustomers: 736,
      retentionRate: 82.5
    }
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar role="branch_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-1"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar role="branch_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                  <p className="text-sm text-gray-600">Track your business performance</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrencySwitcher />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(analytics.overview.revenueChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.totalBookings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(analytics.overview.bookingsChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.totalCustomers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(analytics.overview.customersChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.avgRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(analytics.overview.ratingChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue by Service */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Service</CardTitle>
                    <CardDescription>Top performing services this period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.revenueByService.map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{service.service}</span>
                              <span className="text-sm text-gray-600">{formatCurrency(service.revenue)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-secondary h-2 rounded-full"
                                style={{ width: `${service.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{service.bookings} bookings</span>
                              <span>{service.percentage}% of total</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue by Day */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Day</CardTitle>
                    <CardDescription>Daily revenue for the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.revenueByDay.map((day, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-12">{day.day}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{formatCurrency(day.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Staff Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Staff Performance</CardTitle>
                    <CardDescription>Highest earning staff members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topStaff.map((staff, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-semibold">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-sm text-gray-600">{staff.bookings} bookings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(staff.revenue)}</p>
                            <p className="text-sm text-gray-600">★ {staff.rating}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Retention */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Retention</CardTitle>
                    <CardDescription>Customer loyalty metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-secondary mb-2">
                          {analytics.customerRetention.retentionRate}%
                        </div>
                        <p className="text-sm text-gray-600">Retention Rate</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analytics.customerRetention.returningCustomers}
                          </div>
                          <p className="text-sm text-gray-600">Returning</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {analytics.customerRetention.newCustomers}
                          </div>
                          <p className="text-sm text-gray-600">New Customers</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>New vs Returning</span>
                          <span>{Math.round((analytics.customerRetention.newCustomers / (analytics.customerRetention.newCustomers + analytics.customerRetention.returningCustomers)) * 100)}% new</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(analytics.customerRetention.newCustomers / (analytics.customerRetention.newCustomers + analytics.customerRetention.returningCustomers)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}