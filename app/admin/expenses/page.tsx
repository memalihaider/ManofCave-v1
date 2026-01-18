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
  TrendingUp as TrendingUpIcon,
  Plus,
  X,
  Save,
  Trash2,
  Edit
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
  endAt,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
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

// Firebase Interfaces - Add Manual Expense Interface
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

// NEW: Manual Expense Interface
interface ManualExpense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  branch: string;
  date: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  receiptUrl?: string;
  notes?: string;
}

interface ExpenseSummary {
  totalProductsCost: number;
  totalServicesCost: number;
  totalAppointmentsCost: number;
  totalManualExpenses: number; // NEW
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  monthWiseData: Array<{
    month: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    manualExpenses: number; // NEW
    totalCost: number;
    revenue: number;
    profit: number;
  }>;
  branchWiseData: Array<{
    branch: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    manualExpenses: number; // NEW
    totalCost: number;
  }>;
  categoryWiseData: Array<{
    category: string;
    productsCost: number;
    servicesCost: number;
    totalCost: number;
  }>;
  manualExpensesByCategory: Array<{ // NEW
    category: string;
    amount: number;
  }>;
}

// NEW: Expense Categories
const EXPENSE_CATEGORIES = [
  'Salaries',
  'Rent',
  'Utilities',
  'Marketing',
  'Supplies',
  'Maintenance',
  'Travel',
  'Training',
  'Software',
  'Hardware',
  'Office Supplies',
  'Insurance',
  'Taxes',
  'Other'
];

// NEW: Payment Methods
const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Digital Wallet',
  'Other'
];

