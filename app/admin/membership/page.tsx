'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift, Tag, Crown, Star, DollarSign, Plus, Edit, MoreVertical, Search, Filter,
  Trash2, Eye, EyeOff, Calendar, Percent, Users, Award, CreditCard, TrendingUp,
  FileText, Building, Settings, Package, Scissors, Clock, Check, X, Loader2,
  Image as ImageIcon
} from "lucide-react";
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
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unsubscribe } from 'firebase/firestore';

// Types for each section
export interface Membership {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  benefits: string[];
  status: 'active' | 'inactive';
  branches: string[];
  branchNames?: string[];
  createdAt: Date;
  updatedAt?: Date;
  totalSubscriptions?: number;
  revenue?: number;
  tier?: 'basic' | 'premium' | 'vip';
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  offerType: 'service' | 'product' | 'combo' | 'birthday' | 'first_time_registration' | 'promotional_package';
  applicableServices?: string[];
  applicableProducts?: string[];
  imageUrl?: string;
  branches: string[];
  branchNames?: string[];
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  branches: string[];
  branchNames?: string[];
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CashbackProgram {
  id: string;
  name: string;
  description: string;
  cashbackType: 'percentage' | 'fixed';
  cashbackValue: number;
  minimumPurchase?: number;
  maximumCashback?: number;
  branches: string[];
  branchNames?: string[];
  validFrom: Date;
  validTo: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoyaltyPoint {
  id: string;
  name: string;
  description: string;
  pointsPerDollar: number;
  redemptionRate: number; // $ per point
  minimumPoints: number;
  expiryDays: number;
  branches: string[];
  branchNames?: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

export default function SuperAdminMembership() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for data
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [cashbackPrograms, setCashbackPrograms] = useState<CashbackProgram[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // State for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'membership' | 'offer' | 'promo' | 'cashback' | 'loyalty'>('membership');

  // Form states for each type - WITH BRANCH AUTO-SELECT FOR BRANCH ADMIN
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    benefits: [''] as string[],
    status: 'active' as 'active' | 'inactive',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
    tier: 'basic' as 'basic' | 'premium' | 'vip'
  });

  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    offerType: 'service' as 'service' | 'product' | 'combo' | 'birthday' | 'first_time_registration' | 'promotional_package',
    applicableServices: [] as string[],
    applicableProducts: [] as string[],
    imageUrl: '',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minimumPurchase: '',
    maximumDiscount: '',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [cashbackForm, setCashbackForm] = useState({
    name: '',
    description: '',
    cashbackType: 'percentage' as 'percentage' | 'fixed',
    cashbackValue: '',
    minimumPurchase: '',
    maximumCashback: '',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
    validFrom: '',
    validTo: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [loyaltyForm, setLoyaltyForm] = useState({
    name: '',
    description: '',
    pointsPerDollar: '',
    redemptionRate: '',
    minimumPoints: '',
    expiryDays: '',
    branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
    status: 'active' as 'active' | 'inactive'
  });

  // 🔥 Firebase se real-time data fetch - WITH BRANCH FILTERING
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch Memberships
        const fetchMemberships = async () => {
          const membershipsRef = collection(db, 'memberships');
          let q = query(membershipsRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const membershipsData: Membership[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              
              membershipsData.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                price: data.price || 0,
                duration: data.duration || 1,
                benefits: data.benefits || [],
                status: data.status || 'active',
                branches: data.branches || [],
                branchNames: data.branchNames || [],
                tier: data.tier || 'basic',
                totalSubscriptions: data.totalSubscriptions || 0,
                revenue: data.revenue || 0,
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate()
              });
            });
            
            // BRANCH ADMIN FILTER - Client side filter
            let filteredMemberships = membershipsData;
            
            if (user?.role === 'admin' && user?.branchId) {
              filteredMemberships = membershipsData.filter(membership => 
                membership.branches.includes(user.branchId)
              );
            }
            
            setMemberships(filteredMemberships);
          }, (error) => {
            console.error("Error fetching memberships: ", error);
          });
          
