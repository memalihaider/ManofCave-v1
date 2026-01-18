'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Building, Phone, Mail, DollarSign, Loader2, RefreshCw, ChevronDown, MapPin, Shield, Check, X, Scissors } from "lucide-react";
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
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== TYPES ====================
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
}

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string;
  time: string;
  timeSlot: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  createdAt: Timestamp;
  
  // Firebase Fields - Correct names according to your data
  branchNames: string[]; // Array of branch names
  branches: string[]; // Array of branch IDs
  
  serviceBranchNames: string[];
  serviceBranches: string[];
  
  staffName: string;
  staffId: string;
  staffBranch: string;
  staffRole: string;
  
  serviceCategory: string;
  serviceCategoryId: string;
  serviceImageUrl: string;
  servicePopularity: string;
  serviceRevenue: number;
  serviceTotalBookings: number;
  serviceStatus: string;
  
  pointsAwarded: boolean;
  
  // For UI convenience
  branch: string; // First branch name for display
  barber: string; // Alias for staffName
  duration: number; // Alias for serviceDuration
  phone: string; // Alias for customerPhone
}

interface CustomerMap {
  [customerId: string]: Customer;
}

interface AppointmentsStore {
  // Data
  appointments: Appointment[];
  customers: CustomerMap;
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalRevenue: number;
    todayAppointments: number;
    activeCustomers: number;
  };
  
  // Actions
  fetchAppointments: (userBranch?: string) => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchCustomerPhone: (customerId: string) => Promise<string | null>;
  updateAppointmentStatus: (appointmentId: string, newStatus: Appointment['status']) => Promise<void>;
  calculateStats: (userBranch?: string) => void;
  setupRealtimeUpdates: (userBranch?: string) => () => void;
}

