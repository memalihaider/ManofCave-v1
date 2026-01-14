'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Calendar, 
  BarChart3, 
  Filter,
  Download,
  RefreshCw,
  Building2,
  Clock,
  ShoppingCart,
  Percent,
  AlertCircle,
  Loader2,
  Eye,
  FileText,
  PieChart,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  Timestamp,
  where,
  orderBy,
  startAt,
  endAt 
} from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Firebase Interfaces
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  branchNames: string[];
  branches: string[];
  stock: number;
  totalStock: number;
  totalSold: number;
  revenue: number;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
  sku: string;
  rating: number;
  reviews: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  branchNames: string[];
  branches: string[];
  status: 'active' | 'inactive';
  popularity: string;
  revenue: number;
  totalBookings: number;
  createdAt: any;
  updatedAt: any;
}

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  totalAmount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: any;
  updatedAt: any;
}

interface ExpenseSummary {
  totalProductsCost: number;
  totalServicesCost: number;
  totalAppointmentsCost: number;
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  monthWiseData: Array<{
    month: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    totalCost: number;
    revenue: number;
    profit: number;
  }>;
  branchWiseData: Array<{
    branch: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    totalCost: number;
  }>;
  categoryWiseData: Array<{
    category: string;
    productsCost: number;
    servicesCost: number;
    totalCost: number;
  }>;
}