          return unsubscribe;
        };

        // Fetch Offers
        const fetchOffers = async () => {
          const offersRef = collection(db, 'offers');
          let q = query(offersRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const offersData: Offer[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              const validFrom = data.validFrom as Timestamp;
              const validTo = data.validTo as Timestamp;
              
              offersData.push({
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                discountType: data.discountType || 'percentage',
                discountValue: data.discountValue || 0,
                offerType: data.offerType || 'service',
                applicableServices: data.applicableServices || [],
                applicableProducts: data.applicableProducts || [],
                imageUrl: data.imageUrl || '',
                branches: data.branches || [],
                branchNames: data.branchNames || [],
                validFrom: validFrom?.toDate() || new Date(),
                validTo: validTo?.toDate() || new Date(),
                usageLimit: data.usageLimit || 0,
                usedCount: data.usedCount || 0,
                status: data.status || 'active',
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate()
              });
            });
            
            // BRANCH ADMIN FILTER - Client side filter
            let filteredOffers = offersData;
            
            if (user?.role === 'admin' && user?.branchId) {
              filteredOffers = offersData.filter(offer => 
                offer.branches.includes(user.branchId)
              );
            }
            
            setOffers(filteredOffers);
          }, (error) => {
            console.error("Error fetching offers: ", error);
          });
          
          return unsubscribe;
        };

        // Fetch PromoCodes
        const fetchPromoCodes = async () => {
          const promoCodesRef = collection(db, 'promoCodes');
          let q = query(promoCodesRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const promoCodesData: PromoCode[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              const validFrom = data.validFrom as Timestamp;
              const validTo = data.validTo as Timestamp;
              
              promoCodesData.push({
                id: doc.id,
                code: data.code || '',
                description: data.description || '',
                discountType: data.discountType || 'percentage',
                discountValue: data.discountValue || 0,
                minimumPurchase: data.minimumPurchase || 0,
                maximumDiscount: data.maximumDiscount || 0,
                branches: data.branches || [],
                branchNames: data.branchNames || [],
                validFrom: validFrom?.toDate() || new Date(),
                validTo: validTo?.toDate() || new Date(),
                usageLimit: data.usageLimit || 0,
                usedCount: data.usedCount || 0,
                status: data.status || 'active',
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate()
              });
            });
            
            // BRANCH ADMIN FILTER - Client side filter
            let filteredPromoCodes = promoCodesData;
            
            if (user?.role === 'admin' && user?.branchId) {
              filteredPromoCodes = promoCodesData.filter(promo => 
                promo.branches.includes(user.branchId)
              );
            }
            
            setPromoCodes(filteredPromoCodes);
          }, (error) => {
            console.error("Error fetching promo codes: ", error);
          });
          
          return unsubscribe;
        };

        // Fetch Cashback Programs
        const fetchCashbackPrograms = async () => {
          const cashbackRef = collection(db, 'cashbackPrograms');
          let q = query(cashbackRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const cashbackData: CashbackProgram[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              const validFrom = data.validFrom as Timestamp;
              const validTo = data.validTo as Timestamp;
              
              cashbackData.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                cashbackType: data.cashbackType || 'percentage',
                cashbackValue: data.cashbackValue || 0,
                minimumPurchase: data.minimumPurchase || 0,
                maximumCashback: data.maximumCashback || 0,
                branches: data.branches || [],
                branchNames: data.branchNames || [],
                validFrom: validFrom?.toDate() || new Date(),
                validTo: validTo?.toDate() || new Date(),
                status: data.status || 'active',
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate()
              });
            });
            
            // BRANCH ADMIN FILTER - Client side filter
            let filteredCashback = cashbackData;
            
            if (user?.role === 'admin' && user?.branchId) {
              filteredCashback = cashbackData.filter(cashback => 
                cashback.branches.includes(user.branchId)
              );
            }
            
            setCashbackPrograms(filteredCashback);
          }, (error) => {
            console.error("Error fetching cashback programs: ", error);
          });
          
          return unsubscribe;
        };

        // Fetch Loyalty Points
        const fetchLoyaltyPoints = async () => {
          const loyaltyRef = collection(db, 'loyaltyPoints');
          let q = query(loyaltyRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const loyaltyData: LoyaltyPoint[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              
              loyaltyData.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                pointsPerDollar: data.pointsPerDollar || 1,
                redemptionRate: data.redemptionRate || 0.01,
                minimumPoints: data.minimumPoints || 100,
                expiryDays: data.expiryDays || 365,
                branches: data.branches || [],
                branchNames: data.branchNames || [],
                status: data.status || 'active',
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate()
              });
            });
            
            // BRANCH ADMIN FILTER - Client side filter
            let filteredLoyalty = loyaltyData;
            
            if (user?.role === 'admin' && user?.branchId) {
              filteredLoyalty = loyaltyData.filter(loyalty => 
                loyalty.branches.includes(user.branchId)
              );
            }
            
            setLoyaltyPoints(filteredLoyalty);
            setLoading(false);
          }, (error) => {
            console.error("Error fetching loyalty points: ", error);
            setLoading(false);
          });
          
          return unsubscribe;
        };

        const unsubscribeMemberships = await fetchMemberships();
        const unsubscribeOffers = await fetchOffers();
        const unsubscribePromoCodes = await fetchPromoCodes();
        const unsubscribeCashback = await fetchCashbackPrograms();
        const unsubscribeLoyalty = await fetchLoyaltyPoints();

        return () => {
          unsubscribeMemberships();
          unsubscribeOffers();
          unsubscribePromoCodes();
          unsubscribeCashback();
          unsubscribeLoyalty();
        };
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  // 🔥 Firebase se branches fetch - WITH BRANCH FILTERING
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

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
        
        unsubscribe = onSnapshot(q, (snapshot) => {
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
              status: data.status || 'active',
              createdAt: createdAt?.toDate() || new Date()
            });
          });
          
          setBranches(branchesData);
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
      fetchBranches();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // 🔥 Firebase se services fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, orderBy('name'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const servicesData: Service[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            servicesData.push({
              id: doc.id,
              name: data.name || '',
              category: data.category || '',
              price: data.price || 0
            });
          });
          
          setServices(servicesData);
          setServicesLoading(false);
        }, (error) => {
          console.error("Error fetching services: ", error);
          setServicesLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchServices: ", error);
        setServicesLoading(false);
      }
    };

    fetchServices();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🔥 Firebase se products fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const productsData: Product[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            productsData.push({
              id: doc.id,
              name: data.name || '',
              category: data.category || '',
              price: data.price || 0
            });
          });
          
          setProducts(productsData);
          setProductsLoading(false);
        }, (error) => {
          console.error("Error fetching products: ", error);
          setProductsLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchProducts: ", error);
        setProductsLoading(false);
      }
    };

    fetchProducts();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Reset all forms - WITH BRANCH AUTO-SELECT FOR BRANCH ADMIN
  const resetForms = () => {
    setMembershipForm({
      name: '',
      description: '',
      price: '',
      duration: '',
      benefits: [''],
      status: 'active',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
      tier: 'basic'
    });
    setOfferForm({
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      offerType: 'service',
      applicableServices: [],
      applicableProducts: [],
      imageUrl: '',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      status: 'active'
    });
    setPromoForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumPurchase: '',
      maximumDiscount: '',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      status: 'active'
    });
    setCashbackForm({
      name: '',
      description: '',
      cashbackType: 'percentage',
      cashbackValue: '',
      minimumPurchase: '',
      maximumCashback: '',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
      validFrom: '',
      validTo: '',
      status: 'active'
    });
    setLoyaltyForm({
      name: '',
      description: '',
      pointsPerDollar: '',
      redemptionRate: '',
      minimumPoints: '',
      expiryDays: '',
      branchId: user?.role === 'admin' && user?.branchId ? user.branchId : '',
      status: 'active'
    });
  };

  // 🔥 Add functions for each type
  const handleAddMembership = async () => {
    if (!membershipForm.name || !membershipForm.price || !membershipForm.duration || !membershipForm.branchId) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const membershipsRef = collection(db, 'memberships');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === membershipForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      const newMembershipData = {
        name: membershipForm.name.trim(),
        description: membershipForm.description.trim(),
        price: parseFloat(membershipForm.price),
        duration: parseInt(membershipForm.duration),
        benefits: membershipForm.benefits.filter(b => b.trim() !== ''),
        status: membershipForm.status,
        tier: membershipForm.tier,
        branches: [membershipForm.branchId],
        branchNames: branchName ? [branchName] : [],
        totalSubscriptions: 0,
        revenue: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(membershipsRef, newMembershipData);
      
      setShowAddDialog(false);
      resetForms();
      alert('Membership added successfully!');
      
    } catch (error) {
      console.error("Error adding membership: ", error);
      alert('Error adding membership. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddOffer = async () => {
    if (!offerForm.title || !offerForm.discountValue || !offerForm.branchId || !offerForm.validFrom || !offerForm.validTo) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const offersRef = collection(db, 'offers');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === offerForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      const newOfferData = {
        title: offerForm.title.trim(),
        description: offerForm.description.trim(),
        discountType: offerForm.discountType,
        discountValue: parseFloat(offerForm.discountValue),
        offerType: offerForm.offerType,
        applicableServices: offerForm.applicableServices,
        applicableProducts: offerForm.applicableProducts,
        imageUrl: offerForm.imageUrl.trim(),
        branches: [offerForm.branchId],
        branchNames: branchName ? [branchName] : [],
        validFrom: new Date(offerForm.validFrom),
        validTo: new Date(offerForm.validTo),
        usageLimit: offerForm.usageLimit ? parseInt(offerForm.usageLimit) : null,
        usedCount: 0,
        status: offerForm.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(offersRef, newOfferData);
      
      setShowAddDialog(false);
      resetForms();
      alert('Offer added successfully!');
      
    } catch (error) {
      console.error("Error adding offer: ", error);
      alert('Error adding offer. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddPromoCode = async () => {
    if (!promoForm.code || !promoForm.discountValue || !promoForm.branchId || !promoForm.validFrom || !promoForm.validTo) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const promoCodesRef = collection(db, 'promoCodes');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === promoForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      const newPromoData = {
        code: promoForm.code.trim().toUpperCase(),
        description: promoForm.description.trim(),
        discountType: promoForm.discountType,
        discountValue: parseFloat(promoForm.discountValue),
        minimumPurchase: promoForm.minimumPurchase ? parseFloat(promoForm.minimumPurchase) : null,
        maximumDiscount: promoForm.maximumDiscount ? parseFloat(promoForm.maximumDiscount) : null,
        branches: [promoForm.branchId],
        branchNames: branchName ? [branchName] : [],
        validFrom: new Date(promoForm.validFrom),
        validTo: new Date(promoForm.validTo),
        usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null,
        usedCount: 0,
        status: promoForm.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(promoCodesRef, newPromoData);
      
      setShowAddDialog(false);
      resetForms();
      alert('Promo code added successfully!');
      
    } catch (error) {
      console.error("Error adding promo code: ", error);
      alert('Error adding promo code. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddCashbackProgram = async () => {
    if (!cashbackForm.name || !cashbackForm.cashbackValue || !cashbackForm.branchId || !cashbackForm.validFrom || !cashbackForm.validTo) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const cashbackRef = collection(db, 'cashbackPrograms');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === cashbackForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      const newCashbackData = {
        name: cashbackForm.name.trim(),
        description: cashbackForm.description.trim(),
        cashbackType: cashbackForm.cashbackType,
        cashbackValue: parseFloat(cashbackForm.cashbackValue),
        minimumPurchase: cashbackForm.minimumPurchase ? parseFloat(cashbackForm.minimumPurchase) : null,
        maximumCashback: cashbackForm.maximumCashback ? parseFloat(cashbackForm.maximumCashback) : null,
        branches: [cashbackForm.branchId],
        branchNames: branchName ? [branchName] : [],
        validFrom: new Date(cashbackForm.validFrom),
        validTo: new Date(cashbackForm.validTo),
        status: cashbackForm.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(cashbackRef, newCashbackData);
      
      setShowAddDialog(false);
      resetForms();
      alert('Cashback program added successfully!');
      
    } catch (error) {
      console.error("Error adding cashback program: ", error);
      alert('Error adding cashback program. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddLoyaltyProgram = async () => {
    if (!loyaltyForm.name || !loyaltyForm.pointsPerDollar || !loyaltyForm.redemptionRate || !loyaltyForm.minimumPoints || !loyaltyForm.branchId) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const loyaltyRef = collection(db, 'loyaltyPoints');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === loyaltyForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      const newLoyaltyData = {
        name: loyaltyForm.name.trim(),
        description: loyaltyForm.description.trim(),
        pointsPerDollar: parseFloat(loyaltyForm.pointsPerDollar),
        redemptionRate: parseFloat(loyaltyForm.redemptionRate),
        minimumPoints: parseInt(loyaltyForm.minimumPoints),
        expiryDays: loyaltyForm.expiryDays ? parseInt(loyaltyForm.expiryDays) : 365,
        branches: [loyaltyForm.branchId],
        branchNames: branchName ? [branchName] : [],
        status: loyaltyForm.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(loyaltyRef, newLoyaltyData);
      
      setShowAddDialog(false);
      resetForms();
      alert('Loyalty program added successfully!');
      
    } catch (error) {
      console.error("Error adding loyalty program: ", error);
      alert('Error adding loyalty program. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit functions for each type
  const handleEditItem = async () => {
    if (!selectedItem) return;

    setIsEditing(true);
    try {
      let collectionName = '';
      let updateData: any = {};

      switch (dialogType) {
        case 'membership':
          collectionName = 'memberships';
          const selectedBranch = branches.find(b => b.id === membershipForm.branchId);
          const branchName = selectedBranch ? selectedBranch.name : '';
          updateData = {
            name: membershipForm.name.trim(),
            description: membershipForm.description.trim(),
            price: parseFloat(membershipForm.price),
            duration: parseInt(membershipForm.duration),
            benefits: membershipForm.benefits.filter(b => b.trim() !== ''),
            status: membershipForm.status,
            tier: membershipForm.tier,
            branches: [membershipForm.branchId],
            branchNames: branchName ? [branchName] : [],
            updatedAt: serverTimestamp()
          };
          break;

        case 'offer':
          collectionName = 'offers';
          const offerBranch = branches.find(b => b.id === offerForm.branchId);
          const offerBranchName = offerBranch ? offerBranch.name : '';
          updateData = {
            title: offerForm.title.trim(),
            description: offerForm.description.trim(),
            discountType: offerForm.discountType,
            discountValue: parseFloat(offerForm.discountValue),
            offerType: offerForm.offerType,
            applicableServices: offerForm.applicableServices,
            applicableProducts: offerForm.applicableProducts,
            imageUrl: offerForm.imageUrl.trim(),
            branches: [offerForm.branchId],
            branchNames: offerBranchName ? [offerBranchName] : [],
            validFrom: new Date(offerForm.validFrom),
            validTo: new Date(offerForm.validTo),
            usageLimit: offerForm.usageLimit ? parseInt(offerForm.usageLimit) : null,
            status: offerForm.status,
            updatedAt: serverTimestamp()
          };
          break;

        case 'promo':
          collectionName = 'promoCodes';
          const promoBranch = branches.find(b => b.id === promoForm.branchId);
          const promoBranchName = promoBranch ? promoBranch.name : '';
          updateData = {
            code: promoForm.code.trim().toUpperCase(),
            description: promoForm.description.trim(),
            discountType: promoForm.discountType,
            discountValue: parseFloat(promoForm.discountValue),
            minimumPurchase: promoForm.minimumPurchase ? parseFloat(promoForm.minimumPurchase) : null,
            maximumDiscount: promoForm.maximumDiscount ? parseFloat(promoForm.maximumDiscount) : null,
            branches: [promoForm.branchId],
            branchNames: promoBranchName ? [promoBranchName] : [],
            validFrom: new Date(promoForm.validFrom),
            validTo: new Date(promoForm.validTo),
            usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null,
            status: promoForm.status,
            updatedAt: serverTimestamp()
          };
          break;

        case 'cashback':
          collectionName = 'cashbackPrograms';
          const cashbackBranch = branches.find(b => b.id === cashbackForm.branchId);
          const cashbackBranchName = cashbackBranch ? cashbackBranch.name : '';
          updateData = {
            name: cashbackForm.name.trim(),
            description: cashbackForm.description.trim(),
            cashbackType: cashbackForm.cashbackType,
            cashbackValue: parseFloat(cashbackForm.cashbackValue),
            minimumPurchase: cashbackForm.minimumPurchase ? parseFloat(cashbackForm.minimumPurchase) : null,
            maximumCashback: cashbackForm.maximumCashback ? parseFloat(cashbackForm.maximumCashback) : null,
            branches: [cashbackForm.branchId],
            branchNames: cashbackBranchName ? [cashbackBranchName] : [],
            validFrom: new Date(cashbackForm.validFrom),
            validTo: new Date(cashbackForm.validTo),
            status: cashbackForm.status,
            updatedAt: serverTimestamp()
          };
          break;

        case 'loyalty':
          collectionName = 'loyaltyPoints';
          const loyaltyBranch = branches.find(b => b.id === loyaltyForm.branchId);
          const loyaltyBranchName = loyaltyBranch ? loyaltyBranch.name : '';
          updateData = {
            name: loyaltyForm.name.trim(),
            description: loyaltyForm.description.trim(),
            pointsPerDollar: parseFloat(loyaltyForm.pointsPerDollar),
            redemptionRate: parseFloat(loyaltyForm.redemptionRate),
            minimumPoints: parseInt(loyaltyForm.minimumPoints),
            expiryDays: loyaltyForm.expiryDays ? parseInt(loyaltyForm.expiryDays) : 365,
            branches: [loyaltyForm.branchId],
            branchNames: loyaltyBranchName ? [loyaltyBranchName] : [],
            status: loyaltyForm.status,
            updatedAt: serverTimestamp()
          };
          break;
      }

      const docRef = doc(db, collectionName, selectedItem.id);
      await updateDoc(docRef, updateData);
      
      setShowAddDialog(false);
      setSelectedItem(null);
      resetForms();
      alert(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} updated successfully!`);
      
    } catch (error) {
      console.error(`Error updating ${dialogType}: `, error);
      alert(`Error updating ${dialogType}. Please try again.`);
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete function
  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(selectedItem.id);
    try {
      let collectionName = '';
      switch (dialogType) {
        case 'membership': collectionName = 'memberships'; break;
        case 'offer': collectionName = 'offers'; break;
        case 'promo': collectionName = 'promoCodes'; break;
        case 'cashback': collectionName = 'cashbackPrograms'; break;
        case 'loyalty': collectionName = 'loyaltyPoints'; break;
      }

      const docRef = doc(db, collectionName, selectedItem.id);
      await deleteDoc(docRef);
      
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      alert(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting ${dialogType}: `, error);
      alert(`Error deleting ${dialogType}. Please try again.`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle status
  const toggleStatus = async (item: any, type: typeof dialogType) => {
    try {
      let collectionName = '';
      switch (type) {
        case 'membership': collectionName = 'memberships'; break;
        case 'offer': collectionName = 'offers'; break;
        case 'promo': collectionName = 'promoCodes'; break;
        case 'cashback': collectionName = 'cashbackPrograms'; break;
        case 'loyalty': collectionName = 'loyaltyPoints'; break;
      }

      const docRef = doc(db, collectionName, item.id);
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error(`Error updating ${type} status: `, error);
      alert(`Error updating ${type} status. Please try again.`);
    }
  };

  // Open edit dialog
  const openEditDialog = (item: any, type: typeof dialogType) => {
    setSelectedItem(item);
    setDialogType(type);

    switch (type) {
      case 'membership':
        setMembershipForm({
          name: item.name,
          description: item.description,
          price: item.price.toString(),
          duration: item.duration.toString(),
          benefits: item.benefits.length > 0 ? item.benefits : [''],
          status: item.status,
          branchId: item.branches[0] || '',
          tier: item.tier || 'basic'
        });
        break;
      case 'offer':
        setOfferForm({
          title: item.title,
          description: item.description,
          discountType: item.discountType,
          discountValue: item.discountValue.toString(),
          offerType: item.offerType,
          applicableServices: item.applicableServices || [],
          applicableProducts: item.applicableProducts || [],
          imageUrl: item.imageUrl || '',
          branchId: item.branches[0] || '',
          validFrom: item.validFrom.toISOString().split('T')[0],
          validTo: item.validTo.toISOString().split('T')[0],
          usageLimit: item.usageLimit?.toString() || '',
          status: item.status
        });
        break;
      case 'promo':
        setPromoForm({
          code: item.code,
          description: item.description,
          discountType: item.discountType,
          discountValue: item.discountValue.toString(),
          minimumPurchase: item.minimumPurchase?.toString() || '',
          maximumDiscount: item.maximumDiscount?.toString() || '',
          branchId: item.branches[0] || '',
          validFrom: item.validFrom.toISOString().split('T')[0],
          validTo: item.validTo.toISOString().split('T')[0],
          usageLimit: item.usageLimit?.toString() || '',
          status: item.status
        });
        break;
      case 'cashback':
        setCashbackForm({
          name: item.name,
          description: item.description,
          cashbackType: item.cashbackType,
          cashbackValue: item.cashbackValue.toString(),
          minimumPurchase: item.minimumPurchase?.toString() || '',
          maximumCashback: item.maximumCashback?.toString() || '',
          branchId: item.branches[0] || '',
          validFrom: item.validFrom.toISOString().split('T')[0],
          validTo: item.validTo.toISOString().split('T')[0],
          status: item.status
        });
        break;
      case 'loyalty':
        setLoyaltyForm({
          name: item.name,
          description: item.description,
          pointsPerDollar: item.pointsPerDollar.toString(),
          redemptionRate: item.redemptionRate.toString(),
          minimumPoints: item.minimumPoints.toString(),
          expiryDays: item.expiryDays?.toString() || '365',
          branchId: item.branches[0] || '',
          status: item.status
        });
        break;
    }
    setShowAddDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (item: any, type: typeof dialogType) => {
    setSelectedItem(item);
    setDialogType(type);
    setDeleteDialogOpen(true);
  };

  // Filter functions - WITH BRANCH FILTERING
  const getFilteredMemberships = () => {
    return memberships.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = branchFilter === 'all' || item.branches.includes(branchFilter);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  };

  const getFilteredOffers = () => {
    return offers.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = branchFilter === 'all' || item.branches.includes(branchFilter);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  };

  const getFilteredPromoCodes = () => {
    return promoCodes.filter(item => {
      const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = branchFilter === 'all' || item.branches.includes(branchFilter);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  };

  const getFilteredCashbackPrograms = () => {
    return cashbackPrograms.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = branchFilter === 'all' || item.branches.includes(branchFilter);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  };

  const getFilteredLoyaltyPoints = () => {
    return loyaltyPoints.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = branchFilter === 'all' || item.branches.includes(branchFilter);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get tier color
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "basic": return "bg-blue-100 text-blue-800";
      case "premium": return "bg-purple-100 text-purple-800";
      case "vip": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Render loading state
  if (loading && memberships.length === 0) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading membership data...</p>
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

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'super_admin' 
                      ? "Manage memberships, offers, promo codes, cashback & loyalty programs" 
                      : `Managing memberships for ${user?.branchName || 'your branch'}`
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
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
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
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              <Tabs defaultValue="memberships" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
                  <TabsTrigger value="memberships" className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Memberships
                  </TabsTrigger>
                  <TabsTrigger value="offers" className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Offers
                  </TabsTrigger>
                  <TabsTrigger value="promo-codes" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Promo Codes
                  </TabsTrigger>
                  <TabsTrigger value="cashback" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Cashback
                  </TabsTrigger>
                  <TabsTrigger value="loyalty" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Loyalty Points
                  </TabsTrigger>
                </TabsList>

                {/* Memberships Tab */}
                <TabsContent value="memberships" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Membership Plans</h2>
                      <p className="text-gray-600">Create and manage membership plans</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setDialogType('membership');
                        setSelectedItem(null);
                        resetForms();
                        setShowAddDialog(true);
                      }}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Membership
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredMemberships().map((membership) => (
                      <Card key={membership.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary">{membership.name}</CardTitle>
                              <CardDescription className="text-secondary font-medium">
                                {membership.tier && (
                                  <Badge className={getTierColor(membership.tier)}>
                                    {membership.tier.toUpperCase()}
                                  </Badge>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(membership.status)}>
                                {membership.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(membership, 'membership')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatus(membership, 'membership')}>
                                    {membership.status === 'active' ? (
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
                                    onClick={() => openDeleteDialog(membership, 'membership')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">{membership.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold">${membership.price}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span>{membership.duration} month{membership.duration > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                              <div className="flex flex-wrap gap-1">
                                {membership.branchNames && membership.branchNames.length > 0 ? (
                                  membership.branchNames.map((branchName, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {branchName}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No branch assigned</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Benefits:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {membership.benefits.slice(0, 3).map((benefit, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-green-500" />
                                    {benefit}
                                  </li>
                                ))}
                                {membership.benefits.length > 3 && (
                                  <li className="text-gray-500">+{membership.benefits.length - 3} more...</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Offers Tab */}
                <TabsContent value="offers" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Special Offers</h2>
                      <p className="text-gray-600">Create and manage special offers</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setDialogType('offer');
                        setSelectedItem(null);
                        resetForms();
                        setShowAddDialog(true);
                      }}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Offer
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredOffers().map((offer) => (
                      <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary">{offer.title}</CardTitle>
                              <CardDescription className="text-secondary font-medium">
                                {offer.offerType}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(offer.status)}>
                                {offer.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(offer, 'offer')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatus(offer, 'offer')}>
                                    {offer.status === 'active' ? (
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
                                    onClick={() => openDeleteDialog(offer, 'offer')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">{offer.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Percent className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold">
                                    {offer.discountType === 'percentage' 
                                      ? `${offer.discountValue}% off` 
                                      : `$${offer.discountValue} off`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                              <div className="flex flex-wrap gap-1">
                                {offer.branchNames && offer.branchNames.length > 0 ? (
                                  offer.branchNames.map((branchName, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {branchName}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No branch assigned</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              Valid: {offer.validFrom.toLocaleDateString()} - {offer.validTo.toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Promo Codes Tab */}
                <TabsContent value="promo-codes" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Promo Codes</h2>
                      <p className="text-gray-600">Create and manage promo codes</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setDialogType('promo');
                        setSelectedItem(null);
                        resetForms();
                        setShowAddDialog(true);
                      }}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Promo Code
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredPromoCodes().map((promo) => (
                      <Card key={promo.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary font-mono">{promo.code}</CardTitle>
                              <CardDescription className="text-secondary font-medium">
                                {promo.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(promo.status)}>
                                {promo.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(promo, 'promo')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatus(promo, 'promo')}>
                                    {promo.status === 'active' ? (
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
                                    onClick={() => openDeleteDialog(promo, 'promo')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Percent className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold">
                                    {promo.discountType === 'percentage' 
                                      ? `${promo.discountValue}% off` 
                                      : `$${promo.discountValue} off`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                              <div className="flex flex-wrap gap-1">
                                {promo.branchNames && promo.branchNames.length > 0 ? (
                                  promo.branchNames.map((branchName, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {branchName}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No branch assigned</span>
                                )}
                              </div>
                            </div>
                            {promo.minimumPurchase && (
                              <div className="text-sm text-gray-500">
                                Min. purchase: ${promo.minimumPurchase}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Valid: {promo.validFrom.toLocaleDateString()} - {promo.validTo.toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Cashback Tab */}
                <TabsContent value="cashback" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Cashback Programs</h2>
                      <p className="text-gray-600">Create and manage cashback programs</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setDialogType('cashback');
                        setSelectedItem(null);
                        resetForms();
                        setShowAddDialog(true);
                      }}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cashback Program
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredCashbackPrograms().map((cashback) => (
                      <Card key={cashback.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary">{cashback.name}</CardTitle>
                              <CardDescription className="text-secondary font-medium">
                                {cashback.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(cashback.status)}>
                                {cashback.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(cashback, 'cashback')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatus(cashback, 'cashback')}>
                                    {cashback.status === 'active' ? (
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
                                    onClick={() => openDeleteDialog(cashback, 'cashback')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold">
                                    {cashback.cashbackType === 'percentage' 
                                      ? `${cashback.cashbackValue}% cashback` 
                                      : `$${cashback.cashbackValue} cashback`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                              <div className="flex flex-wrap gap-1">
                                {cashback.branchNames && cashback.branchNames.length > 0 ? (
                                  cashback.branchNames.map((branchName, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {branchName}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No branch assigned</span>
                                )}
                              </div>
                            </div>
                            {cashback.minimumPurchase && (
                              <div className="text-sm text-gray-500">
                                Min. purchase: ${cashback.minimumPurchase}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Valid: {cashback.validFrom.toLocaleDateString()} - {cashback.validTo.toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Loyalty Points Tab */}
                <TabsContent value="loyalty" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Loyalty Points Programs</h2>
                      <p className="text-gray-600">Create and manage loyalty points programs</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setDialogType('loyalty');
                        setSelectedItem(null);
                        resetForms();
                        setShowAddDialog(true);
                      }}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Loyalty Program
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredLoyaltyPoints().map((loyalty) => (
                      <Card key={loyalty.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary">{loyalty.name}</CardTitle>
                              <CardDescription className="text-secondary font-medium">
                                {loyalty.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(loyalty.status)}>
                                {loyalty.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(loyalty, 'loyalty')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatus(loyalty, 'loyalty')}>
                                    {loyalty.status === 'active' ? (
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
                                    onClick={() => openDeleteDialog(loyalty, 'loyalty')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 text-yellow-600" />
                                  <span className="font-semibold">
                                    {loyalty.pointsPerDollar} points per $
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span>${loyalty.redemptionRate}/point</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                              <div className="flex flex-wrap gap-1">
                                {loyalty.branchNames && loyalty.branchNames.length > 0 ? (
                                  loyalty.branchNames.map((branchName, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {branchName}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No branch assigned</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              Min. points to redeem: {loyalty.minimumPoints}
                            </div>
                            <div className="text-sm text-gray-500">
                              Points expire after: {loyalty.expiryDays} days
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog - Dynamic based on type */}
      <Sheet open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null);
          resetForms();
        }
        setShowAddDialog(open);
      }}>
        <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
          <SheetHeader>
            <SheetTitle className="font-bold text-4xl text-center text-slate-700">
              {selectedItem ? `Edit ${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}` : `Add New ${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}`}
            </SheetTitle>
            <SheetDescription className="font-bold text-md text-center text-slate-800">
              {selectedItem ? `Update ${dialogType} details` : `Create a new ${dialogType} record`}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Dynamic form based on dialogType */}
            {dialogType === 'membership' && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Membership Name *
                  </Label>
                  <Input
                    placeholder="e.g., Premium Membership"
                    value={membershipForm.name}
                    onChange={(e) => setMembershipForm({...membershipForm, name: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the membership..."
                    value={membershipForm.description}
                    onChange={(e) => setMembershipForm({...membershipForm, description: e.target.value})}
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding || isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Price ($) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="99.99"
                      value={membershipForm.price}
                      onChange={(e) => setMembershipForm({...membershipForm, price: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Duration (months) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="12"
                      value={membershipForm.duration}
                      onChange={(e) => setMembershipForm({...membershipForm, duration: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Tier
                  </Label>
                  <select
                    value={membershipForm.tier}
                    onChange={(e) => setMembershipForm({
                      ...membershipForm, 
                      tier: e.target.value as 'basic' | 'premium' | 'vip'
                    })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={isAdding || isEditing}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Benefits (one per line)
                  </Label>
                  <div className="space-y-2">
                    {membershipForm.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...membershipForm.benefits];
                            newBenefits[index] = e.target.value;
                            setMembershipForm({...membershipForm, benefits: newBenefits});
                          }}
                          placeholder={`Benefit ${index + 1}`}
                          className="flex-1"
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newBenefits = membershipForm.benefits.filter((_, i) => i !== index);
                              setMembershipForm({...membershipForm, benefits: newBenefits});
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMembershipForm({
                        ...membershipForm,
                        benefits: [...membershipForm.benefits, '']
                      })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Benefit
                    </Button>
                  </div>
                </div>
              </>
            )}

            {dialogType === 'offer' && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Offer Title *
                  </Label>
                  <Input
                    placeholder="e.g., Summer Special Offer"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the offer..."
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding || isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Offer Type
                    </Label>
                    <select
                      value={offerForm.offerType}
                      onChange={(e) => setOfferForm({
                        ...offerForm, 
                        offerType: e.target.value as 'service' | 'product' | 'combo' | 'birthday' | 'first_time_registration' | 'promotional_package'
                      })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      disabled={isAdding || isEditing}
                    >
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                      <option value="combo">Combo</option>
                      <option value="birthday">Birthday Special</option>
                      <option value="first_time_registration">First Time Registration</option>
                      <option value="promotional_package">Promotional Package</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Discount Type
                    </Label>
                    <select
                      value={offerForm.discountType}
                      onChange={(e) => setOfferForm({
                        ...offerForm, 
                        discountType: e.target.value as 'percentage' | 'fixed'
                      })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      disabled={isAdding || isEditing}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Discount Value *
                  </Label>
                  <Input
                    type="number"
                    placeholder={offerForm.discountType === 'percentage' ? "20" : "10.00"}
                    value={offerForm.discountValue}
                    onChange={(e) => setOfferForm({...offerForm, discountValue: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                    step={offerForm.discountType === 'percentage' ? "1" : "0.01"}
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Offer Image URL
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="https://example.com/offer-image.jpg"
                      value={offerForm.imageUrl}
                      onChange={(e) => setOfferForm({...offerForm, imageUrl: e.target.value})}
                      className="rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid From *
                    </Label>
                    <Input
                      type="date"
                      value={offerForm.validFrom}
                      onChange={(e) => setOfferForm({...offerForm, validFrom: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid To *
                    </Label>
                    <Input
                      type="date"
                      value={offerForm.validTo}
                      onChange={(e) => setOfferForm({...offerForm, validTo: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Usage Limit (optional)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={offerForm.usageLimit}
                    onChange={(e) => setOfferForm({...offerForm, usageLimit: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                  />
                </div>

                {/* Applicable Services */}
                {offerForm.offerType === 'service' && (
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Applicable Services
                    </Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto mt-1">
                      <div className="space-y-2">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`service-${service.id}`}
                              checked={offerForm.applicableServices.includes(service.id)}
                              onChange={(e) => {
                                const serviceId = service.id;
                                setOfferForm(prev => ({
                                  ...prev,
                                  applicableServices: e.target.checked
                                    ? [...prev.applicableServices, serviceId]
                                    : prev.applicableServices.filter(id => id !== serviceId)
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                              {service.name} (${service.price})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Applicable Products */}
                {offerForm.offerType === 'product' && (
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Applicable Products
                    </Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto mt-1">
                      <div className="space-y-2">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`product-${product.id}`}
                              checked={offerForm.applicableProducts.includes(product.id)}
                              onChange={(e) => {
                                const productId = product.id;
                                setOfferForm(prev => ({
                                  ...prev,
                                  applicableProducts: e.target.checked
                                    ? [...prev.applicableProducts, productId]
                                    : prev.applicableProducts.filter(id => id !== productId)
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer">
                              {product.name} (${product.price})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {dialogType === 'promo' && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Promo Code *
                  </Label>
                  <Input
                    placeholder="e.g., SUMMER20"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                    className="mt-1 rounded-lg font-mono"
                    disabled={isAdding || isEditing}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the promo code..."
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding || isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Discount Type
                    </Label>
                    <select
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({
                        ...promoForm, 
                        discountType: e.target.value as 'percentage' | 'fixed'
                      })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      disabled={isAdding || isEditing}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Discount Value *
                    </Label>
                    <Input
                      type="number"
                      placeholder={promoForm.discountType === 'percentage' ? "20" : "10.00"}
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({...promoForm, discountValue: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step={promoForm.discountType === 'percentage' ? "1" : "0.01"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Minimum Purchase (optional)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={promoForm.minimumPurchase}
                      onChange={(e) => setPromoForm({...promoForm, minimumPurchase: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Maximum Discount (optional)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={promoForm.maximumDiscount}
                      onChange={(e) => setPromoForm({...promoForm, maximumDiscount: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid From *
                    </Label>
                    <Input
                      type="date"
                      value={promoForm.validFrom}
                      onChange={(e) => setPromoForm({...promoForm, validFrom: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid To *
                    </Label>
                    <Input
                      type="date"
                      value={promoForm.validTo}
                      onChange={(e) => setPromoForm({...promoForm, validTo: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Usage Limit (optional)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={promoForm.usageLimit}
                    onChange={(e) => setPromoForm({...promoForm, usageLimit: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                  />
                </div>
              </>
            )}

            {dialogType === 'cashback' && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Program Name *
                  </Label>
                  <Input
                    placeholder="e.g., Cashback Rewards"
                    value={cashbackForm.name}
                    onChange={(e) => setCashbackForm({...cashbackForm, name: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the cashback program..."
                    value={cashbackForm.description}
                    onChange={(e) => setCashbackForm({...cashbackForm, description: e.target.value})}
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding || isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Cashback Type
                    </Label>
                    <select
                      value={cashbackForm.cashbackType}
                      onChange={(e) => setCashbackForm({
                        ...cashbackForm, 
                        cashbackType: e.target.value as 'percentage' | 'fixed'
                      })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      disabled={isAdding || isEditing}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Cashback Value *
                    </Label>
                    <Input
                      type="number"
                      placeholder={cashbackForm.cashbackType === 'percentage' ? "5" : "10.00"}
                      value={cashbackForm.cashbackValue}
                      onChange={(e) => setCashbackForm({...cashbackForm, cashbackValue: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step={cashbackForm.cashbackType === 'percentage' ? "1" : "0.01"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Minimum Purchase (optional)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cashbackForm.minimumPurchase}
                      onChange={(e) => setCashbackForm({...cashbackForm, minimumPurchase: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Maximum Cashback (optional)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={cashbackForm.maximumCashback}
                      onChange={(e) => setCashbackForm({...cashbackForm, maximumCashback: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid From *
                    </Label>
                    <Input
                      type="date"
                      value={cashbackForm.validFrom}
                      onChange={(e) => setCashbackForm({...cashbackForm, validFrom: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Valid To *
                    </Label>
                    <Input
                      type="date"
                      value={cashbackForm.validTo}
                      onChange={(e) => setCashbackForm({...cashbackForm, validTo: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                    />
                  </div>
                </div>
              </>
            )}

            {dialogType === 'loyalty' && (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Program Name *
                  </Label>
                  <Input
                    placeholder="e.g., Points Plus Program"
                    value={loyaltyForm.name}
                    onChange={(e) => setLoyaltyForm({...loyaltyForm, name: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the loyalty program..."
                    value={loyaltyForm.description}
                    onChange={(e) => setLoyaltyForm({...loyaltyForm, description: e.target.value})}
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding || isEditing}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Points per Dollar *
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={loyaltyForm.pointsPerDollar}
                      onChange={(e) => setLoyaltyForm({...loyaltyForm, pointsPerDollar: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Redemption Rate ($ per point) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.01"
                      value={loyaltyForm.redemptionRate}
                      onChange={(e) => setLoyaltyForm({...loyaltyForm, redemptionRate: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                      step="0.001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Minimum Points *
                    </Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={loyaltyForm.minimumPoints}
                      onChange={(e) => setLoyaltyForm({...loyaltyForm, minimumPoints: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">
                      Expiry Days
                    </Label>
                    <Input
                      type="number"
                      placeholder="365"
                      value={loyaltyForm.expiryDays}
                      onChange={(e) => setLoyaltyForm({...loyaltyForm, expiryDays: e.target.value})}
                      className="mt-1 rounded-lg"
                      disabled={isAdding || isEditing}
                      min="1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Common fields for all types - WITH BRANCH AUTO-SELECT FOR BRANCH ADMIN */}
            <div>
              <Label className="text-xs font-bold uppercase">
                Select Branch *
              </Label>
              <select
                value={
                  dialogType === 'membership' ? membershipForm.branchId :
                  dialogType === 'offer' ? offerForm.branchId :
                  dialogType === 'promo' ? promoForm.branchId :
                  dialogType === 'cashback' ? cashbackForm.branchId :
                  loyaltyForm.branchId
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (dialogType === 'membership') setMembershipForm({...membershipForm, branchId: value});
                  if (dialogType === 'offer') setOfferForm({...offerForm, branchId: value});
                  if (dialogType === 'promo') setPromoForm({...promoForm, branchId: value});
                  if (dialogType === 'cashback') setCashbackForm({...cashbackForm, branchId: value});
                  if (dialogType === 'loyalty') setLoyaltyForm({...loyaltyForm, branchId: value});
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                disabled={isAdding || isEditing || (user?.role === 'admin') || branchesLoading}
              >
                {user?.role === 'admin' && user?.branchName ? (
                  // Branch admin ke liye sirf uski branch
                  <option value={user.branchId}>
                    {user.branchName} (Auto-selected)
                  </option>
                ) : (
                  <>
                    <option value="">Select a branch</option>
                    {branchesLoading ? (
                      <option value="" disabled>Loading branches...</option>
                    ) : branches.length === 0 ? (
                      <option value="" disabled>No branches available</option>
                    ) : (
                      branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                          {branch.city && ` (${branch.city})`}
                        </option>
                      ))
                    )}
                  </>
                )}
              </select>
              {user?.role === 'admin' && (
                <p className="text-xs text-gray-500 mt-1">
                  You can only add to your assigned branch: <strong>{user.branchName}</strong>
                </p>
              )}
              {branchesLoading && (
                <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
              )}
              {!branchesLoading && branches.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No branches available. Please add branches first.</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase">
                Status
              </Label>
              <select
                value={
                  dialogType === 'membership' ? membershipForm.status :
                  dialogType === 'offer' ? offerForm.status :
                  dialogType === 'promo' ? promoForm.status :
                  dialogType === 'cashback' ? cashbackForm.status :
                  loyaltyForm.status
                }
                onChange={(e) => {
                  const value = e.target.value as 'active' | 'inactive';
                  if (dialogType === 'membership') setMembershipForm({...membershipForm, status: value});
                  if (dialogType === 'offer') setOfferForm({...offerForm, status: value});
                  if (dialogType === 'promo') setPromoForm({...promoForm, status: value});
                  if (dialogType === 'cashback') setCashbackForm({...cashbackForm, status: value});
                  if (dialogType === 'loyalty') setLoyaltyForm({...loyaltyForm, status: value});
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                disabled={isAdding || isEditing}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Save Button */}
            <Button
              onClick={selectedItem ? handleEditItem : 
                dialogType === 'membership' ? handleAddMembership :
                dialogType === 'offer' ? handleAddOffer :
                dialogType === 'promo' ? handleAddPromoCode :
                dialogType === 'cashback' ? handleAddCashbackProgram :
                handleAddLoyaltyProgram
              }
              className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold disabled:opacity-50 mt-6"
              disabled={isAdding || isEditing}
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {selectedItem ? 'Updating...' : 'Adding...'}
                </>
              ) : selectedItem ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) setSelectedItem(null);
        setDeleteDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">
                      Delete {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      This action cannot be undone.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 px-6 py-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Are you sure you want to delete this {dialogType}?
                    </h3>
                    <p className="text-red-700 mb-4">
                      This will permanently delete <strong>"{selectedItem?.name || selectedItem?.title || selectedItem?.code}"</strong>.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-red-300">
                      <div className="flex items-center gap-3">
                        {dialogType === 'membership' && <Crown className="w-12 h-12 text-gray-400" />}
                        {dialogType === 'offer' && <Gift className="w-12 h-12 text-gray-400" />}
                        {dialogType === 'promo' && <Tag className="w-12 h-12 text-gray-400" />}
                        {dialogType === 'cashback' && <CreditCard className="w-12 h-12 text-gray-400" />}
                        {dialogType === 'loyalty' && <Star className="w-12 h-12 text-gray-400" />}
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedItem?.name || selectedItem?.title || selectedItem?.code}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedItem?.description?.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(selectedItem?.status || '')}`}>
                              {selectedItem?.status}
                            </span>
                            <span className="px-2 py-1 rounded-md text-xs border border-gray-300">
                              {dialogType === 'membership' && `$${selectedItem?.price}`}
                              {dialogType === 'offer' && (selectedItem?.discountType === 'percentage' ? `${selectedItem?.discountValue}%` : `$${selectedItem?.discountValue}`)}
                              {dialogType === 'promo' && (selectedItem?.discountType === 'percentage' ? `${selectedItem?.discountValue}%` : `$${selectedItem?.discountValue}`)}
                              {dialogType === 'cashback' && (selectedItem?.cashbackType === 'percentage' ? `${selectedItem?.cashbackValue}%` : `$${selectedItem?.cashbackValue}`)}
                              {dialogType === 'loyalty' && `${selectedItem?.pointsPerDollar} pts/$`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedItem(null);
                  }}
                  className="px-6 py-3"
                  disabled={isDeleting === selectedItem?.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting === selectedItem?.id}
                  className="px-8 py-3"
                >
                  {isDeleting === selectedItem?.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
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