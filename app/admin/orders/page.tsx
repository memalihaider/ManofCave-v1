'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Building, Phone, Mail, DollarSign, Loader2, RefreshCw, ChevronDown, MapPin, Package, ShoppingBag, Truck, CreditCard, Home, Globe, Link } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== TYPES ====================
interface OrderProduct {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  branchNames?: string[];
  productBranches?: string[];
  productBranchNames?: string[];
}

interface Customer {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: string;
  role: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  branchId?: string;
  branchName?: string;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'rejected';
  notes?: string;
  branchNames?: string[]; // Array of branch names
  productBranches?: string[]; // Array of branch IDs from products
  customerBranchId?: string;
  customerBranchName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  orderDate?: string;
  shippingCity?: string;
  shippingCountry?: string;
  shippingPhone?: string;
}

interface CustomerMap {
  [customerId: string]: Customer;
}

interface OrdersStore {
  // Data
  orders: Order[];
  customers: CustomerMap;
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    rejected: number;
    totalRevenue: number;
    todayOrders: number;
    activeCustomers: number;
  };
  
  // Actions
  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
  calculateStats: () => void;
  setupRealtimeUpdates: () => () => void;
}

// ==================== BRANCH FILTERED ORDERS STORE ====================
const useOrdersStore = create<OrdersStore>((set, get) => ({
  // Initial state
  orders: [],
  customers: {},
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    rejected: 0,
    totalRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0
  },

  // Fetch all orders WITH BRANCH FILTERING
  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Get user info from auth context
      const user = (window as any).__userAuth || null;
      const userBranchId = user?.branchId;
      const userBranchName = user?.branchName;
      const userRole = user?.role;
      
      console.log("🔄 Fetching orders with branch filtering:", {
        userRole,
        userBranchId,
        userBranchName,
        totalOrders: querySnapshot.size
      });

      const allOrdersData: Order[] = [];
      const filteredOrdersData: Order[] = [];
      
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        // Extract order data
        const order: Order = {
          id: doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || 'Unknown Customer',
          customerEmail: data.customerEmail || 'No Email',
          products: Array.isArray(data.products) ? data.products.map((p: any) => ({
            productId: p.productId || '',
            productName: p.productName || 'Unknown Product',
            price: Number(p.price) || 0,
            quantity: Number(p.quantity) || 1,
            image: p.image || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
            branchNames: p.branchNames || [],
            productBranches: p.productBranches || [],
            productBranchNames: p.productBranchNames || []
          })) : [],
          totalAmount: Number(data.totalAmount) || 0,
          paymentMethod: data.paymentMethod || 'Unknown',
          shippingAddress: data.shippingAddress || '',
          status: (data.status as Order['status']) || 'pending',
          notes: data.notes || data.orderNotes || '',
          branchNames: data.branchNames || [],
          productBranches: data.products?.[0]?.productBranches || [],
          customerBranchId: data.customerBranchId,
          customerBranchName: data.customerBranchName,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          orderDate: data.orderDate,
          shippingCity: data.shippingCity,
          shippingCountry: data.shippingCountry,
          shippingPhone: data.shippingPhone
        };

        allOrdersData.push(order);
        
        // 🔥 STRICT BRANCH FILTERING LOGIC
        if (userRole === 'admin' && userBranchName) {
          // OPTION 1: Check if customer belongs to this branch (if customerBranchName exists)
          if (order.customerBranchName === userBranchName) {
            filteredOrdersData.push(order);
            console.log(`✅ Order ${doc.id} included - Customer belongs to branch ${userBranchName}`);
            return;
          }
          
          // OPTION 2: Check product branches (productBranches array contains branch IDs)
          const productBranches = order.productBranches || [];
          if (productBranches.length > 0) {
            // We need to check if any product in this order belongs to user's branch
            // Since we have branch IDs in productBranches, we need to match with userBranchId
            if (productBranches.includes(userBranchId)) {
              filteredOrdersData.push(order);
              console.log(`✅ Order ${doc.id} included - Product belongs to branch ${userBranchName} (ID: ${userBranchId})`);
              return;
            }
          }
          
          // OPTION 3: Check branchNames array
          const orderBranchNames = order.branchNames || [];
          if (orderBranchNames.length > 0) {
            // Check if any branch name matches exactly
            if (orderBranchNames.includes(userBranchName)) {
              filteredOrdersData.push(order);
              console.log(`✅ Order ${doc.id} included - Branch name matches: ${userBranchName}`);
              return;
            }
            
            // Check for partial matches (e.g., "first branch" vs "first branch")
            const normalizedUserBranch = userBranchName.toLowerCase().trim();
            const hasMatch = orderBranchNames.some(branch => 
              branch.toLowerCase().trim() === normalizedUserBranch
            );
            
            if (hasMatch) {
              filteredOrdersData.push(order);
              console.log(`✅ Order ${doc.id} included - Branch name partial match: ${userBranchName}`);
              return;
            }
          }
          
          // OPTION 4: Check product branch names
          const productBranchNames = order.products?.[0]?.branchNames || 
                                     order.products?.[0]?.productBranchNames || [];
          if (productBranchNames.length > 0) {
            const hasMatch = productBranchNames.some(name => 
              name.toLowerCase().trim() === userBranchName.toLowerCase().trim()
            );
            if (hasMatch) {
              filteredOrdersData.push(order);
              console.log(`✅ Order ${doc.id} included - Product branch name matches: ${userBranchName}`);
              return;
            }
          }
          
          console.log(`❌ Order ${doc.id} excluded - No branch match for ${userBranchName}`);
          
        } else if (userRole === 'super_admin') {
          // Super admin: Show all orders
          filteredOrdersData.push(order);
        }
      });
      
      // Use filtered orders for branch admin, all orders for super admin
      const finalOrdersData = userRole === 'admin' ? filteredOrdersData : allOrdersData;
      
      console.log(`✅ Orders loaded: ${finalOrdersData.length} orders (${userRole === 'admin' ? 'Branch Filtered' : 'All'})`);
      console.log(`📊 Filtered orders for ${userBranchName}:`, finalOrdersData.map(o => ({
        id: o.id,
        customerName: o.customerName,
        amount: o.totalAmount,
        status: o.status,
        branchNames: o.branchNames,
        productBranches: o.productBranches
      })));
      
      set({ orders: finalOrdersData, isLoading: false });
      get().calculateStats();
      
      // Fetch customers after orders
      await get().fetchCustomers();
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: 'Failed to load orders. Please try again.', 
        isLoading: false 
      });
    }
  },

  // Fetch all customers WITH BRANCH FILTERING
  fetchCustomers: async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Get user info from auth context
      const user = (window as any).__userAuth || null;
      const userBranchId = user?.branchId;
      const userRole = user?.role;
      
      const customersData: CustomerMap = {};
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        // Check if customer belongs to current branch
        const customerBranchId = data.branchId;
        const customerBranchName = data.branchName;
        
        // Filter customers based on user role
        let shouldInclude = true;
        if (userRole === 'admin' && userBranchId) {
          shouldInclude = customerBranchId === userBranchId;
        }
        
        if (shouldInclude) {
          customersData[doc.id] = {
            uid: doc.id,
            name: data.name || 'Unknown Customer',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
            status: data.status || 'active',
            role: data.role || 'customer',
            branchId: customerBranchId,
            branchName: customerBranchName,
            createdAt: data.createdAt || Timestamp.now(),
            lastLogin: data.lastLogin || Timestamp.now()
          };
        }
      });
      
      set({ customers: customersData });
      
      // Update stats with customer count (filtered)
      const activeCustomers = Object.values(customersData).filter(c => c.status === 'active').length;
      set(state => ({
        stats: {
          ...state.stats,
          activeCustomers
        }
      }));
      
      console.log(`✅ Filtered customers: ${Object.keys(customersData).length} customers`);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: Timestamp.now() } : order
        )
      }));

      // Recalculate stats
      get().calculateStats();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Calculate statistics
  calculateStats: () => {
    const state = get();
    const orders = state.orders;
    
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const refunded = orders.filter(o => o.status === 'refunded').length;
    const rejected = orders.filter(o => o.status === 'rejected').length;
    
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const orderDate = o.orderDate || o.createdAt.toDate().toISOString().split('T')[0];
      return orderDate === today;
    }).length;

    set({
      stats: {
        ...state.stats,
        total,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        cancelled,
        refunded,
        rejected,
        totalRevenue,
        todayOrders
      }
    });
  },

  // Setup real-time updates WITH BRANCH FILTERING
  setupRealtimeUpdates: () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      
      // Get user info
      const user = (window as any).__userAuth || null;
      const userBranchId = user?.branchId;
      const userBranchName = user?.branchName;
      const userRole = user?.role;
      
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const allOrdersData: Order[] = [];
        const filteredOrdersData: Order[] = [];
        
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          
          const order: Order = {
            id: doc.id,
            customerId: data.customerId || '',
            customerName: data.customerName || 'Unknown Customer',
            customerEmail: data.customerEmail || 'No Email',
            products: Array.isArray(data.products) ? data.products.map((p: any) => ({
              productId: p.productId || '',
              productName: p.productName || 'Unknown Product',
              price: Number(p.price) || 0,
              quantity: Number(p.quantity) || 1,
              image: p.image || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
              branchNames: p.branchNames || [],
              productBranches: p.productBranches || [],
              productBranchNames: p.productBranchNames || []
            })) : [],
            totalAmount: Number(data.totalAmount) || 0,
            paymentMethod: data.paymentMethod || 'Unknown',
            shippingAddress: data.shippingAddress || '',
            status: (data.status as Order['status']) || 'pending',
            notes: data.notes || data.orderNotes || '',
            branchNames: data.branchNames || [],
            productBranches: data.products?.[0]?.productBranches || [],
            customerBranchId: data.customerBranchId,
            customerBranchName: data.customerBranchName,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            orderDate: data.orderDate,
            shippingCity: data.shippingCity,
            shippingCountry: data.shippingCountry,
            shippingPhone: data.shippingPhone
          };

          allOrdersData.push(order);
          
          // 🔥 STRICT BRANCH FILTERING for real-time updates
          if (userRole === 'admin' && userBranchName) {
            let shouldInclude = false;
            
            // Check customer branch
            if (order.customerBranchName === userBranchName) {
              shouldInclude = true;
            }
            
            // Check product branches
            if (!shouldInclude && order.productBranches?.includes(userBranchId)) {
              shouldInclude = true;
            }
            
            // Check branch names
            if (!shouldInclude && order.branchNames?.some(name => 
              name.toLowerCase().trim() === userBranchName.toLowerCase().trim()
            )) {
              shouldInclude = true;
            }
            
            // Check product branch names
            if (!shouldInclude) {
              const productBranchNames = order.products?.[0]?.branchNames || 
                                         order.products?.[0]?.productBranchNames || [];
              if (productBranchNames.some(name => 
                name.toLowerCase().trim() === userBranchName.toLowerCase().trim()
              )) {
                shouldInclude = true;
              }
            }
            
            if (shouldInclude) {
              filteredOrdersData.push(order);
            }
          } else if (userRole === 'super_admin') {
            filteredOrdersData.push(order);
          }
        });
        
        const finalOrdersData = userRole === 'admin' ? filteredOrdersData : allOrdersData;
        set({ orders: finalOrdersData });
        get().calculateStats();
        
        // Refresh customers data
        await get().fetchCustomers();
      }, (error) => {
        console.error('Error in real-time update:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      return () => {};
    }
  },
}));