export default function SuperAdminExpensesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([]); // NEW
  const [loading, setLoading] = useState(true);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalProductsCost: 0,
    totalServicesCost: 0,
    totalAppointmentsCost: 0,
    totalManualExpenses: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    monthWiseData: [],
    branchWiseData: [],
    categoryWiseData: [],
    manualExpensesByCategory: []
  });

  // NEW: Manual Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ManualExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: 0,
    category: EXPENSE_CATEGORIES[0],
    branch: user?.role === 'admin' && user?.branchId ? user.branchName : 'all',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: PAYMENT_METHODS[0],
    status: 'paid' as 'paid' | 'pending' | 'cancelled',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState(user?.role === 'admin' && user?.branchId ? user.branchName : 'all');
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

  // Fetch all data with branch filtering
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchServices(),
        fetchBookings(),
        fetchManualExpenses() // NEW
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch Manual Expenses with BRANCH FILTERING
  const fetchManualExpenses = async () => {
    try {
      const expensesRef = collection(db, 'manualExpenses');
      
      let q;
      
      // 🔥 BRANCH FILTERING FOR BRANCH ADMIN
      if (user?.role === 'admin' && user?.branchName) {
        // Branch admin sirf apni branch ke expenses dekhe
        q = query(
          expensesRef, 
          where('branch', '==', user.branchName),
          orderBy('createdAt', 'desc')
        );
        console.log(`🏢 Branch Admin: Showing expenses only for ${user.branchName}`);
      } else {
        // Super admin - sab expenses dekhe
        q = query(expensesRef, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const expensesData: ManualExpense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          amount: data.amount || 0,
          category: data.category || EXPENSE_CATEGORIES[0],
          branch: data.branch || '',
          date: data.date || new Date().toISOString().split('T')[0],
          paymentMethod: data.paymentMethod || PAYMENT_METHODS[0],
          status: data.status || 'paid',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || '',
          receiptUrl: data.receiptUrl || '',
          notes: data.notes || ''
        });
      });
      
      setManualExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching manual expenses:', error);
    }
  };

  // Fetch products with branch filtering
  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      let q;
      
      if (user?.role === 'admin' && user?.branchName) {
        // Branch admin ke liye sirf us branch ke products
        q = query(
          productsRef, 
          where('branchNames', 'array-contains', user.branchName),
          where('status', '==', 'active')
        );
      } else {
        q = query(productsRef, where('status', '==', 'active'));
      }
      
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

  // Fetch services with branch filtering
  const fetchServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      let q;
      
      if (user?.role === 'admin' && user?.branchName) {
        // Branch admin ke liye sirf us branch ke services
        q = query(
          servicesRef, 
          where('branchNames', 'array-contains', user.branchName),
          where('status', '==', 'active')
        );
      } else {
        q = query(servicesRef, where('status', '==', 'active'));
      }
      
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

  // Fetch bookings with branch filtering
  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      let q = query(bookingsRef, orderBy('createdAt', 'desc'));
      
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
      
      // Client-side filtering for branch admin
      let filteredBookings = bookingsData;
      if (user?.role === 'admin' && user?.branchName) {
        // Get services for the branch
        const branchServices = services.filter(s => 
          s.branchNames.includes(user.branchName as string)
        );
        const branchServiceIds = branchServices.map(s => s.id);
        
        // Filter bookings for those services
        filteredBookings = bookingsData.filter(b => 
          branchServiceIds.includes(b.serviceId)
        );
      }
      
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // NEW: Manual Expense Functions with AUTO BRANCH SELECTION
  const openExpenseModal = (expense?: ManualExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        branch: expense.branch || (user?.role === 'admin' && user?.branchName ? user.branchName : 'all'),
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        status: expense.status,
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      // 🔥 AUTO SELECT USER'S BRANCH FOR BRANCH ADMIN
      setExpenseForm({
        title: '',
        description: '',
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
        branch: user?.role === 'admin' && user?.branchName ? user.branchName : 'all',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: PAYMENT_METHODS[0],
        status: 'paid',
        notes: ''
      });
    }
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setSubmitting(false);
  };

  const handleExpenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // 🔥 Branch admin ke liye branch change na karne de
    if (name === 'branch' && user?.role === 'admin' && user?.branchName) {
      alert('You cannot change the branch. Expense will be added to your assigned branch.');
      return;
    }
    
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitManualExpense = async () => {
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      alert('Please enter a valid title and amount');
      return;
    }

    setSubmitting(true);
    try {
      // 🔥 Ensure branch is set correctly
      let finalBranch = expenseForm.branch;
      if (user?.role === 'admin' && user?.branchName) {
        finalBranch = user.branchName; // Force branch admin's branch
      }

      const expenseData = {
        title: expenseForm.title.trim(),
        description: expenseForm.description.trim(),
        amount: expenseForm.amount,
        category: expenseForm.category,
        branch: finalBranch,
        date: expenseForm.date,
        paymentMethod: expenseForm.paymentMethod,
        status: expenseForm.status,
        notes: expenseForm.notes.trim(),
        createdBy: user?.email || (user?.role === 'admin' ? 'branch_admin' : 'super_admin'),
        createdAt: editingExpense ? editingExpense.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingExpense) {
        // Update existing expense
        await updateDoc(doc(db, 'manualExpenses', editingExpense.id), expenseData);
      } else {
        // Add new expense
        await addDoc(collection(db, 'manualExpenses'), expenseData);
      }

      // Refresh data
      await fetchManualExpenses();
      closeExpenseModal();
      alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManualExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteDoc(doc(db, 'manualExpenses', id));
        await fetchManualExpenses();
        alert('Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense.');
      }
    }
  };

  // Calculate expense summary
  useEffect(() => {
    if (products.length > 0 || services.length > 0 || bookings.length > 0 || manualExpenses.length > 0) {
      calculateExpenseSummary();
    }
  }, [products, services, bookings, manualExpenses, selectedBranch, selectedMonth, dateRange]);

  const calculateExpenseSummary = () => {
    // Filter data based on selected branch
    const filteredProducts = selectedBranch === 'all' 
      ? products 
      : products.filter(p => p.branchNames.includes(selectedBranch as string));
    
    const filteredServices = selectedBranch === 'all' 
      ? services 
      : services.filter(s => s.branchNames.includes(selectedBranch as string));
    
    const filteredBookings = selectedBranch === 'all' 
      ? bookings 
      : bookings.filter(b => {
          const service = services.find(s => s.id === b.serviceId);
          return service?.branchNames.includes(selectedBranch as string);
        });

    // NEW: Filter manual expenses
    const filteredManualExpenses = selectedBranch === 'all'
      ? manualExpenses
      : manualExpenses.filter(e => e.branch === selectedBranch);

    // Calculate total products cost (cost * totalStock)
    const totalProductsCost = filteredProducts.reduce((sum, product) => 
      sum + (product.cost * product.totalStock), 0
    );

    // Calculate total services cost (considering services as fixed costs)
    const totalServicesCost = filteredServices.reduce((sum, service) => {
      return sum + (service.price * 0.3); // Assuming 30% of price as cost
    }, 0);

    // Calculate total appointments cost (completed bookings)
    const completedBookings = filteredBookings.filter(b => b.status === 'completed');
    const totalAppointmentsCost = completedBookings.reduce((sum, booking) => 
      sum + (booking.totalAmount * 0.4), 0 // Assuming 40% of booking amount as cost
    );

    // NEW: Calculate total manual expenses
    const totalManualExpenses = filteredManualExpenses.reduce((sum, expense) => 
      sum + expense.amount, 0
    );

    // Calculate revenue
    const totalRevenue = completedBookings.reduce((sum, booking) => 
      sum + booking.totalAmount, 0
    );

    // Calculate totals
    const totalExpenses = totalProductsCost + totalServicesCost + totalAppointmentsCost + totalManualExpenses;
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Generate month-wise data
    const monthWiseData = generateMonthWiseData();
    const branchWiseData = generateBranchWiseData();
    const categoryWiseData = generateCategoryWiseData();
    const manualExpensesByCategory = generateManualExpensesByCategory();

    setExpenseSummary({
      totalProductsCost,
      totalServicesCost,
      totalAppointmentsCost,
      totalManualExpenses,
      totalExpenses,
      totalRevenue,
      totalProfit,
      profitMargin,
      monthWiseData,
      branchWiseData,
      categoryWiseData,
      manualExpensesByCategory
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
      
      // Filter manual expenses for this month
      const monthManualExpenses = manualExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      // Calculate costs for this month
      const appointmentsCost = monthBookings.reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      const manualExpensesCost = monthManualExpenses.reduce((sum, e) => sum + e.amount, 0);
      const revenue = monthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      
      // For simplicity, distribute products and services costs evenly across months
      const productsCost = expenseSummary.totalProductsCost / 12;
      const servicesCost = expenseSummary.totalServicesCost / 12;
      const totalCost = productsCost + servicesCost + appointmentsCost + manualExpensesCost;
      const profit = revenue - totalCost;
      
      return {
        month,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        manualExpenses: parseFloat(manualExpensesCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    });
  };

  const generateBranchWiseData = () => {
    // 🔥 For branch admin, only show their branch
    let allBranches;
    if (user?.role === 'admin' && user?.branchName) {
      allBranches = [user.branchName];
    } else {
      allBranches = Array.from(
        new Set([
          ...products.flatMap(p => p.branchNames),
          ...services.flatMap(s => s.branchNames),
          ...manualExpenses.map(e => e.branch).filter(Boolean)
        ])
      );
    }

    return allBranches.map(branch => {
      const branchProducts = products.filter(p => p.branchNames.includes(branch));
      const branchServices = services.filter(s => s.branchNames.includes(branch));
      const branchManualExpenses = manualExpenses.filter(e => e.branch === branch);
      
      const productsCost = branchProducts.reduce((sum, p) => sum + (p.cost * p.totalStock), 0);
      const servicesCost = branchServices.reduce((sum, s) => sum + (s.price * 0.3), 0);
      const manualExpensesCost = branchManualExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Find bookings for this branch
      const branchBookings = bookings.filter(b => {
        const service = services.find(s => s.id === b.serviceId);
        return service?.branchNames.includes(branch);
      });
      
      const appointmentsCost = branchBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      
      const totalCost = productsCost + servicesCost + appointmentsCost + manualExpensesCost;
      
      return {
        branch,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        manualExpenses: parseFloat(manualExpensesCost.toFixed(2)),
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

  // NEW: Generate manual expenses by category
  const generateManualExpensesByCategory = () => {
    const categories: { [key: string]: number } = {};
    
    manualExpenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0;
      }
      categories[expense.category] += expense.amount;
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));
  };

  const getBranchOptions = () => {
    // 🔥 For branch admin, only show their branch
    if (user?.role === 'admin' && user?.branchName) {
      return [user.branchName];
    }
    
    const allBranches = Array.from(
      new Set([
        ...products.flatMap(p => p.branchNames),
        ...services.flatMap(s => s.branchNames),
        ...manualExpenses.map(e => e.branch).filter(Boolean)
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
User: ${user?.name || user?.email}
Role: ${user?.role}
${user?.role === 'admin' ? `Branch: ${user.branchName}` : ''}
Period: ${dateRange.start} to ${dateRange.end}

OVERALL SUMMARY
Total Products Cost: ${formatCurrency(expenseSummary.totalProductsCost)}
Total Services Cost: ${formatCurrency(expenseSummary.totalServicesCost)}
Total Appointments Cost: ${formatCurrency(expenseSummary.totalAppointmentsCost)}
Total Manual Expenses: ${formatCurrency(expenseSummary.totalManualExpenses)}
Total Expenses: ${formatCurrency(expenseSummary.totalExpenses)}
Total Revenue: ${formatCurrency(expenseSummary.totalRevenue)}
Total Profit: ${formatCurrency(expenseSummary.totalProfit)}
Profit Margin: ${expenseSummary.profitMargin.toFixed(2)}%

MANUAL EXPENSES BY CATEGORY
${expenseSummary.manualExpensesByCategory.map(e => 
  `${e.category}: ${formatCurrency(e.amount)}`
).join('\n')}

BRANCH-WISE EXPENSES
${expenseSummary.branchWiseData.map(b => 
  `${b.branch}: 
    Products: ${formatCurrency(b.productsCost)}
    Services: ${formatCurrency(b.servicesCost)}
    Appointments: ${formatCurrency(b.appointmentsCost)}
    Manual: ${formatCurrency(b.manualExpenses)}
    Total: ${formatCurrency(b.totalCost)}`
).join('\n\n')}

MONTH-WISE EXPENSES (${new Date().getFullYear()})
${expenseSummary.monthWiseData.map(m => 
  `${m.month}: 
    Products: ${formatCurrency(m.productsCost)}
    Services: ${formatCurrency(m.servicesCost)}
    Appointments: ${formatCurrency(m.appointmentsCost)}
    Manual: ${formatCurrency(m.manualExpenses)}
    Revenue: ${formatCurrency(m.revenue)}
    Profit: ${formatCurrency(m.profit)}`
).join('\n\n')}

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
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-[#f8f9fa]">
        {/* Sidebar */}
        <AdminSidebar
          role="branch_admin"
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
                  role="branch_admin"
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <div>
                  <h1 className="text-2xl font-serif font-bold text-primary">
                    {user?.role === 'admin' 
                      ? `Branch Expense Dashboard` 
                      : 'Expense Analysis Dashboard'
                    }
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === 'admin' && user?.branchName
                      ? `Tracking expenses for ${user.branchName} branch`
                      : 'Track and analyze expenses across products, services, and appointments'
                    }
                  </p>
                  {user?.role === 'admin' && user?.branchName && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Building2 className="w-3 h-3 mr-1" />
                        Branch: {user.branchName}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* NEW: Add Expense Button */}
              <Button
                onClick={() => openExpenseModal()}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-full px-6 py-6 shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">
                  {user?.role === 'admin' ? 'Add Branch Expense' : 'Add Manual Expense'}
                </span>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="flex-1 flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    {/* 🔥 Branch Filter - Disabled for Branch Admin */}
                    <Select 
                      value={selectedBranch} 
                      onValueChange={setSelectedBranch}
                      disabled={user?.role === 'admin'}
                    >
                      <SelectTrigger className="w-48 rounded-lg border-gray-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <SelectValue placeholder="Select Branch" />
                        </div>
                        {user?.role === 'admin' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Branch locked to: {user.branchName}
                          </div>
                        )}
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
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <SelectValue placeholder="Select Month" />
                        </div>
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
                <TabsList className="grid w-full grid-cols-4 rounded-lg">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="manual">
                    Manual Expenses ({manualExpenses.length})
                  </TabsTrigger>
                  <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="data">Raw Data</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              {user?.role === 'admin' ? 'Branch Expenses' : 'Total Expenses'}
                            </p>
                            <p className="text-2xl font-serif font-bold text-primary">
                              {formatCurrency(expenseSummary.totalExpenses)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {user?.role === 'admin' ? 'For your branch' : 'All Categories'}
                            </p>
                          </div>
                          <DollarSign className="w-10 h-10 text-secondary/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Products Cost</p>
                            <p className="text-2xl font-serif font-bold text-blue-600">
                              {formatCurrency(expenseSummary.totalProductsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {products.length} products
                            </p>
                          </div>
                          <Package className="w-10 h-10 text-blue-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Services Cost</p>
                            <p className="text-2xl font-serif font-bold text-green-600">
                              {formatCurrency(expenseSummary.totalServicesCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {services.length} services
                            </p>
                          </div>
                          <ShoppingCart className="w-10 h-10 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Appointments Cost</p>
                            <p className="text-2xl font-serif font-bold text-purple-600">
                              {formatCurrency(expenseSummary.totalAppointmentsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bookings.filter(b => b.status === 'completed').length} bookings
                            </p>
                          </div>
                          <Calendar className="w-10 h-10 text-purple-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* NEW: Manual Expenses Card */}
                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-orange-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Manual Expenses</p>
                            <p className="text-2xl font-serif font-bold text-orange-600">
                              {formatCurrency(expenseSummary.totalManualExpenses)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {manualExpenses.length} expenses
                            </p>
                          </div>
                          <FileText className="w-10 h-10 text-orange-500/20" />
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
                          {user?.role === 'admin' ? 'Branch Revenue & Profit' : 'Revenue & Profit'}
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

                    {/* Expense Distribution Pie Chart - UPDATED */}
                    <Card className="border-none shadow-sm rounded-xl lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-secondary" />
                          {user?.role === 'admin' ? 'Branch Expense Distribution' : 'Expense Distribution (Including Manual Expenses)'}
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
                                  { name: 'Appointments', value: expenseSummary.totalAppointmentsCost },
                                  { name: 'Manual', value: expenseSummary.totalManualExpenses }
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

                  {/* Monthly Trend Chart - UPDATED */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' ? 'Branch Monthly Expense Trend' : 'Monthly Expense Trend (Including Manual Expenses)'}
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
                            <Bar dataKey="manualExpenses" fill="#FF8042" name="Manual Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* NEW: Manual Expenses Tab */}
                <TabsContent value="manual" className="space-y-6">
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' ? 'Branch Manual Expenses' : 'Manual Expenses Management'}
                      </CardTitle>
                      <CardDescription>
                        {user?.role === 'admin' 
                          ? `Managing expenses for ${user.branchName} branch`
                          : 'Add, edit, and track manual expenses'
                        }
                        <br />
                        Total: {manualExpenses.length} expenses, 
                        Amount: {formatCurrency(expenseSummary.totalManualExpenses)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Title</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              {user?.role !== 'admin' && (
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Payment Method</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {manualExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={user?.role === 'admin' ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                                  No manual expenses found. Click "Add Expense" to add one.
                                </td>
                              </tr>
                            ) : (
                              manualExpenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium">{expense.title}</p>
                                      {expense.description && (
                                        <p className="text-sm text-gray-500 truncate max-w-xs">{expense.description}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-orange-600">
                                    {formatCurrency(expense.amount)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {expense.category}
                                    </Badge>
                                  </td>
                                  {user?.role !== 'admin' && (
                                    <td className="px-4 py-3">{expense.branch || 'All Branches'}</td>
                                  )}
                                  <td className="px-4 py-3">{expense.date}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {expense.paymentMethod}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={cn(
                                      "rounded-full",
                                      expense.status === 'paid' ? "bg-green-100 text-green-700" :
                                      expense.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-700"
                                    )}>
                                      {expense.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openExpenseModal(expense)}
                                        className="h-8 px-3"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteManualExpense(expense.id)}
                                        className="h-8 px-3"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manual Expenses Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-secondary" />
                          Manual Expenses by Category
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={expenseSummary.manualExpensesByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
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

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-secondary" />
                          Manual Expenses by Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseSummary.monthWiseData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                              <Bar dataKey="manualExpenses" fill="#FF8042" name="Manual Expenses" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Detailed Analysis Tab - UPDATED */}
                <TabsContent value="analysis" className="space-y-6">
                  {/* Branch-wise Analysis - UPDATED */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' 
                          ? `Branch Expense Analysis (${user.branchName})`
                          : 'Branch-wise Expense Analysis (Including Manual Expenses)'
                        }
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
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Manual Expenses</th>
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
                                <td className="px-4 py-3 text-orange-600 font-medium">
                                  {formatCurrency(branchData.manualExpenses)}
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
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Detailed Analysis - UPDATED */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' 
                          ? 'Branch Monthly Profit & Loss Statement'
                          : 'Monthly Profit & Loss Statement (Including Manual Expenses)'
                        }
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
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Manual Expenses</th>
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
                                <td className="px-4 py-3 text-orange-600">{formatCurrency(monthData.manualExpenses)}</td>
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

                {/* Raw Data Tab - UPDATED */}
                <TabsContent value="data" className="space-y-6">
                  {/* Manual Expenses Data - NEW */}
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' 
                          ? `Branch Manual Expenses Data (${manualExpenses.length})`
                          : `Manual Expenses Data (${manualExpenses.length})`
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Title</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              {user?.role !== 'admin' && (
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Payment Method</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Created By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {manualExpenses.slice(0, 20).map((expense) => (
                              <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{expense.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{expense.description || 'N/A'}</td>
                                <td className="px-4 py-3 font-bold text-orange-600">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="text-xs">
                                    {expense.category}
                                  </Badge>
                                </td>
                                {user?.role !== 'admin' && (
                                  <td className="px-4 py-3">{expense.branch || 'All Branches'}</td>
                                )}
                                <td className="px-4 py-3">{expense.date}</td>
                                <td className="px-4 py-3">{expense.paymentMethod}</td>
                                <td className="px-4 py-3">
                                  <Badge className={cn(
                                    "rounded-full",
                                    expense.status === 'paid' ? "bg-green-100 text-green-700" :
                                    expense.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  )}>
                                    {expense.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{expense.createdBy}</td>
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

      {/* NEW: Manual Expense Modal with BRANCH RESTRICTION */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeExpenseModal} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-md">
              <div className="flex h-full flex-col bg-white shadow-xl">
                <div className="bg-primary text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {user?.role === 'admin' 
                        ? `Add Expense to ${user.branchName}`
                        : (editingExpense ? 'Edit Manual Expense' : 'Add Manual Expense')
                      }
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeExpenseModal}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {user?.role === 'admin' && user?.branchName && (
                    <p className="text-sm text-white/80 mt-1">
                      This expense will be automatically added to {user.branchName} branch
                    </p>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expense Title *</label>
                      <Input
                        name="title"
                        value={expenseForm.title}
                        onChange={handleExpenseFormChange}
                        placeholder="Enter expense title"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        name="description"
                        value={expenseForm.description}
                        onChange={handleExpenseFormChange}
                        placeholder="Enter expense description"
                        className="w-full min-h-[80px] border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount (USD) *</label>
                        <Input
                          type="number"
                          name="amount"
                          value={expenseForm.amount}
                          onChange={handleExpenseFormChange}
                          placeholder="0.00"
                          className="w-full"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <Input
                          type="date"
                          name="date"
                          value={expenseForm.date}
                          onChange={handleExpenseFormChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => handleSelectChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* 🔥 BRANCH SELECTION - Disabled for Branch Admin */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Branch {user?.role === 'admin' && '(Locked)'}
                      </label>
                      {user?.role === 'admin' ? (
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.branchName}</p>
                              <p className="text-sm text-gray-500">Automatically selected for branch admin</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">
                              <Building2 className="w-3 h-3 mr-1" />
                              Your Branch
                            </Badge>
                          </div>
                          <input type="hidden" name="branch" value={user.branchName} />
                        </div>
                      ) : (
                        <Select
                          value={expenseForm.branch}
                          onValueChange={(value) => handleSelectChange('branch', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {getBranchOptions().map(branch => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method *</label>
                      <Select
                        value={expenseForm.paymentMethod}
                        onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Status *</label>
                      <div className="flex gap-2">
                        {(['paid', 'pending', 'cancelled'] as const).map(status => (
                          <Button
                            key={status}
                            type="button"
                            variant={expenseForm.status === status ? "default" : "outline"}
                            onClick={() => handleSelectChange('status', status)}
                            className="capitalize"
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea
                        name="notes"
                        value={expenseForm.notes}
                        onChange={handleExpenseFormChange}
                        placeholder="Any additional notes..."
                        className="w-full min-h-[60px] border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={closeExpenseModal}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitManualExpense}
                      disabled={submitting || !expenseForm.title.trim() || expenseForm.amount <= 0}
                      className="gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {user?.role === 'admin' ? 'Add Branch Expense' : (editingExpense ? 'Update Expense' : 'Save Expense')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}