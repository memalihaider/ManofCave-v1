'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Filter, 
  Download, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Reply,
  MoreVertical,
  Loader2,
  Package,
  Hash,
  DollarSign,
  Box,
  ShoppingBag,
  Tag,
  Building,
  MapPin,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { collection, query, getDocs, updateDoc, doc, where, orderBy, Timestamp } from 'firebase/firestore';

// Firebase Feedback Interface - UPDATED WITH ALL FIELDS
interface Feedback {
  id: string;
  comment: string;
  createdAt: any;
  customerEmail: string;
  customerId: string;
  customerName: string;
  rating: number;
  serviceOrProduct: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'service' | 'product';
  adminReply?: string;
  
  // New fields from your data structure
  pointsAwarded?: boolean;
  productBranchNames?: string[];
  productBranches?: string[];
  productCategory?: string;
  productCategoryId?: string;
  productCost?: number;
  productCreatedAt?: any;
  productDescription?: string;
  productId?: string;
  productImageUrl?: string;
  productName?: string;
  productPrice?: number;
  productRating?: number;
  productRevenue?: number;
  productReviews?: number;
  productSku?: string;
  productStatus?: string;
  productTotalSold?: number;
  productTotalStock?: number;
  productUpdatedAt?: any;
}

export default function AdminFeedbackPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Stats states
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0,
    services: 0,
    products: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalSold: 0
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get user dependencies for useEffect
  const userDependencies = useMemo(() => {
    if (!user) return [null, null, null];
    return [user?.role, user?.branchId, user?.branchName];
  }, [user]);

  // Fetch all feedbacks from Firebase
  useEffect(() => {
    const fetchAllFeedbacks = async () => {
      try {
        setLoading(true);
        const feedbacksRef = collection(db, 'feedbacks');
        
        // Sab feedbacks fetch karein sorted by createdAt
        const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const feedbacksData: Feedback[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const feedback: Feedback = {
            id: doc.id,
            comment: data.comment || '',
            createdAt: data.createdAt,
            customerEmail: data.customerEmail || '',
            customerId: data.customerId || '',
            customerName: data.customerName || '',
            rating: data.rating || 0,
            serviceOrProduct: data.serviceOrProduct || '',
            status: data.status || 'pending',
            type: data.type || 'service',
            adminReply: data.adminReply || '',
            
            // NEW FIELDS ADDED
            pointsAwarded: data.pointsAwarded || false,
            productBranchNames: data.productBranchNames || [],
            productBranches: data.productBranches || [],
            productCategory: data.productCategory || '',
            productCategoryId: data.productCategoryId || '',
            productCost: data.productCost || 0,
            productCreatedAt: data.productCreatedAt || null,
            productDescription: data.productDescription || '',
            productId: data.productId || '',
            productImageUrl: data.productImageUrl || '',
            productName: data.productName || '',
            productPrice: data.productPrice || 0,
            productRating: data.productRating || 0,
            productRevenue: data.productRevenue || 0,
            productReviews: data.productReviews || 0,
            productSku: data.productSku || '',
            productStatus: data.productStatus || '',
            productTotalSold: data.productTotalSold || 0,
            productTotalStock: data.productTotalStock || 0,
            productUpdatedAt: data.productUpdatedAt || null
          };
          
          feedbacksData.push(feedback);
        });
        
        setAllFeedbacks(feedbacksData);
        
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllFeedbacks();
    }
  }, userDependencies);

  // Apply branch filtering when allFeedbacks or user changes
  useEffect(() => {
    if (allFeedbacks.length === 0) return;

    let filteredData = [...allFeedbacks];
    
    // 🔥 CLIENT-SIDE BRANCH FILTERING FOR BRANCH ADMIN
    if (user?.role === 'admin' && user?.branchId) {
      filteredData = allFeedbacks.filter(feedback => 
        feedback.productBranches?.includes(user.branchId as string)
      );
      console.log(`🏢 Branch Admin Client Filter: ${allFeedbacks.length} → ${filteredData.length} feedbacks`);
    } else if (user?.role === 'super_admin') {
      console.log('👑 Super Admin: All feedbacks');
    }
    
    setFeedbacks(filteredData);
    updateStats(filteredData);
    
  }, [allFeedbacks, user]);

  const updateStats = (data: Feedback[]) => {
    const total = data.length;
    const pending = data.filter(f => f.status === 'pending').length;
    const approved = data.filter(f => f.status === 'approved').length;
    const rejected = data.filter(f => f.status === 'rejected').length;
    const services = data.filter(f => f.type === 'service').length;
    const products = data.filter(f => f.type === 'product').length;
    
    let totalProducts = 0;
    let totalRevenue = 0;
    let totalSold = 0;
    
    data.forEach(feedback => {
      if (feedback.type === 'product') {
        totalProducts++;
        totalRevenue += feedback.productRevenue || 0;
        totalSold += feedback.productTotalSold || 0;
      }
    });
    
    const totalRating = data.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = total > 0 ? totalRating / total : 0;
    
    setStats({
      total,
      pending,
      approved,
      rejected,
      averageRating: parseFloat(averageRating.toFixed(2)),
      services,
      products,
      totalProducts,
      totalRevenue,
      totalSold
    });
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingId(id);
      const feedbackRef = doc(db, 'feedbacks', id);
      await updateDoc(feedbackRef, { 
        status,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      const updatedFeedbacks = feedbacks.map(f => 
        f.id === id ? { ...f, status } : f
      );
      setFeedbacks(updatedFeedbacks);
      updateStats(updatedFeedbacks);
      
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddReply = async (id: string) => {
    if (!adminReply.trim()) return;
    
    try {
      setUpdatingId(id);
      const feedbackRef = doc(db, 'feedbacks', id);
      await updateDoc(feedbackRef, { 
        adminReply,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      const updatedFeedbacks = feedbacks.map(f => 
        f.id === id ? { ...f, adminReply } : f
      );
      setFeedbacks(updatedFeedbacks);
      
      setAdminReply('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const refreshFeedbacks = async () => {
    try {
      setLoading(true);
      const feedbacksRef = collection(db, 'feedbacks');
      const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const feedbacksData: Feedback[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const feedback: Feedback = {
          id: doc.id,
          comment: data.comment || '',
          createdAt: data.createdAt,
          customerEmail: data.customerEmail || '',
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          rating: data.rating || 0,
          serviceOrProduct: data.serviceOrProduct || '',
          status: data.status || 'pending',
          type: data.type || 'service',
          adminReply: data.adminReply || '',
          
          // All other fields
          pointsAwarded: data.pointsAwarded || false,
          productBranchNames: data.productBranchNames || [],
          productBranches: data.productBranches || [],
          productCategory: data.productCategory || '',
          productCategoryId: data.productCategoryId || '',
          productCost: data.productCost || 0,
          productCreatedAt: data.productCreatedAt || null,
          productDescription: data.productDescription || '',
          productId: data.productId || '',
          productImageUrl: data.productImageUrl || '',
          productName: data.productName || '',
          productPrice: data.productPrice || 0,
          productRating: data.productRating || 0,
          productRevenue: data.productRevenue || 0,
          productReviews: data.productReviews || 0,
          productSku: data.productSku || '',
          productStatus: data.productStatus || '',
          productTotalSold: data.productTotalSold || 0,
          productTotalStock: data.productTotalStock || 0,
          productUpdatedAt: data.productUpdatedAt || null
        };
        
        feedbacksData.push(feedback);
      });
      
      setAllFeedbacks(feedbacksData);
      
    } catch (error) {
      console.error('Error refreshing feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMinutes > 0) return `${diffMinutes}m ago`;
      return 'Just now';
    } catch {
      return 'Some time ago';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'product': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBranchColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-pink-100 text-pink-700 border-pink-200'
    ];
    return colors[index % colors.length];
  };

  // Filter feedbacks (client-side for search, etc.)
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.serviceOrProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productBranchNames?.some(branch => 
        branch.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesType = filterType === 'all' || feedback.type === filterType;
    const matchesRating = filterRating === 'all' || 
      (filterRating === '5' && feedback.rating === 5) ||
      (filterRating === '4' && feedback.rating === 4) ||
      (filterRating === '3' && feedback.rating === 3) ||
      (filterRating === '2' && feedback.rating === 2) ||
      (filterRating === '1' && feedback.rating === 1);
    
    return matchesSearch && matchesStatus && matchesType && matchesRating;
  });

  const downloadCSV = () => {
    let csv = 'ID,Customer Name,Customer Email,Rating,Type,Service/Product,Product Name,Product SKU,Product Category,Product Price,Product Stock,Product Sold,Product Status,Branch Names,Comment,Status,Created At,Admin Reply,Points Awarded\n';
    
    filteredFeedbacks.forEach(feedback => {
      const branchNames = feedback.productBranchNames?.join(', ') || '';
      csv += `"${feedback.id}","${feedback.customerName}","${feedback.customerEmail}",${feedback.rating},${feedback.type},"${feedback.serviceOrProduct}","${feedback.productName || ''}","${feedback.productSku || ''}","${feedback.productCategory || ''}",${feedback.productPrice || 0},${feedback.productTotalStock || 0},${feedback.productTotalSold || 0},"${feedback.productStatus || ''}","${branchNames}","${feedback.comment.replace(/"/g, '""')}",${feedback.status},"${formatDate(feedback.createdAt)}","${feedback.adminReply || ''}","${feedback.pointsAwarded ? 'Yes' : 'No'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
                      ? `Branch Feedback Management` 
                      : 'Customer Feedback Management'
                    }
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === 'admin' && user?.branchName
                      ? `Managing feedbacks for ${user.branchName} branch`
                      : 'Manage and respond to customer reviews and feedback'
                    }
                  </p>
                  {user?.role === 'admin' && user?.branchName && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Building className="w-3 h-3 mr-1" />
                        Branch: {user.branchName}
                      </Badge>
                    </div>
                  )}
                  {user?.role === 'admin' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing only feedbacks for your branch
                    </p>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 rounded-lg">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="feedbacks">
                    {user?.role === 'admin' 
                      ? `Branch Feedbacks (${feedbacks.length})`
                      : `All Feedback (${feedbacks.length})`
                    }
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              {user?.role === 'admin' ? 'Branch Feedback' : 'Total Feedback'}
                            </p>
                            <p className="text-3xl font-serif font-bold text-primary">{stats.total}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {user?.role === 'admin' ? 'For your branch' : 'All time reviews'}
                            </p>
                          </div>
                          <MessageSquare className="w-12 h-12 text-secondary/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Average Rating</p>
                            <div className="flex items-center gap-2">
                              <p className="text-3xl font-serif font-bold text-primary">{stats.averageRating}/5</p>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "w-4 h-4",
                                      star <= Math.round(stats.averageRating) 
                                        ? "fill-yellow-500 text-yellow-500" 
                                        : "text-gray-300"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Overall satisfaction</p>
                          </div>
                          <Star className="w-12 h-12 text-yellow-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Pending Reviews</p>
                            <p className="text-3xl font-serif font-bold text-yellow-600">{stats.pending}</p>
                            <p className="text-sm text-muted-foreground mt-1">Awaiting action</p>
                          </div>
                          <Clock className="w-12 h-12 text-yellow-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Approved Rate</p>
                            <p className="text-3xl font-serif font-bold text-green-600">
                              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {stats.approved} of {stats.total} approved
                            </p>
                          </div>
                          <ThumbsUp className="w-12 h-12 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Product Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Products</p>
                            <p className="text-3xl font-serif font-bold text-purple-600">{stats.totalProducts}</p>
                            <p className="text-sm text-muted-foreground mt-1">Product feedbacks</p>
                          </div>
                          <Package className="w-12 h-12 text-purple-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Sold</p>
                            <p className="text-3xl font-serif font-bold text-blue-600">{stats.totalSold}</p>
                            <p className="text-sm text-muted-foreground mt-1">Units sold</p>
                          </div>
                          <ShoppingBag className="w-12 h-12 text-blue-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Product Revenue</p>
                            <p className="text-3xl font-serif font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground mt-1">From reviewed products</p>
                          </div>
                          <DollarSign className="w-12 h-12 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Distribution Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Distribution */}
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-secondary" />
                          Status Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-sm">Pending</span>
                            </div>
                            <span className="font-bold">{stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-sm">Approved</span>
                            </div>
                            <span className="font-bold">{stats.approved} ({stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-sm">Rejected</span>
                            </div>
                            <span className="font-bold">{stats.rejected} ({stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Type Distribution */}
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-secondary" />
                          Type Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-sm">Services</span>
                            </div>
                            <span className="font-bold">{stats.services} ({stats.total > 0 ? Math.round((stats.services / stats.total) * 100) : 0}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="text-sm">Products</span>
                            </div>
                            <span className="font-bold">{stats.products} ({stats.total > 0 ? Math.round((stats.products / stats.total) * 100) : 0}%)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rating Distribution */}
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          <Star className="w-5 h-5 text-secondary" />
                          Rating Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = feedbacks.filter(f => f.rating === rating).length;
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                              <div key={rating} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            "w-4 h-4",
                                            star <= rating 
                                              ? "fill-yellow-500 text-yellow-500" 
                                              : "text-gray-300"
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm">{rating} stars</span>
                                  </div>
                                  <span className="font-bold">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Feedbacks Tab */}
                <TabsContent value="feedbacks" className="space-y-6">
                  {/* Filters and Search */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by customer, product, SKU, branch, or comment..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 rounded-lg border-gray-200"
                        />
                      </div>
                      
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40 rounded-lg border-gray-200">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <SelectValue placeholder="Status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40 rounded-lg border-gray-200">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterRating} onValueChange={setFilterRating}>
                        <SelectTrigger className="w-40 rounded-lg border-gray-200">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ratings</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={refreshFeedbacks}
                        variant="outline"
                        className="border-gray-200 rounded-lg flex items-center gap-2"
                      >
                        <Loader2 className="w-4 h-4" /> Refresh
                      </Button>
                      <Button
                        onClick={downloadCSV}
                        variant="outline"
                        className="border-gray-200 rounded-lg flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Export CSV
                      </Button>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                      <p className="text-lg font-serif text-primary">Loading feedbacks...</p>
                    </div>
                  ) : filteredFeedbacks.length === 0 ? (
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No feedbacks found</h3>
                        <p className="text-gray-500">
                          {user?.role === 'admin' 
                            ? `No feedbacks found for ${user.branchName} branch`
                            : 'Try adjusting your filters or search query'
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredFeedbacks.map((feedback) => (
                        <Card key={feedback.id} className="border-none shadow-sm rounded-xl overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Left Column - Customer Info & Rating */}
                              <div className="lg:w-1/4 space-y-4">
                                {/* Customer Info */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold">{feedback.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600 truncate">{feedback.customerEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {getTimeAgo(feedback.createdAt)}
                                  </div>
                                  
                                  {/* Points Awarded */}
                                  {feedback.pointsAwarded && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full">
                                      ✓ Points Awarded
                                    </Badge>
                                  )}
                                
                                </div>

                                {/* Rating */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            "w-4 h-4",
                                            star <= feedback.rating 
                                              ? "fill-yellow-500 text-yellow-500" 
                                              : "text-gray-300"
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <Badge className={cn("rounded-full", getRatingColor(feedback.rating))}>
                                      {feedback.rating}/5
                                    </Badge>
                                  </div>
                                </div>

                                {/* Type Badge */}
                                <Badge className={cn("rounded-full", getTypeColor(feedback.type))}>
                                  {feedback.type === 'service' ? 'Service' : 'Product'}
                                </Badge>

                                {/* Status Badge */}
                                <Badge className={cn("rounded-full", getStatusColor(feedback.status))}>
                                  {feedback.status}
                                </Badge>
                              </div>

                              {/* Middle Column - Content */}
                              <div className="lg:w-1/2 space-y-4">
                                {/* Service/Product */}
                                <div>
                                  <h3 className="font-serif font-bold text-lg text-primary mb-2">
                                    {feedback.serviceOrProduct}
                                  </h3>
                                  
                                  {/* Branch Names Section - NEW */}
                                  {feedback.productBranchNames && feedback.productBranchNames.length > 0 && (
                                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <GitBranch className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-semibold text-blue-800">Available Branches:</h4>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {feedback.productBranchNames.map((branchName, index) => (
                                          <Badge 
                                            key={index} 
                                            className={cn("rounded-full flex items-center gap-1", getBranchColor(index))}
                                          >
                                            <Building className="w-3 h-3" />
                                            {branchName}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Product Details */}
                                  {feedback.type === 'product' && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                        <div className="flex items-center gap-2">
                                          <Hash className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <span className="font-semibold text-gray-600">SKU:</span>
                                            <span className="ml-2">{feedback.productSku || 'N/A'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Tag className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <span className="font-semibold text-gray-600">Category:</span>
                                            <span className="ml-2">{feedback.productCategory || 'N/A'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="w-4 h-4 text-gray-500" />
                                          <div>
                                            <span className="font-semibold text-gray-600">Price:</span>
                                            <span className="ml-2">${feedback.productPrice?.toFixed(2) || '0.00'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div>
                                            <span className="font-semibold text-gray-600">Status:</span>
                                            <Badge className={`ml-2 ${
                                              feedback.productStatus === 'active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : feedback.productStatus === 'inactive'
                                                ? 'bg-gray-100 text-gray-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                              {feedback.productStatus || 'N/A'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Product Image */}
                                      {feedback.productImageUrl && (
                                        <div className="mt-3">
                                          <p className="text-sm font-semibold text-gray-600 mb-2">Product Image:</p>
                                          <img 
                                            src={feedback.productImageUrl} 
                                            alt={feedback.productName || 'Product'}
                                            className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Comment */}
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 italic">"{feedback.comment}"</p>
                                  </div>

                                  {/* Admin Reply */}
                                  {feedback.adminReply && (
                                    <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Reply className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-900">Admin Response:</span>
                                      </div>
                                      <p className="text-blue-800">{feedback.adminReply}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column - Actions */}
                              <div className="lg:w-1/4 space-y-4">
                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  {feedback.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleUpdateStatus(feedback.id, 'approved')}
                                        disabled={updatingId === feedback.id}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                                      >
                                        {updatingId === feedback.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4" />
                                        )}
                                        Approve
                                      </Button>
                                      <Button
                                        onClick={() => handleUpdateStatus(feedback.id, 'rejected')}
                                        disabled={updatingId === feedback.id}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                      >
                                        {updatingId === feedback.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <XCircle className="w-4 h-4" />
                                        )}
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  
                                  {/* Reply Button */}
                                  {feedback.status === 'approved' && !feedback.adminReply && (
                                    <Button
                                      onClick={() => setReplyingTo(feedback.id)}
                                      variant="outline"
                                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                                    >
                                      <Reply className="w-4 h-4" />
                                      Reply to Customer
                                    </Button>
                                  )}
                                </div>

                                {/* Quick Reply Form */}
                                {replyingTo === feedback.id && (
                                  <div className="space-y-2">
                                    <Textarea
                                      placeholder="Type your response to the customer..."
                                      value={adminReply}
                                      onChange={(e) => setAdminReply(e.target.value)}
                                      className="rounded-lg min-h-[100px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleAddReply(feedback.id)}
                                        disabled={updatingId === feedback.id}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                      >
                                        {updatingId === feedback.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          'Send Reply'
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setAdminReply('');
                                        }}
                                        variant="outline"
                                        className="rounded-lg"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Summary Card */}
                  {filteredFeedbacks.length > 0 && (
                    <Card className="border-none shadow-sm rounded-xl mt-8">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Showing</p>
                            <p className="text-2xl font-bold text-primary">{filteredFeedbacks.length}</p>
                            <p className="text-xs text-muted-foreground">
                              {user?.role === 'admin' ? 'branch feedbacks' : 'feedbacks'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Avg Rating</p>
                            <p className="text-2xl font-bold text-primary">
                              {filteredFeedbacks.length > 0 
                                ? (filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length).toFixed(2)
                                : '0.00'
                              }/5
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {filteredFeedbacks.filter(f => f.status === 'pending').length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Replied</p>
                            <p className="text-2xl font-bold text-green-600">
                              {filteredFeedbacks.filter(f => f.adminReply).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}