const useAppointmentsStore = create<AppointmentsStore>((set, get) => ({
  // Initial state
  appointments: [],
  customers: {},
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    totalRevenue: 0,
    todayAppointments: 0,
    activeCustomers: 0
  },

  // Fetch all appointments with branch filtering - FIXED FOR YOUR FIREBASE STRUCTURE
  fetchAppointments: async (userBranch?: string) => {
    set({ isLoading: true, error: null });
    try {
      const appointmentsRef = collection(db, 'bookings');
      
      // Create query based on user role
      let q;
      if (userBranch) {
        // Branch admin - sirf apni branch ke appointments
        // Use array-contains for branchNames array
        q = query(
          appointmentsRef, 
          where('branchNames', 'array-contains', userBranch)
          // Note: Can't use orderBy with array-contains, so we'll sort manually
        );
        console.log(`🏢 Branch Admin (${userBranch}): Filtering appointments by branchNames array`);
      } else {
        // Super admin - sab appointments
        q = query(appointmentsRef, orderBy('createdAt', 'desc'));
        console.log('👑 Super Admin: All appointments');
      }
      
      const querySnapshot = await getDocs(q);
      
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        // Extract first branch name for display
        const firstBranchName = data.branchNames && data.branchNames.length > 0 
          ? data.branchNames[0] 
          : data.staffBranch || 'Main Branch';
        
        appointmentsData.push({
          id: doc.id,
          customerId: data.customerId || '',
          customerName: data.customerName || 'Unknown Customer',
          customerEmail: data.customerEmail || 'No Email',
          customerPhone: data.customerPhone || data.phone || '',
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || 'Unknown Service',
          servicePrice: Number(data.servicePrice) || 0,
          serviceDuration: Number(data.serviceDuration) || 30,
          date: data.date || 'N/A',
          time: data.time || 'N/A',
          timeSlot: data.timeSlot || data.time || 'N/A',
          totalAmount: Number(data.totalAmount) || 0,
          status: (data.status as Appointment['status']) || 'pending',
          notes: data.notes || 'No notes',
          createdAt: data.createdAt || Timestamp.now(),
          
          // Firebase original fields
          branchNames: data.branchNames || [],
          branches: data.branches || [],
          serviceBranchNames: data.serviceBranchNames || [],
          serviceBranches: data.serviceBranches || [],
          staffName: data.staffName || 'Not Assigned',
          staffId: data.staffId || '',
          staffBranch: data.staffBranch || '',
          staffRole: data.staffRole || '',
          serviceCategory: data.serviceCategory || '',
          serviceCategoryId: data.serviceCategoryId || '',
          serviceImageUrl: data.serviceImageUrl || '',
          servicePopularity: data.servicePopularity || 'medium',
          serviceRevenue: Number(data.serviceRevenue) || 0,
          serviceTotalBookings: Number(data.serviceTotalBookings) || 0,
          serviceStatus: data.serviceStatus || 'active',
          pointsAwarded: data.pointsAwarded || false,
          
          // For UI convenience
          branch: firstBranchName,
          barber: data.staffName || 'Not Assigned',
          duration: Number(data.serviceDuration) || 30,
          phone: data.customerPhone || data.phone || ''
        });
      });
      
      // Manual sorting for all cases
      appointmentsData.sort((a, b) => {
        // First by date (descending)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB > dateA) return 1;
        if (dateB < dateA) return -1;
        
        // Then by time (descending)
        const timeA = a.timeSlot || a.time;
        const timeB = b.timeSlot || b.time;
        if (timeB > timeA) return 1;
        if (timeB < timeA) return -1;
        
        // Finally by createdAt (descending)
        return b.createdAt?.seconds - a.createdAt?.seconds || 
               b.createdAt?.nanoseconds - a.createdAt?.nanoseconds;
      });
      
      set({ appointments: appointmentsData, isLoading: false });
      get().calculateStats(userBranch);
      
      // Fetch customers after appointments
      await get().fetchCustomers();
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({ 
        error: 'Failed to load appointments. Please try again.', 
        isLoading: false 
      });
    }
  },

  // Fetch all customers
  fetchCustomers: async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const customersData: CustomerMap = {};
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
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
          createdAt: data.createdAt || Timestamp.now(),
          lastLogin: data.lastLogin || Timestamp.now()
        };
      });
      
      set({ customers: customersData });
      
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  },

  // Fetch specific customer phone
  fetchCustomerPhone: async (customerId: string) => {
    try {
      // First check if customer exists in our local state
      const { customers } = get();
      const customer = customers[customerId];
      if (customer && customer.phone) {
        return customer.phone;
      }

      // If not in local state, fetch from Firebase
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        const data = customerSnap.data();
        const phone = data.phone || '';
        
        // Update local state
        if (phone) {
          set(state => ({
            customers: {
              ...state.customers,
              [customerId]: {
                ...state.customers[customerId],
                phone
              }
            }
          }));
        }
        
        return phone;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching customer phone:', error);
      return null;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const appointmentRef = doc(db, 'bookings', appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update local state
      set(state => ({
        appointments: state.appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      }));

      // Recalculate stats
      const state = get();
      const userBranch = state.appointments.find(a => a.id === appointmentId)?.branch;
      get().calculateStats(userBranch);
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Calculate statistics with branch filtering - FIXED
  calculateStats: (userBranch?: string) => {
    const state = get();
    let appointments = state.appointments;
    
    // Filter appointments by branch if specified
    if (userBranch) {
      appointments = appointments.filter(a => 
        a.branchNames && a.branchNames.includes(userBranch)
      );
    }
    
    const total = appointments.length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const inProgress = appointments.filter(a => a.status === 'in-progress').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const noShow = appointments.filter(a => a.status === 'no-show').length;
   const totalRevenue = appointments
  .reduce((sum, apt) => sum + apt.totalAmount, 0);
    
    // Calculate today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today).length;

    // Calculate active customers for this branch
    const branchAppointments = appointments;
    const uniqueCustomerIds = new Set(branchAppointments.map(a => a.customerId));
    const activeCustomers = Array.from(uniqueCustomerIds).length;

    set({
      stats: {
        ...state.stats,
        total,
        pending,
        confirmed,
        inProgress,
        completed,
        cancelled,
        noShow,
        totalRevenue,
        todayAppointments,
        activeCustomers
      }
    });
  },

  // Setup real-time updates with branch filtering - FIXED
  setupRealtimeUpdates: (userBranch?: string) => {
    try {
      const appointmentsRef = collection(db, 'bookings');
      
      // Create query based on user role
      let q;
      if (userBranch) {
        // Branch admin - sirf apni branch ke appointments
        q = query(
          appointmentsRef, 
          where('branchNames', 'array-contains', userBranch)
        );
      } else {
        // Super admin - sab appointments
        q = query(appointmentsRef, orderBy('createdAt', 'desc'));
      }
      
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const appointmentsData: Appointment[] = [];
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          
          // Extract first branch name for display
          const firstBranchName = data.branchNames && data.branchNames.length > 0 
            ? data.branchNames[0] 
            : data.staffBranch || 'Main Branch';
          
          appointmentsData.push({
            id: doc.id,
            customerId: data.customerId || '',
            customerName: data.customerName || 'Unknown Customer',
            customerEmail: data.customerEmail || 'No Email',
            customerPhone: data.customerPhone || data.phone || '',
            serviceId: data.serviceId || '',
            serviceName: data.serviceName || 'Unknown Service',
            servicePrice: Number(data.servicePrice) || 0,
            serviceDuration: Number(data.serviceDuration) || 30,
            date: data.date || 'N/A',
            time: data.time || 'N/A',
            timeSlot: data.timeSlot || data.time || 'N/A',
            totalAmount: Number(data.totalAmount) || 0,
            status: (data.status as Appointment['status']) || 'pending',
            notes: data.notes || 'No notes',
            createdAt: data.createdAt || Timestamp.now(),
            
            // Firebase original fields
            branchNames: data.branchNames || [],
            branches: data.branches || [],
            serviceBranchNames: data.serviceBranchNames || [],
            serviceBranches: data.serviceBranches || [],
            staffName: data.staffName || 'Not Assigned',
            staffId: data.staffId || '',
            staffBranch: data.staffBranch || '',
            staffRole: data.staffRole || '',
            serviceCategory: data.serviceCategory || '',
            serviceCategoryId: data.serviceCategoryId || '',
            serviceImageUrl: data.serviceImageUrl || '',
            servicePopularity: data.servicePopularity || 'medium',
            serviceRevenue: Number(data.serviceRevenue) || 0,
            serviceTotalBookings: Number(data.serviceTotalBookings) || 0,
            serviceStatus: data.serviceStatus || 'active',
            pointsAwarded: data.pointsAwarded || false,
            
            // For UI convenience
            branch: firstBranchName,
            barber: data.staffName || 'Not Assigned',
            duration: Number(data.serviceDuration) || 30,
            phone: data.customerPhone || data.phone || ''
          });
        });
        
        // Manual sorting
        appointmentsData.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateB > dateA) return 1;
          if (dateB < dateA) return -1;
          
          const timeA = a.timeSlot || a.time;
          const timeB = b.timeSlot || b.time;
          if (timeB > timeA) return 1;
          if (timeB < timeA) return -1;
          
          return b.createdAt?.seconds - a.createdAt?.seconds || 
                 b.createdAt?.nanoseconds - a.createdAt?.nanoseconds;
        });
        
        set({ appointments: appointmentsData });
        get().calculateStats(userBranch);
        
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
export default function SuperAdminAppointments() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const { 
    appointments, 
    customers,
    isLoading, 
    error, 
    stats,
    fetchAppointments, 
    updateAppointmentStatus,
    setupRealtimeUpdates
  } = useAppointmentsStore();

  // Fetch data on mount and setup real-time updates - only when user is available and hasn't initialized yet
  useEffect(() => {
    if (!user || hasInitialized) return;

    const userBranch = user?.role === 'admin' ? user.branchName : undefined;
    fetchAppointments(userBranch);
    
    const unsubscribe = setupRealtimeUpdates(userBranch);
    setHasInitialized(true);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.email, hasInitialized, fetchAppointments, setupRealtimeUpdates]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get unique branches from appointments - FIXED
  const allBranches = Array.from(
    new Set(
      appointments.flatMap(apt => 
        apt.branchNames && apt.branchNames.length > 0 
          ? apt.branchNames 
          : [apt.branch || 'Main Branch']
      )
    )
  );
  
  // For branch admin, only show their branch
  const branches = user?.role === 'admin' && user.branchName 
    ? [user.branchName]
    : allBranches;

  // Filter appointments - FIXED for branchNames array
  const filteredAppointments = appointments.filter(appointment => {
    const customerPhone = customers[appointment.customerId]?.phone || appointment.customerPhone;
    
    const matchesSearch = 
      appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    const matchesBranch = branchFilter === 'all' || 
      (appointment.branchNames && appointment.branchNames.includes(branchFilter)) ||
      appointment.branch === branchFilter;
    
    const matchesDate = !selectedDate || appointment.date === selectedDate;

    return matchesSearch && matchesStatus && matchesBranch && matchesDate;
  });

  // Status configuration
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: AlertCircle,
      badgeColor: 'bg-yellow-500'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: CheckCircle,
      badgeColor: 'bg-blue-500'
    },
    'in-progress': { 
      label: 'In Progress', 
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      icon: Clock,
      badgeColor: 'bg-purple-500'
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: CheckCircle,
      badgeColor: 'bg-green-500'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: XCircle,
      badgeColor: 'bg-red-500'
    },
    'no-show': { 
      label: 'No Show', 
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      icon: XCircle,
      badgeColor: 'bg-gray-500'
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' }
  ];

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
    } catch (error) {
      alert('Failed to update appointment status. Please try again.');
    }
  };

  // Function to get phone number with fallback - SIMPLIFIED
  const getCustomerPhone = (customerId: string, appointment: Appointment) => {
    // First check appointment data (customerPhone field)
    if (appointment.customerPhone) {
      return appointment.customerPhone;
    }
    
    // Check customer data
    const customer = customers[customerId];
    if (customer && customer.phone) {
      return customer.phone;
    }
    
    return 'N/A';
  };

  // Function to get customer details
  const getCustomerDetails = (customerId: string) => {
    const customer = customers[customerId];
    return customer || null;
  };

  // Get today's date for the date picker
  const today = new Date().toISOString().split('T')[0];

  // Handle refresh button click
  const handleRefresh = () => {
    const userBranch = user?.role === 'admin' ? user.branchName : undefined;
    fetchAppointments(userBranch);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex h-screen bg-gray-50 items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold text-primary">Loading appointments...</p>
            <p className="text-sm text-gray-500">
              {user?.role === 'admin' 
                ? `Fetching appointments for ${user?.branchName || 'your branch'}`
                : 'Fetching real-time data from Firebase'
              }
            </p>
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
          role="branch_admin"
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
                role="branch_admin"
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
                  <h1 className="text-2xl font-bold text-gray-900">Appointments Management</h1>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'super_admin' 
                      ? "Manage appointments across all branches (Real-time Firebase Data)" 
                      : `Managing appointments for ${user?.branchName || 'your branch'}`
                    }
                  </p>
                  {user?.role === 'admin' && user?.branchName && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      🏢 Branch: {user.branchName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleRefresh}
                  variant="outline" 
                  className="gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.email}
                </span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'For your branch' : 'Across all branches'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'At your branch' : 'Registered customers'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'At your branch today' : 'Scheduled for today'}
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
                      {user?.role === 'admin' ? 'From your branch' : 'From completed appointments'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  <div className="text-sm text-yellow-600 font-medium">Pending</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{stats.confirmed}</div>
                  <div className="text-sm text-blue-600 font-medium">Confirmed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-700">{stats.inProgress}</div>
                  <div className="text-sm text-purple-600 font-medium">In Progress</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                  <div className="text-sm text-green-600 font-medium">Completed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
                  <div className="text-sm text-red-600 font-medium">Cancelled</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="text-2xl font-bold text-gray-700">{stats.noShow}</div>
                  <div className="text-sm text-gray-600 font-medium">No Show</div>
                </div>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by customer, service, email, phone or staff..."
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
                    
                    {/* Branch Filter - Disabled for branch admin */}
                    <Select 
                      value={branchFilter} 
                      onValueChange={setBranchFilter}
                      disabled={user?.role === 'admin'}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
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
                    {branchFilter !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Branch: {branchFilter}
                        <button onClick={() => setBranchFilter('all')} className="text-gray-400 hover:text-gray-600">
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
                    {user?.role === 'admin' && (
                      <Badge variant="outline" className="gap-2 bg-blue-50 text-blue-700">
                        <Building className="w-3 h-3" />
                        Branch: {user.branchName || 'Your Branch'}
                      </Badge>
                    )}
                    {(statusFilter !== 'all' || branchFilter !== 'all' || selectedDate || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setStatusFilter('all');
                          setBranchFilter('all');
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

              {/* Appointments List */}
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const status = statusConfig[appointment.status];
                  const StatusIcon = status?.icon || AlertCircle;
                  const customer = getCustomerDetails(appointment.customerId);
                  const customerPhone = getCustomerPhone(appointment.customerId, appointment);
                  
                  return (
                    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Appointment Details */}
                          <div className="flex items-start gap-4 flex-1">
                            {/* Time/Date */}
                            <div className="text-center min-w-[80px]">
                              <div className="text-lg font-bold text-primary">{appointment.time}</div>
                              <div className="text-sm text-gray-500">{appointment.date}</div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                ${appointment.totalAmount}
                              </Badge>
                            </div>
                            
                            {/* Customer & Service Details */}
                            <div className="border-l pl-4 flex-1">
                              {/* Branch - Now shows all branches if multiple */}
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <div className="flex flex-wrap gap-2">
                                  {appointment.branchNames && appointment.branchNames.length > 0 ? (
                                    appointment.branchNames.map((branchName, index) => (
                                      <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                                        {branchName}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm font-medium text-secondary">
                                      {appointment.branch || 'Main Branch'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Customer Name with Status */}
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {appointment.customerName}
                                </h3>
                                {customer && (
                                  <Badge className={cn(
                                    "text-xs",
                                    customer.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  )}>
                                    {customer.status === 'active' ? (
                                      <Check className="w-3 h-3 mr-1" />
                                    ) : (
                                      <X className="w-3 h-3 mr-1" />
                                    )}
                                    {customer.status}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Service Details with Category */}
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>{appointment.serviceName}</strong> • ${appointment.servicePrice}
                                {appointment.serviceDuration && ` • ${appointment.serviceDuration} min`}
                                {appointment.serviceCategory && ` • Category: ${appointment.serviceCategory}`}
                              </p>
                              
                              {/* Staff Info */}
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  <strong>Staff:</strong> {appointment.staffName} 
                                  {appointment.staffRole && ` (${appointment.staffRole})`}
                                </span>
                              </div>
                              
                              {/* Contact Info */}
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                {/* Email */}
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate max-w-[200px]">
                                    {appointment.customerEmail}
                                  </span>
                                </div>
                                
                                {/* Phone */}
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span className="font-medium">
                                    {customerPhone}
                                  </span>
                                </div>
                                
                                {/* Time Slot */}
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Slot: {appointment.timeSlot || appointment.time}</span>
                                </div>
                                
                                {/* Address if available */}
                                {customer?.address && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">
                                      {customer.address}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Additional Service Info */}
                              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <div className="flex flex-wrap gap-3">
                                  {appointment.servicePopularity && (
                                    <span>Popularity: {appointment.servicePopularity}</span>
                                  )}
                                  {appointment.serviceTotalBookings > 0 && (
                                    <span>Total Bookings: {appointment.serviceTotalBookings}</span>
                                  )}
                                  {appointment.pointsAwarded !== undefined && (
                                    <span>Points Awarded: {appointment.pointsAwarded ? 'Yes' : 'No'}</span>
                                  )}
                                </div>
                              </div>

                              {/* Customer Additional Info */}
                              {customer && (
                                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                  <div className="flex flex-wrap gap-3">
                                    {customer.city && (
                                      <span>City: {customer.city}</span>
                                    )}
                                    {customer.country && (
                                      <span>Country: {customer.country}</span>
                                    )}
                                    {customer.role && (
                                      <span>Role: {customer.role}</span>
                                    )}
                                    {customer.lastLogin && (
                                      <span>
                                        Last Login: {customer.lastLogin.toDate().toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[250px]">
                            {/* Status Badge */}
                            <Badge className={cn(
                              "gap-2 px-3 py-1.5 font-medium min-w-[120px] justify-center",
                              status?.color || "bg-gray-100 text-gray-800"
                            )}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{status?.label || appointment.status}</span>
                            </Badge>

                            {/* Status Dropdown */}
                            <Select
                              value={appointment.status}
                              onValueChange={(value) => 
                                handleStatusChange(appointment.id, value as Appointment['status'])
                              }
                            >
                              <SelectTrigger className="w-[180px]">
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
                                      {option.label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Notes */}
                        {appointment.notes && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-600">
                              <strong className="font-medium">Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Technical Info */}
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          <div className="flex flex-wrap gap-4">
                            <span>Appointment ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{appointment.id.substring(0, 8)}...</code></span>
                            <span>Customer ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{appointment.customerId.substring(0, 8)}...</code></span>
                            <span>Service ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{appointment.serviceId.substring(0, 8)}...</code></span>
                            <span>Staff ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{appointment.staffId.substring(0, 8)}...</code></span>
                            <span>
                              Created: {appointment.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* No Results */}
              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || statusFilter !== 'all' || branchFilter !== 'all' || selectedDate
                      ? 'Try adjusting your search or filter criteria.'
                      : `No appointments available for ${user?.branchName || 'your branch'}`
                    }
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('all');
                      setBranchFilter('all');
                      setSelectedDate('');
                      setSearchQuery('');
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="mt-6 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Error loading appointments</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleRefresh} 
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
                    Showing {filteredAppointments.length} of {appointments.length} appointments
                    {user?.role === 'admin' && ` for ${user.branchName}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Object.keys(customers).length} customers loaded from Firebase
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