export default function SuperAdminExpensesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalProductsCost: 0,
    totalServicesCost: 0,
    totalAppointmentsCost: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    monthWiseData: [],
    branchWiseData: [],
    categoryWiseData: []
  });

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchServices(),
        fetchBookings()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          cost: data.cost || 0,
          category: data.category || '',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || '',
          branchNames: data.branchNames || [],
          branches: data.branches || [],
          stock: data.stock || 0,
          totalStock: data.totalStock || 0,
          totalSold: data.totalSold || 0,
          revenue: data.revenue || 0,
          status: data.status || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          sku: data.sku || '',
          rating: data.rating || 0,
          reviews: data.reviews || 0
        });
      });
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          duration: data.duration || 0,
          category: data.category || '',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || '',
          branchNames: data.branchNames || [],
          branches: data.branches || [],
          status: data.status || 'active',
          popularity: data.popularity || 'low',
          revenue: data.revenue || 0,
          totalBookings: data.totalBookings || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || '',
          servicePrice: data.servicePrice || 0,
          totalAmount: data.totalAmount || 0,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          date: data.date || '',
          time: data.time || '',
          status: data.status || 'pending',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Calculate expense summary
  useEffect(() => {
    if (products.length > 0 || services.length > 0 || bookings.length > 0) {
      calculateExpenseSummary();
    }
  }, [products, services, bookings, selectedBranch, selectedMonth, dateRange]);

  const calculateExpenseSummary = () => {
    // Filter data based on selected branch
    const filteredProducts = selectedBranch === 'all' 
      ? products 
      : products.filter(p => p.branchNames.includes(selectedBranch));
    
    const filteredServices = selectedBranch === 'all' 
      ? services 
      : services.filter(s => s.branchNames.includes(selectedBranch));
    
    const filteredBookings = selectedBranch === 'all' 
      ? bookings 
      : bookings.filter(b => {
          // Find service for this booking to get branch info
          const service = services.find(s => s.id === b.serviceId);
          return service?.branchNames.includes(selectedBranch);
        });

    // Calculate total products cost (cost * totalStock)
    const totalProductsCost = filteredProducts.reduce((sum, product) => 
      sum + (product.cost * product.totalStock), 0
    );

    // Calculate total services cost (considering services as fixed costs)
    const totalServicesCost = filteredServices.reduce((sum, service) => {
      // Add base cost for each service (you can add service cost field later)
      return sum + (service.price * 0.3); // Assuming 30% of price as cost
    }, 0);

    // Calculate total appointments cost (completed bookings)
    const completedBookings = filteredBookings.filter(b => b.status === 'completed');
    const totalAppointmentsCost = completedBookings.reduce((sum, booking) => 
      sum + (booking.totalAmount * 0.4), 0 // Assuming 40% of booking amount as cost
    );

    // Calculate revenue
    const totalRevenue = completedBookings.reduce((sum, booking) => 
      sum + booking.totalAmount, 0
    );

    // Calculate totals
    const totalExpenses = totalProductsCost + totalServicesCost + totalAppointmentsCost;
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Generate month-wise data
    const monthWiseData = generateMonthWiseData();
    const branchWiseData = generateBranchWiseData();
    const categoryWiseData = generateCategoryWiseData();

    setExpenseSummary({
      totalProductsCost,
      totalServicesCost,
      totalAppointmentsCost,
      totalExpenses,
      totalRevenue,
      totalProfit,
      profitMargin,
      monthWiseData,
      branchWiseData,
      categoryWiseData
    });
  };

  const generateMonthWiseData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0);
      
      // Filter bookings for this month
      const monthBookings = bookings.filter(b => {
        const bookingDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'completed';
      });
      
      // Calculate costs for this month
      const appointmentsCost = monthBookings.reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      const revenue = monthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      
      // For simplicity, distribute products and services costs evenly across months
      const productsCost = expenseSummary.totalProductsCost / 12;
      const servicesCost = expenseSummary.totalServicesCost / 12;
      const totalCost = productsCost + servicesCost + appointmentsCost;
      const profit = revenue - totalCost;
      
      return {
        month,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    });
  };

  const generateBranchWiseData = () => {
    const allBranches = Array.from(
      new Set([
        ...products.flatMap(p => p.branchNames),
        ...services.flatMap(s => s.branchNames)
      ])
    );

    return allBranches.map(branch => {
      const branchProducts = products.filter(p => p.branchNames.includes(branch));
      const branchServices = services.filter(s => s.branchNames.includes(branch));
      
      const productsCost = branchProducts.reduce((sum, p) => sum + (p.cost * p.totalStock), 0);
      const servicesCost = branchServices.reduce((sum, s) => sum + (s.price * 0.3), 0);
      
      // Find bookings for this branch
      const branchBookings = bookings.filter(b => {
        const service = services.find(s => s.id === b.serviceId);
        return service?.branchNames.includes(branch);
      });
      
      const appointmentsCost = branchBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      
      const totalCost = productsCost + servicesCost + appointmentsCost;
      
      return {
        branch,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2))
      };
    });
  };

  const generateCategoryWiseData = () => {
    const allCategories = Array.from(
      new Set([
        ...products.map(p => p.category),
        ...services.map(s => s.category)
      ])
    ).filter(Boolean);

    return allCategories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const categoryServices = services.filter(s => s.category === category);
      
      const productsCost = categoryProducts.reduce((sum, p) => sum + (p.cost * p.totalStock), 0);
      const servicesCost = categoryServices.reduce((sum, s) => sum + (s.price * 0.3), 0);
      const totalCost = productsCost + servicesCost;
      
      return {
        category,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2))
      };
    });
  };

  const getBranchOptions = () => {
    const allBranches = Array.from(
      new Set([
        ...products.flatMap(p => p.branchNames),
        ...services.flatMap(s => s.branchNames)
      ])
    );
    return allBranches;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const downloadExpenseReport = () => {
    let report = `
COMPREHENSIVE EXPENSE ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${dateRange.start} to ${dateRange.end}

OVERALL SUMMARY
Total Products Cost: ${formatCurrency(expenseSummary.totalProductsCost)}
Total Services Cost: ${formatCurrency(expenseSummary.totalServicesCost)}
Total Appointments Cost: ${formatCurrency(expenseSummary.totalAppointmentsCost)}
Total Expenses: ${formatCurrency(expenseSummary.totalExpenses)}
Total Revenue: ${formatCurrency(expenseSummary.totalRevenue)}
Total Profit: ${formatCurrency(expenseSummary.totalProfit)}
Profit Margin: ${expenseSummary.profitMargin.toFixed(2)}%

BRANCH-WISE EXPENSES
${expenseSummary.branchWiseData.map(b => 
  `${b.branch}: Products: ${formatCurrency(b.productsCost)}, Services: ${formatCurrency(b.servicesCost)}, Appointments: ${formatCurrency(b.appointmentsCost)}, Total: ${formatCurrency(b.totalCost)}`
).join('\n')}

MONTH-WISE EXPENSES (${new Date().getFullYear()})
${expenseSummary.monthWiseData.map(m => 
  `${m.month}: Products: ${formatCurrency(m.productsCost)}, Services: ${formatCurrency(m.servicesCost)}, Appointments: ${formatCurrency(m.appointmentsCost)}, Revenue: ${formatCurrency(m.revenue)}, Profit: ${formatCurrency(m.profit)}`
).join('\n')}

CATEGORY-WISE EXPENSES
${expenseSummary.categoryWiseData.map(c => 
  `${c.category}: Products: ${formatCurrency(c.productsCost)}, Services: ${formatCurrency(c.servicesCost)}, Total: ${formatCurrency(c.totalCost)}`
).join('\n')}
    `;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-[#f8f9fa]">
        {/* Sidebar */}
        <AdminSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role="super_admin"
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <div>
                  <h1 className="text-2xl font-serif font-bold text-primary">Expense Analysis Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Track and analyze expenses across products, services, and appointments</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="flex-1 flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-48 rounded-lg border-gray-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <SelectValue placeholder="Select Branch" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {getBranchOptions().map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-48 rounded-lg border-gray-200">
                        <div className="flex items-center gap-2"/>
                          <Calendar className="w-4 h-4" />
                          <SelectValue placeholder="Select Month" />
                      
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                          <SelectItem key={month} value={month}>{month} 2026</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="rounded-lg border-gray-200 w-40"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="rounded-lg border-gray-200 w-40"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={fetchAllData}
                    variant="outline"
                    className="border-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button
                    onClick={downloadExpenseReport}
                    variant="outline"
                    className="border-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 rounded-lg">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="data">Raw Data</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Expenses</p>
                            <p className="text-3xl font-serif font-bold text-primary">
                              {formatCurrency(expenseSummary.totalExpenses)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Products, Services & Appointments</p>
                          </div>
                          <DollarSign className="w-12 h-12 text-secondary/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Products Cost</p>
                            <p className="text-3xl font-serif font-bold text-blue-600">
                              {formatCurrency(expenseSummary.totalProductsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {products.length} active products
                            </p>
                          </div>
                          <Package className="w-12 h-12 text-blue-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Services Cost</p>
                            <p className="text-3xl font-serif font-bold text-green-600">
                              {formatCurrency(expenseSummary.totalServicesCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {services.length} active services
                            </p>
                          </div>
                          <ShoppingCart className="w-12 h-12 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Appointments Cost</p>
                            <p className="text-3xl font-serif font-bold text-purple-600">
                              {formatCurrency(expenseSummary.totalAppointmentsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bookings.filter(b => b.status === 'completed').length} completed bookings
                            </p>
                          </div>
                          <Calendar className="w-12 h-12 text-purple-500/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Profit Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-secondary" />
                          Revenue & Profit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(expenseSummary.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Profit</span>
                            <span className={cn(
                              "text-lg font-bold",
                              expenseSummary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(expenseSummary.totalProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Profit Margin</span>
                            <span className={cn(
                              "text-lg font-bold",
                              expenseSummary.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {expenseSummary.profitMargin.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expense Distribution Pie Chart */}
                    <Card className="border-none shadow-sm rounded-xl lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-secondary" />
                          Expense Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={[
                                  { name: 'Products', value: expenseSummary.totalProductsCost },
                                  { name: 'Services', value: expenseSummary.totalServicesCost },
                                  { name: 'Appointments', value: expenseSummary.totalAppointmentsCost }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                               label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Trend Chart */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-secondary" />
                        Monthly Expense Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={expenseSummary.monthWiseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="productsCost" fill="#0088FE" name="Products Cost" />
                            <Bar dataKey="servicesCost" fill="#00C49F" name="Services Cost" />
                            <Bar dataKey="appointmentsCost" fill="#FFBB28" name="Appointments Cost" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Detailed Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                  {/* Branch-wise Analysis */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-secondary" />
                        Branch-wise Expense Analysis
                      </CardTitle>
                      <CardDescription>
                        Detailed breakdown of expenses by branch
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Products Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Services Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Appointments Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">% of Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenseSummary.branchWiseData.map((branchData, index) => (
                              <tr key={branchData.branch} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{branchData.branch}</td>
                                <td className="px-4 py-3 text-blue-600 font-medium">
                                  {formatCurrency(branchData.productsCost)}
                                </td>
                                <td className="px-4 py-3 text-green-600 font-medium">
                                  {formatCurrency(branchData.servicesCost)}
                                </td>
                                <td className="px-4 py-3 text-purple-600 font-medium">
                                  {formatCurrency(branchData.appointmentsCost)}
                                </td>
                                <td className="px-4 py-3 font-bold">
                                  {formatCurrency(branchData.totalCost)}
                                </td>
                                <td className="px-4 py-3">
                                  {expenseSummary.totalExpenses > 0 
                                    ? ((branchData.totalCost / expenseSummary.totalExpenses) * 100).toFixed(1)
                                    : '0.0'
                                  }%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-bold">
                            <tr>
                              <td className="px-4 py-3">Total</td>
                              <td className="px-4 py-3 text-blue-600">
                                {formatCurrency(expenseSummary.totalProductsCost)}
                              </td>
                              <td className="px-4 py-3 text-green-600">
                                {formatCurrency(expenseSummary.totalServicesCost)}
                              </td>
                              <td className="px-4 py-3 text-purple-600">
                                {formatCurrency(expenseSummary.totalAppointmentsCost)}
                              </td>
                              <td className="px-4 py-3">
                                {formatCurrency(expenseSummary.totalExpenses)}
                              </td>
                              <td className="px-4 py-3">100%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category-wise Analysis */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-secondary" />
                        Category-wise Expense Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={expenseSummary.categoryWiseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="productsCost" fill="#0088FE" name="Products Cost" />
                            <Bar dataKey="servicesCost" fill="#00C49F" name="Services Cost" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Detailed Analysis */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        Monthly Profit & Loss Statement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Month</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Products Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Services Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Appointments Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Profit</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Margin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenseSummary.monthWiseData.map((monthData) => (
                              <tr key={monthData.month} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{monthData.month}</td>
                                <td className="px-4 py-3">{formatCurrency(monthData.productsCost)}</td>
                                <td className="px-4 py-3">{formatCurrency(monthData.servicesCost)}</td>
                                <td className="px-4 py-3">{formatCurrency(monthData.appointmentsCost)}</td>
                                <td className="px-4 py-3 font-bold">{formatCurrency(monthData.totalCost)}</td>
                                <td className="px-4 py-3 text-green-600 font-medium">
                                  {formatCurrency(monthData.revenue)}
                                </td>
                                <td className={cn(
                                  "px-4 py-3 font-bold",
                                  monthData.profit >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {formatCurrency(monthData.profit)}
                                </td>
                                <td className={cn(
                                  "px-4 py-3",
                                  monthData.profit >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {monthData.revenue > 0 ? ((monthData.profit / monthData.revenue) * 100).toFixed(1) : '0.0'}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Raw Data Tab */}
                <TabsContent value="data" className="space-y-6">
                  {/* Products Data */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Package className="w-5 h-5 text-secondary" />
                        Products Inventory & Cost ({products.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Cost per Unit</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Stock</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Selling Price</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branches</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{product.name}</td>
                                <td className="px-4 py-3">{product.category}</td>
                                <td className="px-4 py-3">{formatCurrency(product.cost)}</td>
                                <td className="px-4 py-3">{product.totalStock}</td>
                                <td className="px-4 py-3 font-bold text-blue-600">
                                  {formatCurrency(product.cost * product.totalStock)}
                                </td>
                                <td className="px-4 py-3 text-green-600">
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {product.branchNames.map(branch => (
                                      <Badge key={branch} variant="outline" className="text-xs">
                                        {branch}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services Data */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-secondary" />
                        Services & Estimated Costs ({services.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Service</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Duration</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Selling Price</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Estimated Cost (30%)</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Bookings</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branches</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {services.map((service) => (
                              <tr key={service.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{service.name}</td>
                                <td className="px-4 py-3">{service.category}</td>
                                <td className="px-4 py-3">{service.duration} min</td>
                                <td className="px-4 py-3 text-green-600">
                                  {formatCurrency(service.price)}
                                </td>
                                <td className="px-4 py-3 font-bold text-green-600">
                                  {formatCurrency(service.price * 0.3)}
                                </td>
                                <td className="px-4 py-3">{service.totalBookings}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {service.branchNames.map(branch => (
                                      <Badge key={branch} variant="outline" className="text-xs">
                                        {branch}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bookings Data */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        Bookings & Appointment Costs ({bookings.length})
                      </CardTitle>
                      <CardDescription>
                        Showing completed bookings for appointment cost calculation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Service</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Customer</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Estimated Cost (40%)</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {bookings
                              .filter(b => b.status === 'completed')
                              .slice(0, 20) // Limit to 20 for performance
                              .map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium">{booking.serviceName}</td>
                                  <td className="px-4 py-3">{booking.customerName}</td>
                                  <td className="px-4 py-3">{booking.date}</td>
                                  <td className="px-4 py-3">
                                    <Badge className={cn(
                                      "rounded-full",
                                      booking.status === 'completed' ? "bg-green-100 text-green-700" :
                                      booking.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-700"
                                    )}>
                                      {booking.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-green-600 font-medium">
                                    {formatCurrency(booking.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-purple-600 font-medium">
                                    {formatCurrency(booking.totalAmount * 0.4)}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-green-600">
                                    {formatCurrency(booking.totalAmount * 0.6)}
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}