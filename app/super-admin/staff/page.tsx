'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Star, Clock, Phone, Mail, Plus, Edit, MoreVertical, 
  Search, Filter, Building, Trash2, X, Loader2, Check,
  TrendingUp, FileText, Upload, Eye, EyeOff, Calendar,
  Globe, CreditCard, File, Flag, UserCheck, Shield, AlertCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unsubscribe } from 'firebase/firestore';

export interface Staff {
  id: string;
  name: string;
  role: string;
  branch: string;
  email: string;
  phone: string;
  rating: number;
  reviews: number;
  experience: string;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  salary: number;
  avatar?: string;
  address: string;
  description: string;
  specialization: string[];
  
  // New fields
  documentId?: string;
  visaExpiry?: string;
  nationality?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  gender?: 'male' | 'female' | 'other';
  
  createdAt: Date;
  updatedAt?: Date;
}

export default function SuperAdminStaff() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    branch: '',
    email: '',
    phone: '',
    rating: 4.5,
    reviews: 0,
    experience: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 0,
    avatar: '',
    address: '',
    description: '',
    specialization: [] as string[],
    
    // New form fields
    documentId: '',
    visaExpiry: '',
    nationality: '',
    emergencyContact: '',
    bloodGroup: '',
    dateOfBirth: '',
    maritalStatus: 'single' as 'single' | 'married' | 'divorced' | 'widowed',
    gender: 'male' as 'male' | 'female' | 'other'
  });

  // Fetch branches for dropdown
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  // 🔥 Firebase se real-time staff fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        const staffRef = collection(db, 'staff');
        const q = query(staffRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const staffData: Staff[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            staffData.push({
              id: doc.id,
              name: data.name || '',
              role: data.role || '',
              branch: data.branch || '',
              email: data.email || '',
              phone: data.phone || '',
              rating: data.rating || 0,
              reviews: data.reviews || 0,
              experience: data.experience || '',
              status: data.status || 'active',
              hireDate: data.hireDate || new Date().toISOString().split('T')[0],
              salary: data.salary || 0,
              avatar: data.avatar || '',
              address: data.address || '',
              description: data.description || '',
              specialization: data.specialization || [],
              
              // New fields
              documentId: data.documentId || '',
              visaExpiry: data.visaExpiry || '',
              nationality: data.nationality || '',
              emergencyContact: data.emergencyContact || '',
              bloodGroup: data.bloodGroup || '',
              dateOfBirth: data.dateOfBirth || '',
              maritalStatus: data.maritalStatus || 'single',
              gender: data.gender || 'male',
              
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          setStaff(staffData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching staff: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchStaff: ", error);
        setLoading(false);
      }
    };

    // Fetch branches
    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        onSnapshot(branchesRef, (snapshot) => {
          const branchesData: {id: string, name: string}[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            branchesData.push({
              id: doc.id,
              name: data.name || 'Unknown Branch'
            });
          });
          setBranches(branchesData);
        });
      } catch (error) {
        console.error("Error fetching branches: ", error);
      }
    };

    fetchStaff();
    fetchBranches();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      branch: '',
      email: '',
      phone: '',
      rating: 4.5,
      reviews: 0,
      experience: '',
      status: 'active',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      avatar: '',
      address: '',
      description: '',
      specialization: [],
      
      // New fields reset
      documentId: '',
      visaExpiry: '',
      nationality: '',
      emergencyContact: '',
      bloodGroup: '',
      dateOfBirth: '',
      maritalStatus: 'single',
      gender: 'male'
    });
  };

  // 🔥 Add Staff to Firebase
  const handleAddStaff = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const staffRef = collection(db, 'staff');
      const newStaffData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const staffDocRef = await addDoc(staffRef, newStaffData);
      
      // If this is a branch admin, create an automatic chat conversation
      if (formData.role === 'branch_admin' && user?.id) {
        const conversationsRef = collection(db, 'conversations');
        const newConversation = {
          id: `admin-${staffDocRef.id}`,
          customerId: staffDocRef.id,
          staffEmail: formData.email, // Store the staff email for matching
          customerName: formData.name,
          customerPhone: formData.phone || '',
          customerEmail: formData.email || '',
          branchId: formData.branch || '',
          superAdminId: user.id,
          superAdminName: user.email || 'Super Admin',
          staffId: formData.email, // Also store email as staffId for matching
          type: 'admin-to-branch', // Special type for admin conversations
          unreadCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        try {
          await addDoc(conversationsRef, newConversation);
          console.log('✅ Automatic chat conversation created for branch admin:', formData.name);
        } catch (chatError) {
          console.error('⚠️ Error creating chat conversation:', chatError);
          // Don't fail the staff creation if chat creation fails
        }
      }
      
      setAddDialogOpen(false);
      resetForm();
      alert('Staff added successfully!' + (formData.role === 'branch_admin' ? ' Chat conversation has been created.' : ''));
      
    } catch (error) {
      console.error("Error adding staff: ", error);
      alert('Error adding staff. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Staff in Firebase
  const handleEditStaff = async () => {
    if (!selectedStaff || !formData.name.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsEditing(true);
    try {
      const staffDoc = doc(db, 'staff', selectedStaff.id);
      await updateDoc(staffDoc, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      setEditDialogOpen(false);
      setSelectedStaff(null);
      resetForm();
      alert('Staff updated successfully!');
      
    } catch (error) {
      console.error("Error updating staff: ", error);
      alert('Error updating staff. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Staff from Firebase
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setIsDeleting(selectedStaff.id);
    try {
      const staffDoc = doc(db, 'staff', selectedStaff.id);
      await deleteDoc(staffDoc);
      
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
      alert('Staff deleted successfully!');
    } catch (error) {
      console.error("Error deleting staff: ", error);
      alert('Error deleting staff. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      branch: staff.branch,
      email: staff.email,
      phone: staff.phone,
      rating: staff.rating,
      reviews: staff.reviews,
      experience: staff.experience,
      status: staff.status,
      hireDate: staff.hireDate,
      salary: staff.salary,
      avatar: staff.avatar || '',
      address: staff.address,
      description: staff.description,
      specialization: staff.specialization,
      
      // New fields
      documentId: staff.documentId || '',
      visaExpiry: staff.visaExpiry || '',
      nationality: staff.nationality || '',
      emergencyContact: staff.emergencyContact || '',
      bloodGroup: staff.bloodGroup || '',
      dateOfBirth: staff.dateOfBirth || '',
      maritalStatus: staff.maritalStatus || 'single',
      gender: staff.gender || 'male'
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  const roles = [...new Set(staff.map(member => member.role))];
  const nationalities = [...new Set(staff.map(member => member.nationality).filter(Boolean))] as string[];

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.documentId && member.documentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBranch = branchFilter === 'all' || member.branch === branchFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesNationality = nationalityFilter === 'all' || member.nationality === nationalityFilter;
    return matchesSearch && matchesBranch && matchesRole && matchesStatus && matchesNationality;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVisaStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return 'not_set';
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'valid';
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const activeStaff = staff.filter(s => s.status === 'active');
  const inactiveStaff = staff.filter(s => s.status === 'inactive');
  const onLeaveStaff = staff.filter(s => s.status === 'on_leave');

  // Staff with expired/expiring visa
  const visaExpiringSoon = staff.filter(member => {
    const status = getVisaStatus(member.visaExpiry);
    return status === 'expiring_soon' || status === 'expired';
  });

  // Render loading state
  if (loading && staff.length === 0) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading staff...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar role="super_admin" onLogout={handleLogout} />
        </div>

        {/* Mobile Sidebar Sheet */}
        <AdminMobileSidebar 
          role="super_admin" 
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-sm text-gray-600">Manage staff across all branches</p>
                  {loading && staff.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Syncing...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setAddDialogOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{staff.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeStaff.length} active • {onLeaveStaff.length} on leave
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visa Status</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{visaExpiringSoon.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Expiring/Expired visas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {staff.length > 0 
                        ? (staff.reduce((acc, member) => acc + member.rating, 0) / staff.length).toFixed(1)
                        : '0.0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Team performance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${staff.length > 0 
                        ? (staff.reduce((acc, member) => acc + member.salary, 0) / staff.length / 1000).toFixed(0)
                        : '0'}k
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Annual salary
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by name, email, role, or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:flex gap-4">
                      <Select value={branchFilter} onValueChange={setBranchFilter} disabled={loading}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={roleFilter} onValueChange={setRoleFilter} disabled={loading}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={nationalityFilter} onValueChange={setNationalityFilter} disabled={loading}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Nationalities</SelectItem>
                          {nationalities.filter(Boolean).map(nat => (
                            <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStaff.map((member) => {
                  const visaStatus = getVisaStatus(member.visaExpiry);
                  return (
                    <Card key={member.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                              <Badge className={`absolute -bottom-1 -right-1 ${getStatusColor(member.status)}`}>
                                {member.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-xl text-primary">{member.name}</CardTitle>
                                {member.nationality && (
                                  <Badge variant="outline" className="text-xs">
                                    <Flag className="w-3 h-3 mr-1" />
                                    {member.nationality}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-secondary font-medium">{member.role}</CardDescription>
                              <div className="flex items-center gap-2 mt-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{member.branch}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold">{member.rating}</span>
                                  <span className="text-gray-500">({member.reviews} reviews)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Manage Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <File className="w-4 h-4 mr-2" />
                                  View Documents
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => openDeleteDialog(member)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Staff
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Basic Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Contact
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>{member.email}</p>
                                <p>{member.phone}</p>
                                {member.emergencyContact && (
                                  <p className="text-red-600">
                                    Emergency: {member.emergencyContact}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <File className="w-4 h-4" />
                                Documents
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                {member.documentId && (
                                  <p>ID: {member.documentId}</p>
                                )}
                                {member.visaExpiry && (
                                  <div className="flex items-center gap-1">
                                    <span>Visa:</span>
                                    <Badge 
                                      className={`
                                        ${visaStatus === 'expired' ? 'bg-red-100 text-red-800' : ''}
                                        ${visaStatus === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${visaStatus === 'valid' ? 'bg-green-100 text-green-800' : ''}
                                      `}
                                    >
                                      {new Date(member.visaExpiry).toLocaleDateString()}
                                      {visaStatus === 'expired' && ' (Expired)'}
                                      {visaStatus === 'expiring_soon' && ' (Expiring)'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Personal Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Personal Details</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                {member.dateOfBirth && (
                                  <p>DOB: {new Date(member.dateOfBirth).toLocaleDateString()}</p>
                                )}
                                {member.gender && (
                                  <p>Gender: {member.gender}</p>
                                )}
                                {member.bloodGroup && (
                                  <p>Blood Group: {member.bloodGroup}</p>
                                )}
                                {member.maritalStatus && (
                                  <p>Status: {member.maritalStatus}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Employment</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>Experience: {member.experience}</p>
                                <p>Salary: ${member.salary.toLocaleString()}/year</p>
                                <p>Hired: {new Date(member.hireDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          {member.specialization && member.specialization.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Specialization</h4>
                              <div className="flex flex-wrap gap-1">
                                {member.specialization.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(member)}
                              disabled={isDeleting === member.id}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || branchFilter !== 'all' || roleFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by adding your first staff member'
                    }
                  </p>
                  {!searchTerm && branchFilter === 'all' && roleFilter === 'all' && (
                    <Button onClick={() => setAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Sheet */}
      <Sheet open={addDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setAddDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Add New Staff</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Add a new staff member with complete details.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                        Role *
                      </Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Master Barber"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                        Gender
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: 'male' | 'female' | 'other') => 
                          setFormData(prev => ({ ...prev, gender: value }))
                        }
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                        Date of Birth
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nationality" className="text-sm font-medium text-gray-700">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="e.g., Pakistani, American"
                      className="mt-1"
                      disabled={isAdding}
                    />
                  </div>
                </div>

                {/* Contact & Employment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact & Employment</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">
                      Emergency Contact
                    </Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="Emergency contact number"
                      className="mt-1"
                      disabled={isAdding}
                    />
                  </div>

                  <div>
                    <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                      Branch *
                    </Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                      disabled={isAdding}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary" className="text-sm font-medium text-gray-700">
                        Salary *
                      </Label>
                      <Input
                        id="salary"
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
                        placeholder="Enter annual salary"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                        Experience *
                      </Label>
                      <Input
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g., 5 years"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hireDate" className="text-sm font-medium text-gray-700">
                        Hire Date *
                      </Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive' | 'on_leave') =>
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating" className="text-sm font-medium text-gray-700">
                        Initial Rating
                      </Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reviews" className="text-sm font-medium text-gray-700">
                        Initial Reviews
                      </Label>
                      <Input
                        id="reviews"
                        type="number"
                        value={formData.reviews}
                        onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <File className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Document Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="documentId" className="text-sm font-medium text-gray-700">
                        Document ID (CNIC/Passport)
                      </Label>
                      <Input
                        id="documentId"
                        value={formData.documentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentId: e.target.value }))}
                        placeholder="Enter document number"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                    <div>
                      <Label htmlFor="visaExpiry" className="text-sm font-medium text-gray-700">
                        Visa Expiry Date
                      </Label>
                      <Input
                        id="visaExpiry"
                        type="date"
                        value={formData.visaExpiry}
                        onChange={(e) => setFormData(prev => ({ ...prev, visaExpiry: e.target.value }))}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
                        Blood Group
                      </Label>
                      <Select
                        value={formData.bloodGroup}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
                        Marital Status
                      </Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value: 'single' | 'married' | 'divorced' | 'widowed') =>
                          setFormData(prev => ({ ...prev, maritalStatus: value }))
                        }
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Information</h3>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      rows={2}
                      className="mt-1"
                      disabled={isAdding}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                      rows={2}
                      className="mt-1"
                      disabled={isAdding}
                    />
                  </div>

                  <div>
                    <Label htmlFor="avatar" className="text-sm font-medium text-gray-700">
                      Profile Image URL
                    </Label>
                    <Input
                      id="avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="Enter image URL (optional)"
                      className="mt-1"
                      disabled={isAdding}
                    />
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
                  className="w-full sm:w-auto"
                  disabled={isAdding}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStaff}
                  disabled={isAdding || !formData.name.trim() || !formData.email.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Staff Sheet */}
      <Sheet open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedStaff(null);
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
                    <SheetTitle className="text-2xl font-bold text-gray-900">Edit Staff</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Update staff information and settings.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-role" className="text-sm font-medium text-gray-700">
                        Role *
                      </Label>
                      <Input
                        id="edit-role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Master Barber"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">
                        Gender
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: 'male' | 'female' | 'other') => 
                          setFormData(prev => ({ ...prev, gender: value }))
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-dateOfBirth" className="text-sm font-medium text-gray-700">
                        Date of Birth
                      </Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-nationality" className="text-sm font-medium text-gray-700">
                      Nationality
                    </Label>
                    <Input
                      id="edit-nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="e.g., Pakistani, American"
                      className="mt-1"
                      disabled={isEditing}
                    />
                  </div>
                </div>

                {/* Contact & Employment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact & Employment</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-emergencyContact" className="text-sm font-medium text-gray-700">
                      Emergency Contact
                    </Label>
                    <Input
                      id="edit-emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="Emergency contact number"
                      className="mt-1"
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-branch" className="text-sm font-medium text-gray-700">
                      Branch *
                    </Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                      disabled={isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-salary" className="text-sm font-medium text-gray-700">
                        Salary *
                      </Label>
                      <Input
                        id="edit-salary"
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
                        placeholder="Enter annual salary"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-experience" className="text-sm font-medium text-gray-700">
                        Experience *
                      </Label>
                      <Input
                        id="edit-experience"
                        value={formData.experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g., 5 years"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-hireDate" className="text-sm font-medium text-gray-700">
                        Hire Date *
                      </Label>
                      <Input
                        id="edit-hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive' | 'on_leave') =>
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-rating" className="text-sm font-medium text-gray-700">
                        Rating
                      </Label>
                      <Input
                        id="edit-rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-reviews" className="text-sm font-medium text-gray-700">
                        Reviews
                      </Label>
                      <Input
                        id="edit-reviews"
                        type="number"
                        value={formData.reviews}
                        onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <File className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Document Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-documentId" className="text-sm font-medium text-gray-700">
                        Document ID (CNIC/Passport)
                      </Label>
                      <Input
                        id="edit-documentId"
                        value={formData.documentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentId: e.target.value }))}
                        placeholder="Enter document number"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-visaExpiry" className="text-sm font-medium text-gray-700">
                        Visa Expiry Date
                      </Label>
                      <Input
                        id="edit-visaExpiry"
                        type="date"
                        value={formData.visaExpiry}
                        onChange={(e) => setFormData(prev => ({ ...prev, visaExpiry: e.target.value }))}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-bloodGroup" className="text-sm font-medium text-gray-700">
                        Blood Group
                      </Label>
                      <Select
                        value={formData.bloodGroup}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-maritalStatus" className="text-sm font-medium text-gray-700">
                        Marital Status
                      </Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value: 'single' | 'married' | 'divorced' | 'widowed') =>
                          setFormData(prev => ({ ...prev, maritalStatus: value }))
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Information</h3>
                  </div>

                  <div>
                    <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Textarea
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                      rows={2}
                      className="mt-1"
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                      rows={2}
                      className="mt-1"
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-avatar" className="text-sm font-medium text-gray-700">
                      Profile Image URL
                    </Label>
                    <Input
                      id="edit-avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="Enter image URL (optional)"
                      className="mt-1"
                      disabled={isEditing}
                    />
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
                    setSelectedStaff(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                  disabled={isEditing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditStaff}
                  disabled={isEditing || !formData.name.trim() || !formData.email.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Staff
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
          setSelectedStaff(null);
        }
        setDeleteDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-md m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Delete Staff</SheetTitle>
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
                      Are you sure you want to delete this staff member?
                    </h3>
                    <p className="text-red-700 mb-4">
                      This will permanently delete <strong>"{selectedStaff?.name}"</strong>.
                      All associated data will be removed.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-red-300">
                      <div className="flex items-center gap-3">
                        {selectedStaff?.avatar ? (
                          <img
                            src={selectedStaff.avatar}
                            alt={selectedStaff.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {selectedStaff?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedStaff?.name}</p>
                          <p className="text-sm text-gray-600">{selectedStaff?.role} • {selectedStaff?.branch}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedStaff?.status}
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
                    setSelectedStaff(null);
                  }}
                  className="w-full sm:w-auto"
                  disabled={isDeleting === selectedStaff?.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteStaff}
                  disabled={isDeleting === selectedStaff?.id}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                >
                  {isDeleting === selectedStaff?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Staff
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