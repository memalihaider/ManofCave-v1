'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tag, Plus, Edit, MoreVertical, Search, Filter, Upload, Link, X, Check, Trash2, Eye, EyeOff, Building, Package, FileText, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Firebase imports
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unsubscribe } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  description: string;
  type: 'product' | 'service';
  branchId?: string;
  branchName?: string;
  branchCity?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export default function SuperAdminCategories() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states - AUTO SELECT BRANCH FOR BRANCH ADMIN
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'product' as 'product' | 'service',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : 'global',
    image: '',
    isActive: true
  });

  // 🔥 Firebase se real-time categories fetch - BRANCH FILTER ADDED
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesRef = collection(db, 'categories');
        
        // Create query based on user role
        let q;
        
        if (user?.role === 'super_admin') {
          // Super admin - sab categories dekhe
          q = query(categoriesRef, orderBy('createdAt', 'desc'));
          console.log('👑 Super Admin: All categories');
        } else {
          // Default - all categories (client side filter lagayenge)
          q = query(categoriesRef, orderBy('createdAt', 'desc'));
        }
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const categoriesData: Category[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            categoriesData.push({
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              type: data.type || 'product',
              branchId: data.branchId || undefined,
              branchName: data.branchName || undefined,
              branchCity: data.branchCity || undefined,
              image: data.image || '',
              isActive: data.isActive !== false,
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          // BRANCH ADMIN FILTER - Client side filter
          let filteredCategories = categoriesData;
          
          if (user?.role === 'admin' && user?.branchId) {
            // Branch admin sirf apni branch ke categories dekhe
            // INCLUDING global categories (jo kisi branch se assign nahi hain)
            filteredCategories = categoriesData.filter(category => 
              !category.branchId || category.branchId === user.branchId
            );
            console.log(`🏢 Branch Filter: ${categoriesData.length} → ${filteredCategories.length} categories`);
          }
          
          setCategories(filteredCategories);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching categories: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchCategories: ", error);
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);
        const branchesRef = collection(db, 'branches');
        
        let q;
        if (user?.role === 'super_admin') {
          q = query(branchesRef, orderBy('name'));
        } else if (user?.role === 'admin' && user?.branchId) {
          // Branch admin - sirf apni branch ka data
          q = query(
            branchesRef, 
            where('id', '==', user.branchId)
          );
        } else {
          q = query(branchesRef, orderBy('name'));
        }
        
        onSnapshot(q, (snapshot) => {
          const branchesData: Branch[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            
            branchesData.push({
              id: doc.id,
              name: data.name || '',
              address: data.address || '',
              city: data.city || '',
              country: data.country || '',
              phone: data.phone || '',
              email: data.email || '',
              status: data.status || 'active',
              createdAt: createdAt?.toDate() || new Date()
            });
          });
          
          // Client-side sorting
          const sortedBranches = branchesData.sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          
          setBranches(sortedBranches);
          setBranchesLoading(false);
        }, (error) => {
          console.error("Error fetching branches: ", error);
          setBranchesLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchBranches: ", error);
        setBranchesLoading(false);
      }
    };

    if (user) {
      fetchCategories();
      fetchBranches();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'product',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : 'global',
      image: '',
      isActive: true
    });
  };

  // 🔥 Add Category to Firebase (WITH BRANCH AUTO-SELECT FOR BRANCH ADMIN)
  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const categoriesRef = collection(db, 'categories');
      
      // Find selected branch details
      let selectedBranch = null;
      if (formData.branchId !== 'global') {
        selectedBranch = branches.find(b => b.id === formData.branchId);
      }
      
      const newCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        branchId: formData.branchId === 'global' ? null : formData.branchId,
        branchName: selectedBranch ? selectedBranch.name : null,
        branchCity: selectedBranch ? selectedBranch.city : null,
        image: formData.image.trim(),
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(categoriesRef, newCategoryData);
      
      setAddDialogOpen(false);
      resetForm();
      alert('Category added successfully!');
      
    } catch (error) {
      console.error("Error adding category: ", error);
      alert('Error adding category. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Category in Firebase (WITH BRANCH AUTO-SELECT FOR BRANCH ADMIN)
  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsEditing(true);
    try {
      const categoryDoc = doc(db, 'categories', selectedCategory.id);
      
      // Find selected branch details
      let selectedBranch = null;
      if (formData.branchId !== 'global') {
        selectedBranch = branches.find(b => b.id === formData.branchId);
      }
      
      await updateDoc(categoryDoc, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        branchId: formData.branchId === 'global' ? null : formData.branchId,
        branchName: selectedBranch ? selectedBranch.name : null,
        branchCity: selectedBranch ? selectedBranch.city : null,
        image: formData.image.trim(),
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      });
      
      setEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      alert('Category updated successfully!');
      
    } catch (error) {
      console.error("Error updating category: ", error);
      alert('Error updating category. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Category from Firebase
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setIsDeleting(selectedCategory.id);
    try {
      const categoryDoc = doc(db, 'categories', selectedCategory.id);
      await deleteDoc(categoryDoc);
      
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      alert('Category deleted successfully!');
    } catch (error) {
      console.error("Error deleting category: ", error);
      alert('Error deleting category. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      type: category.type,
      branchId: category.branchId || 'global',
      image: category.image || '',
      isActive: category.isActive
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Filter categories for display
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || category.type === typeFilter;
    const matchesBranch = branchFilter === 'all' ||
                         (branchFilter === 'global' && !category.branchId) ||
                         category.branchId === branchFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && category.isActive) ||
                         (statusFilter === 'inactive' && !category.isActive);

    return matchesSearch && matchesType && matchesBranch && matchesStatus;
  });

  // Get branch info for display
  const getBranchInfo = (category?: Category) => {
    if (!category) return 'Loading...';
    
    if (!category.branchId) return 'Global Category';
    
    if (category.branchName) {
      const locationParts = [];
      if (category.branchCity) locationParts.push(category.branchCity);
      return `${category.branchName}${locationParts.length > 0 ? ` (${locationParts.join(', ')})` : ''}`;
    }
    
    return `Branch (${category.branchId?.substring(0, 8)}...)`;
  };

  // Stats calculations - BRANCH SPECIFIC
  const branchCategories = user?.role === 'admin' && user?.branchId 
    ? categories.filter(cat => !cat.branchId || cat.branchId === user.branchId)
    : categories;

  const productCategories = branchCategories.filter(cat => cat.type === 'product');
  const serviceCategories = branchCategories.filter(cat => cat.type === 'service');
  const globalCategories = branchCategories.filter(cat => !cat.branchId);
  const activeCategories = branchCategories.filter(cat => cat.isActive);
  const branchSpecificCategories = branchCategories.filter(cat => cat.branchId);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Add Dialog ko open karne par form reset
  const handleAddDialogOpen = (open: boolean) => {
    if (open) {
      resetForm();
    }
    setAddDialogOpen(open);
  };

  // Render loading state
  if (loading && categories.length === 0) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar role="branch_admin" onLogout={handleLogout} />
        </div>

        {/* Mobile Sidebar Sheet */}
        <AdminMobileSidebar
          role="branch_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
                <p className="text-sm text-gray-600">
                  {user?.role === 'super_admin' 
                    ? "Manage categories across all branches" 
                    : `Managing categories for ${user?.branchName || 'your branch'}`
                  }
                </p>
                {user?.role === 'admin' && user?.branchName && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    🏢 Branch: {user.branchName}
                  </p>
                )}
                {loading && categories.length > 0 && (
                  <div className="flex items-center mt-1">
                    <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                    <span className="text-xs text-gray-500">Syncing...</span>
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </header>

          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Branch Filter */}
              <Select 
                value={branchFilter} 
                onValueChange={setBranchFilter} 
                disabled={loading || branchesLoading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="global">Global Categories</SelectItem>
                  {user?.role === 'super_admin' ? (
                    // Super admin ke liye sab branches
                    branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))
                  ) : user?.role === 'admin' && user?.branchId ? (
                    // Branch admin ke liye sirf uski branch
                    branches
                      .filter(branch => branch.id === user.branchId)
                      .map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))
                  ) : (
                    // Default fallback
                    branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Tag className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{branchCategories.length}</p>
                      <p className="text-xs text-gray-500">
                        {user?.role === 'admin' ? 'Your branch only' : 'All branches'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Product Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{productCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Tag className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Service Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{serviceCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Building className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Branch Specific</p>
                      <p className="text-2xl font-bold text-gray-900">{branchSpecificCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Check className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{activeCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="flex-1 overflow-auto px-6 pb-6">
            {loading && categories.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || typeFilter !== 'all' || branchFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : `No categories found for ${user?.branchName || 'your branch'}`
                  }
                </p>
                {!searchTerm && typeFilter === 'all' && branchFilter === 'all' && statusFilter === 'all' && (
                  <Button onClick={() => handleAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${category.image ? 'hidden fallback' : ''}`}>
                            <Tag className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={category.type === 'product' ? 'default' : 'secondary'}>
                                {category.type}
                              </Badge>
                              <Badge variant={category.isActive ? 'default' : 'outline'}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {getBranchInfo(category)}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isDeleting === category.id}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(category)} disabled={isDeleting === category.id}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const categoryDoc = doc(db, 'categories', category.id);
                                updateDoc(categoryDoc, { 
                                  isActive: !category.isActive,
                                  updatedAt: serverTimestamp()
                                });
                              }}
                              disabled={isDeleting === category.id}
                            >
                              {category.isActive ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(category)}
                              className="text-red-600"
                              disabled={isDeleting === category.id}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-gray-600 mb-4">
                        {category.description}
                      </CardDescription>
                      <div className="text-xs text-gray-500">
                        Created: {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Sheet */}
      <Sheet open={addDialogOpen} onOpenChange={handleAddDialogOpen}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Add New Category</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      {user?.role === 'admin' 
                        ? `Add a new category to ${user?.branchName || 'your branch'}`
                        : 'Create a new category for products or services. Choose a branch or leave empty for global category.'
                      }
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Category Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Category Type *
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'product' | 'service') =>
                          setFormData(prev => ({ ...prev, type: value }))
                        }
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product Category</SelectItem>
                          <SelectItem value="service">Service Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="branch" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Branch Assignment
                      </Label>
                      <Select
                        value={formData.branchId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
                        disabled={isAdding || user?.role === 'admin'} // ✅ Branch admin ke liye disabled
                      >
                        <SelectTrigger className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select branch (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">All Branches (Global)</SelectItem>
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                {branch.name}
                                {branch.city && (
                                  <span className="text-xs text-gray-500 ml-1">({branch.city})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {user?.role === 'admin' && (
                        <p className="text-xs text-gray-500 mt-1">
                          You can only add categories to your assigned branch: <strong>{user.branchName}</strong>
                        </p>
                      )}
                      {user?.role === 'super_admin' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {branchesLoading 
                            ? "Loading branches..." 
                            : formData.branchId === 'global' 
                              ? "This category will be available in all branches"
                              : "This category will only be available in the selected branch"
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter category description"
                        rows={3}
                        className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="image" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Enter image URL"
                        className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isAdding}
                      />
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Check className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Settings</h3>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Active Category
                        </Label>
                        <p className="text-xs text-gray-600">Make this category available for use</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only"
                        disabled={isAdding}
                      />
                      <div
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer",
                          formData.isActive ? "bg-green-500" : "bg-gray-300",
                          isAdding ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        onClick={() => !isAdding && setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
                            formData.isActive ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  disabled={isAdding}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCategory}
                  disabled={isAdding || !formData.name.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Category Sheet */}
      <Sheet open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedCategory(null);
          resetForm();
        }
        setEditDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                    <Edit className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Edit Category</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Update category information and settings.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Category Name *
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        className="mt-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Category Type *
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'product' | 'service') =>
                          setFormData(prev => ({ ...prev, type: value }))
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product Category</SelectItem>
                          <SelectItem value="service">Service Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-branch" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Branch Assignment
                      </Label>
                      <Select
                        value={formData.branchId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
                        disabled={isEditing || user?.role === 'admin'} // ✅ Branch admin ke liye disabled
                      >
                        <SelectTrigger className="mt-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                          <SelectValue placeholder="Select branch (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">All Branches (Global)</SelectItem>
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                {branch.name}
                                {branch.city && (
                                  <span className="text-xs text-gray-500 ml-1">({branch.city})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {user?.role === 'admin' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Category is locked to your branch: <strong>{user.branchName}</strong>
                        </p>
                      )}
                      {user?.role === 'super_admin' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {branchesLoading 
                            ? "Loading branches..." 
                            : formData.branchId === 'global' 
                              ? "This category will be available in all branches"
                              : "This category will only be available in the selected branch"
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter category description"
                        rows={3}
                        className="mt-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-image" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Image URL
                      </Label>
                      <Input
                        id="edit-image"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Enter image URL"
                        className="mt-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled={isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Check className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Settings</h3>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="edit-isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Active Category
                        </Label>
                        <p className="text-xs text-gray-600">Make this category available for use</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="edit-isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only"
                        disabled={isEditing}
                      />
                      <div
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer",
                          formData.isActive ? "bg-green-500" : "bg-gray-300",
                          isEditing ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        onClick={() => !isEditing && setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
                            formData.isActive ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedCategory(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  disabled={isEditing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditCategory}
                  disabled={isEditing || !formData.name.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedCategory(null);
        }
        setDeleteDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Delete Category</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      This action cannot be undone.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Are you sure you want to delete this category?
                    </h3>
                    <p className="text-red-700 mb-4">
                      This will permanently delete <strong>"{selectedCategory?.name}"</strong> and remove it from all branches.
                      Any products or services in this category will need to be reassigned.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-red-300">
                      <div className="flex items-center gap-3">
                        {selectedCategory?.image ? (
                          <img
                            src={selectedCategory.image}
                            alt={selectedCategory.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${selectedCategory?.image ? 'hidden fallback' : ''}`}>
                          <Tag className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedCategory?.name}</p>
                          <p className="text-sm text-gray-600">{selectedCategory?.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={selectedCategory?.type === 'product' ? 'default' : 'secondary'} className="text-xs">
                              {selectedCategory?.type}
                            </Badge>
                            <Badge variant={selectedCategory?.isActive ? 'default' : 'outline'} className="text-xs">
                              {selectedCategory?.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedCategory(null);
                  }}
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  disabled={isDeleting === selectedCategory?.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCategory}
                  disabled={isDeleting === selectedCategory?.id}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isDeleting === selectedCategory?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Category
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}