// ==================== MAIN COMPONENT ====================
export default function SuperAdminOrders() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { 
    orders, 
    customers,
    isLoading, 
    error, 
    stats,
    fetchOrders, 
    updateOrderStatus
  } = useOrdersStore();

  // Set user info globally for store access
  useEffect(() => {
    if (user) {
      (window as any).__userAuth = user;
      console.log("👤 User set in global store:", {
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName
      });
    }
  }, [user]);

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const customer = customers[order.customerId];
    const customerPhone = customer?.phone || '';
    
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some(p => 
        p.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
    const matchesDate = !selectedDate || 
      (order.orderDate || order.createdAt.toDate().toISOString().split('T')[0]) === selectedDate;

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Get unique payment methods
  const paymentMethods = Array.from(new Set(orders.map(order => order.paymentMethod)));

  // Status configuration (including rejected)
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: AlertCircle,
      badgeColor: 'bg-yellow-500',
      description: 'Order received, waiting for confirmation'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: CheckCircle,
      badgeColor: 'bg-blue-500',
      description: 'Order confirmed, preparing for processing'
    },
    processing: { 
      label: 'Processing', 
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      icon: Package,
      badgeColor: 'bg-purple-500',
      description: 'Order is being processed'
    },
    shipped: { 
      label: 'Shipped', 
      color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      icon: Truck,
      badgeColor: 'bg-indigo-500',
      description: 'Order has been shipped'
    },
    delivered: { 
      label: 'Delivered', 
      color: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: CheckCircle,
      badgeColor: 'bg-green-500',
      description: 'Order delivered successfully'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: XCircle,
      badgeColor: 'bg-red-500',
      description: 'Order has been cancelled'
    },
    refunded: { 
      label: 'Refunded', 
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      icon: DollarSign,
      badgeColor: 'bg-gray-500',
      description: 'Order has been refunded'
    },
    rejected: { 
      label: 'Rejected', 
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: XCircle,
      badgeColor: 'bg-red-500',
      description: 'Order has been rejected'
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Payment method icons
  const paymentIcons = {
    wallet: DollarSign,
    cash: DollarSign,
    card: CreditCard,
    credit: CreditCard,
    debit: CreditCard,
    online: Globe,
    cod: DollarSign
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      alert('Failed to update order status. Please try again.');
    }
  };

  // Function to get customer details
  const getCustomerDetails = (customerId: string) => {
    const customer = customers[customerId];
    return customer || null;
  };

  // Function to get payment method icon
  const getPaymentIcon = (method: string) => {
    const normalizedMethod = method.toLowerCase();
    for (const [key, Icon] of Object.entries(paymentIcons)) {
      if (normalizedMethod.includes(key)) {
        return Icon;
      }
    }
    return CreditCard;
  };

  // Get today's date for the date picker
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex h-screen bg-gray-50 items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold text-primary">Loading orders...</p>
            <p className="text-sm text-gray-500">
              {user?.role === 'admin' 
                ? `Fetching orders for ${user?.branchName || 'your branch'}` 
                : 'Fetching all orders'
              }
            </p>
            <div className="text-xs text-gray-400">
              Checking branch filters...
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar - Always Visible */}
        <AdminSidebar
          role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "hidden lg:block transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0"
          )}
        />

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              <AdminMobileSidebar
                role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.role === 'admin' ? 'Branch Orders' : 'All Orders'}
                    </h1>
                    {user?.role === 'admin' && user?.branchName && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        🏢 {user.branchName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'admin' 
                      ? `Managing orders for ${user?.branchName || 'your branch'}` 
                      : 'Manage product orders across all branches'
                    }
                    
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={fetchOrders}
                  variant="outline" 
                  className="gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user?.email}
                </span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
            
            {/* Branch Info Banner */}
            {user?.role === 'admin' && user?.branchName && (
              <div className="px-4 lg:px-8 pb-4">
               
                     
                      <div>
                       
                       
                      
                   
                    
                 
                  
                  {/* Debug Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
                      
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user?.role === 'admin' ? 'Branch Orders' : 'Total Orders'}
                    </CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'For your branch only' : 'Across all branches'}
                    </p>
                  </CardContent>
                </Card>

                

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Placed today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      From delivered orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div 
                    key={status} 
                    className={cn(
                      "p-4 rounded-lg border",
                      config.color.replace('hover:bg-', 'bg-').split(' ')[0]
                    )}
                  >
                    <div className="text-2xl font-bold">
                      {stats[status as keyof typeof stats] || 0}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {config.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by customer, email, phone or product..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {/* Date Filter */}
                    <div className="w-full sm:w-auto">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full"
                        max={today}
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${statusConfig[option.value as keyof typeof statusConfig]?.badgeColor || 'bg-gray-500'}`}></div>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        {paymentMethods.map(method => {
                          const PaymentIcon = getPaymentIcon(method);
                          return (
                            <SelectItem key={method} value={method}>
                              <div className="flex items-center gap-2">
                                <PaymentIcon className="w-4 h-4" />
                                {method.charAt(0).toUpperCase() + method.slice(1)}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Active filters indicator */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {statusFilter !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Status: {statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}
                        <button onClick={() => setStatusFilter('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {paymentFilter !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Payment: {paymentFilter}
                        <button onClick={() => setPaymentFilter('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedDate && (
                      <Badge variant="outline" className="gap-2">
                        Date: {selectedDate}
                        <button onClick={() => setSelectedDate('')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="outline" className="gap-2">
                        Search: {searchQuery}
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {(statusFilter !== 'all' || paymentFilter !== 'all' || selectedDate || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setStatusFilter('all');
                          setPaymentFilter('all');
                          setSelectedDate('');
                          setSearchQuery('');
                        }}
                        className="text-xs"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status?.icon || AlertCircle;
                  const customer = getCustomerDetails(order.customerId);
                  const PaymentIcon = getPaymentIcon(order.paymentMethod);
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Order Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                          {/* Order Info */}
                          <div className="flex items-start gap-4 flex-1">
                            {/* Order ID & Date */}
                            <div className="text-center min-w-[100px]">
                              <div className="text-sm font-medium text-gray-500">Order ID</div>
                              <div className="text-lg font-bold text-primary truncate">
                                #{order.id.substring(0, 8)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.orderDate || order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                              </div>
                            </div>
                            
                            {/* Customer Details */}
                            <div className="border-l pl-4 flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {order.customerName}
                                </h3>
                                {customer && (
                                  <Badge className={cn(
                                    "text-xs",
                                    customer.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  )}>
                                    {customer.status}
                                  </Badge>
                                )}
                                {/* Branch Badge */}
                                {order.customerBranchName && (
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                    <Building className="w-3 h-3 mr-1" />
                                    {order.customerBranchName}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                {/* Email */}
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate max-w-[200px]">
                                    {order.customerEmail}
                                  </span>
                                </div>
                                
                                {/* Phone */}
                                {order.shippingPhone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span className="font-medium">
                                      {order.shippingPhone}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Payment Method */}
                                <div className="flex items-center gap-1">
                                  <PaymentIcon className="w-3 h-3" />
                                  <span className="capitalize">
                                    {order.paymentMethod}
                                  </span>
                                </div>
                                
                                {/* Branch Info */}
                                {user?.role === 'admin' && order.branchNames && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <Building className="w-3 h-3" />
                                    <span className="font-medium">
                                      {order.branchNames.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status & Amount */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[250px]">
                            {/* Amount */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                ${order.totalAmount}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <Badge className={cn(
                              "gap-2 px-3 py-1.5 font-medium min-w-[120px] justify-center",
                              status?.color || 'bg-gray-100 text-gray-800'
                            )}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{status?.label || order.status}</span>
                            </Badge>
                          </div>
                        </div>

                        {/* Products List */}
                        <div className="border-t pt-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Products ({order.products.length})
                          </h4>
                          
                          <div className="space-y-3">
                            {order.products.map((product, index) => (
                              <div 
                                key={`${product.productId}-${index}`}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                              >
                                {/* Product Image */}
                                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                  <img 
                                    src={product.image} 
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                  />
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium text-gray-900 truncate">
                                      {product.productName}
                                    </h5>
                                    {product.branchNames && product.branchNames.length > 0 && user?.role === 'super_admin' && (
                                      <Badge variant="outline" className="text-xs border-gray-300">
                                        {product.branchNames[0]}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>Price: AED {product.price}</span>
                                    <span>Quantity: {product.quantity}</span>
                                    <span>Total: AED {product.price * product.quantity}</span>
                                  </div>
                                  {/* Product Branch Info */}
                                  {product.productBranches && product.productBranches.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Branch IDs: {product.productBranches.join(', ')}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product ID */}
                                <div className="text-xs text-gray-400">
                                  ID: {product.productId.substring(0, 8)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                          {/* Shipping Address */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              Shipping Details
                            </h4>
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span className="font-medium">Address:</span>
                                <span>{order.shippingAddress}</span>
                              </div>
                              {(order.shippingCity || order.shippingCountry) && (
                                <div className="flex items-center gap-2">
                                  <Building className="w-3 h-3" />
                                  <span className="font-medium">Location:</span>
                                  <span>
                                    {[order.shippingCity, order.shippingCountry].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              {order.shippingPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  <span className="font-medium">Contact:</span>
                                  <span>{order.shippingPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Control & Notes */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">Order Status Control</h4>
                              <div className="text-xs text-gray-500">
                                Updated: {order.updatedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                              </div>
                            </div>
                            
                            {/* Status Dropdown */}
                            <Select
                              value={order.status}
                              onValueChange={(value) => 
                                handleStatusChange(order.id, value as Order['status'])
                              }
                            >
                              <SelectTrigger className="w-full mb-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${status?.badgeColor || 'bg-gray-500'}`}></div>
                                  <span>Change Status</span>
                                  <ChevronDown className="w-3 h-3 ml-auto" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => {
                                  const optionStatus = statusConfig[option.value as keyof typeof statusConfig];
                                  const OptionIcon = optionStatus?.icon || AlertCircle;
                                  
                                  return (
                                    <SelectItem 
                                      key={option.value} 
                                      value={option.value}
                                      className="flex items-center gap-2"
                                    >
                                      <OptionIcon className="w-4 h-4" />
                                      <div>
                                        <div>{option.label}</div>
                                        <div className="text-xs text-gray-500">
                                          {optionStatus?.description || 'Update order status'}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            {/* Notes */}
                            {order.notes && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Order Notes</h4>
                                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                  {order.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Technical Info */}
                        <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
                          <div className="flex flex-wrap gap-4">
                            <span>Order ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{order.id.substring(0, 8)}...</code></span>
                            <span>Customer ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{order.customerId.substring(0, 8)}...</code></span>
                            {order.customerBranchName && (
                              <span>Customer Branch: <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{order.customerBranchName}</code></span>
                            )}
                            {order.branchNames && order.branchNames.length > 0 && (
                              <span>Order Branches: <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{order.branchNames.join(', ')}</code></span>
                            )}
                            <span>
                              Created: {order.createdAt?.toDate?.().toLocaleString() || 'N/A'}
                            </span>
                            {order.updatedAt && (
                              <span>
                                Last Updated: {order.updatedAt?.toDate?.().toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* No Results */}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {user?.role === 'admin' ? 'No orders for your branch' : 'No orders found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {user?.role === 'admin' 
                      ? `No orders found specifically for branch "${user?.branchName}". Orders will appear here once customers place orders in your branch.`
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                  
                  {/* Debug Info for Branch Admin */}
                  {user?.role === 'admin' && (
                    <div className="max-w-md mx-auto mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Debug Information:</p>
                        <ul className="text-left space-y-1">
                          <li>• Branch: <code className="bg-blue-100 px-2 py-0.5 rounded">{user.branchName}</code> (ID: <code>{user.branchId}</code>)</li>
                          <li>• Filtering Methods:</li>
                          <li className="ml-4">- customerBranchName === "{user.branchName}"</li>
                          <li className="ml-4">- productBranches.includes("{user.branchId}")</li>
                          <li className="ml-4">- branchNames.includes("{user.branchName}")</li>
                          <li>• Check browser console for detailed filtering logs</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    {user?.role === 'admin' ? (
                      <div className="flex gap-3 justify-center">
                        <Link href="/admin/products">
                          <Button variant="outline">
                            <Package className="w-4 h-4 mr-2" />
                            Check Products
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setStatusFilter('all');
                            setPaymentFilter('all');
                            setSelectedDate('');
                            setSearchQuery('');
                          }}
                        >
                          Clear all filters
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={fetchOrders}
                          className="border-green-300 text-green-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setStatusFilter('all');
                          setPaymentFilter('all');
                          setSelectedDate('');
                          setSearchQuery('');
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="mt-6 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Error loading orders</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={fetchOrders} 
                      variant="outline" 
                      className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Total Results */}
              <div className="mt-6 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    Showing {filteredOrders.length} of {orders.length} orders
                    {user?.role === 'admin' && user?.branchName && (
                      <span className="ml-2 text-blue-600">
                        • Strictly filtered for {user.branchName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Object.keys(customers).length} customers • ${stats.totalRevenue} total revenue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}