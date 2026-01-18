'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Scissors, Star, Clock, Search, Filter, Check, ShoppingCart, ChevronRight, Sparkles, Plus, X, Loader2, Calendar, Users, MapPin, Award, Info, DollarSign, TrendingUp, Package, Shield, MessageCircle, Phone, Mail, Navigation, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  where,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

// Types Definition
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
  popularity: string;
  revenue: number;
  status: string;
  totalBookings: number;
  createdAt: any;
  updatedAt: any;
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  position?: string;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
}

// Stores Definition with Real-time Updates
interface ServicesStore {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  hasFetchedInitialData: boolean;
  fetchServices: () => Promise<void>;
  fetchServiceById: (id: string) => Promise<Service | null>;
  setupRealtimeUpdates: () => () => void;
}

const useServicesStore = create<ServicesStore>((set, get) => ({
  services: [],
  isLoading: false,
  error: null,
  hasFetchedInitialData: false,

  fetchServices: async () => {
    if (get().isLoading || get().hasFetchedInitialData) return;
    
    set({ isLoading: true, error: null });
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          name: data.name || 'Unnamed Service',
          description: data.description || 'No description available',
          price: Number(data.price) || 0,
          duration: Number(data.duration) || 30,
          category: data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
          popularity: data.popularity || 'medium',
          revenue: Number(data.revenue) || 0,
          status: data.status || 'active',
          totalBookings: Number(data.totalBookings) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      set({ 
        services: servicesData, 
        isLoading: false, 
        hasFetchedInitialData: true 
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      set({ 
        error: 'Failed to fetch services. Please try again later.', 
        isLoading: false 
      });
    }
  },

  fetchServiceById: async (id: string): Promise<Service | null> => {
    try {
      const serviceRef = doc(db, 'services', id);
      const serviceSnap = await getDoc(serviceRef);
      
      if (serviceSnap.exists()) {
        const data = serviceSnap.data();
        return {
          id: serviceSnap.id,
          name: data.name || 'Unnamed Service',
          description: data.description || 'No description available',
          price: Number(data.price) || 0,
          duration: Number(data.duration) || 30,
          category: data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
          popularity: data.popularity || 'medium',
          revenue: Number(data.revenue) || 0,
          status: data.status || 'active',
          totalBookings: Number(data.totalBookings) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  },

  setupRealtimeUpdates: () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name', 'asc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          servicesData.push({
            id: doc.id,
            name: data.name || 'Unnamed Service',
            description: data.description || 'No description available',
            price: Number(data.price) || 0,
            duration: Number(data.duration) || 30,
            category: data.category || 'Uncategorized',
            categoryId: data.categoryId || '',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
            popularity: data.popularity || 'medium',
            revenue: Number(data.revenue) || 0,
            status: data.status || 'active',
            totalBookings: Number(data.totalBookings) || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        
        set({ 
          services: servicesData, 
          hasFetchedInitialData: true 
        });
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

interface StaffStore {
  staff: StaffMember[];
  isLoading: boolean;
  fetchStaff: () => Promise<void>;
}

const useStaffStore = create<StaffStore>((set) => ({
  staff: [],
  isLoading: false,

  fetchStaff: async () => {
    set({ isLoading: true });
    try {
      const staffRef = collection(db, 'staff');
      const querySnapshot = await getDocs(staffRef);
      
      const staffData: StaffMember[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        staffData.push({
          id: doc.id,
          name: data.name || data.fullName || 'Unknown Staff',
          image: data.imageUrl || data.image || data.photoURL || '/default-avatar.png',
          position: data.position || data.role || 'Barber',
        });
      });
      
      set({ staff: staffData, isLoading: false });
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ staff: [], isLoading: false });
    }
  },
}));

// Updated Booking Store with Firestore Integration
interface BookingStore {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const useBookingStore = create<BookingStore>((set) => ({
  cartItems: [],
  addToCart: (item: CartItem) => set((state) => ({ 
    cartItems: [...state.cartItems, item] 
  })),
  removeFromCart: (id: string) => set((state) => ({
    cartItems: state.cartItems.filter(item => item.id !== id)
  })),
  clearCart: () => set({ cartItems: [] }),
}));

// WhatsApp contact function
const openWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

// Main Component
export default function ServicesPage() {
  const router = useRouter();
  const { addToCart, cartItems } = useBookingStore();
  const { 
    services, 
    fetchServices, 
    fetchServiceById, 
    isLoading: servicesLoading,
    hasFetchedInitialData,
    setupRealtimeUpdates 
  } = useServicesStore();
  const { staff, fetchStaff, isLoading: staffLoading } = useStaffStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedService, setAddedService] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showMultiSelectSheet, setShowMultiSelectSheet] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  
  // New state for service details sidebar
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceSidebarOpen, setIsServiceSidebarOpen] = useState<boolean>(false);
  const [isLoadingService, setIsLoadingService] = useState<boolean>(false);
  
  // Use ref to track if we've already set up real-time updates
  const hasSetupRealtimeRef = useRef<boolean>(false);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!hasFetchedInitialData && !servicesLoading) {
        await fetchServices();
        await fetchStaff();
      }
    };
    
    loadData();
  }, [fetchServices, fetchStaff, hasFetchedInitialData, servicesLoading]);

  // Set up real-time updates
  useEffect(() => {
    if (!hasSetupRealtimeRef.current && hasFetchedInitialData) {
      const cleanup = setupRealtimeUpdates();
      hasSetupRealtimeRef.current = true;
      
      return cleanup;
    }
  }, [hasFetchedInitialData, setupRealtimeUpdates]);

  // Get unique categories from services
  const categories = [
    { id: 'all', name: 'All Services' },
    ...Array.from(new Set(services.map(s => s.category)))
      .filter((category): category is string => Boolean(category && category.trim() !== ''))
      .map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category
      }))
  ];

  // Filter services based on selected filters
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || 
      service.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    
    const matchesSearch = searchQuery === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStaff = selectedStaff === 'all';
    
    return matchesCategory && matchesSearch && matchesStaff;
  });

  // Handle add to cart with Firestore Integration
  const handleAddToCart = async (service: Service) => {
    // Check authentication
    const authData = localStorage.getItem('customerAuth');
    if (!authData) {
      router.push('/customer/login?redirect=/services');
      return;
    }

    try {
      const parsedAuth = JSON.parse(authData);
      const customerData = parsedAuth?.customer;
      if (!customerData) {
        router.push('/customer/login');
        return;
      }

      setIsAddingToCart(service.id);

      const customerId = customerData.id || customerData.uid;
      const customerName = customerData.name || '';
      const customerEmail = customerData.email || '';

      // Check if service already in cart in Firestore
      try {
        const cartQuery = query(
          collection(db, 'cart'),
          where('customerId', '==', customerId),
          where('serviceId', '==', service.id),
          where('status', '==', 'active'),
          where('type', '==', 'service')
        );
        const cartSnapshot = await getDocs(cartQuery);
        
        if (cartSnapshot.empty) {
          // Add new service booking to cart in Firestore
          await addDoc(collection(db, 'cart'), {
            customerId,
            customerName,
            customerEmail,
            serviceId: service.id,
            serviceName: service.name,
            serviceImage: service.imageUrl,
            price: service.price,
            duration: service.duration,
            quantity: 1,
            addedAt: serverTimestamp(),
            status: 'active',
            type: 'service'
          });
        } else {
          // Update quantity in Firestore
          const cartDoc = cartSnapshot.docs[0];
          await updateDoc(doc(db, 'cart', cartDoc.id), {
            quantity: increment(1),
            updatedAt: serverTimestamp()
          });
        }
      } catch (indexError) {
        console.warn('Index error, using fallback method:', indexError);
        // Fallback: Add without complex query
        await addDoc(collection(db, 'cart'), {
          customerId,
          customerName,
          customerEmail,
          serviceId: service.id,
          serviceName: service.name,
          serviceImage: service.imageUrl,
          price: service.price,
          duration: service.duration,
          quantity: 1,
          addedAt: serverTimestamp(),
          status: 'active',
          type: 'service'
        });
      }

      // Also update local cart store
      const cartItem: CartItem = {
        id: service.id,
        name: service.name,
        category: service.category || 'Service',
        duration: service.duration.toString() || '0',
        price: service.price || 0,
        description: service.description || '',
        image: service.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
        rating: 5,
        reviews: 0
      };

      addToCart(cartItem);
      setAddedService(service.id);
      
      setTimeout(() => {
        setAddedService(null);
        setIsAddingToCart(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding service to cart:', error);
      alert('Failed to add service to booking. Please try again.');
      setIsAddingToCart(null);
    }
  };

  // Handle add selected services to cart
  const handleAddSelectedServices = async () => {
    const authData = localStorage.getItem('customerAuth');
    if (!authData) {
      router.push('/customer/login?redirect=/services');
      return;
    }

    try {
      const parsedAuth = JSON.parse(authData);
      const customerData = parsedAuth?.customer;
      if (!customerData) {
        router.push('/customer/login');
        return;
      }

      const customerId = customerData.id || customerData.uid;
      const customerName = customerData.name || '';
      const customerEmail = customerData.email || '';

      const addPromises = Array.from(selectedServices).map(async (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        // Add to Firestore cart
        await addDoc(collection(db, 'cart'), {
          customerId,
          customerName,
          customerEmail,
          serviceId: service.id,
          serviceName: service.name,
          serviceImage: service.imageUrl,
          price: service.price,
          duration: service.duration,
          quantity: 1,
          addedAt: serverTimestamp(),
          status: 'active',
          type: 'service'
        });

        // Also update local cart store
        const cartItem: CartItem = {
          id: service.id,
          name: service.name,
          category: service.category || 'Service',
          duration: service.duration.toString() || '0',
          price: service.price || 0,
          description: service.description || '',
          image: service.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
          rating: 5,
          reviews: 0
        };
        addToCart(cartItem);
      });

      await Promise.all(addPromises);
      
      setSelectedServices(new Set());
      setShowMultiSelectSheet(false);
      setMultiSelectMode(false);
      
      alert(`${selectedServices.size} services added to your booking!`);
      
    } catch (error) {
      console.error('Error adding selected services:', error);
      alert('Failed to add services to booking. Please try again.');
    }
  };

  // Toggle service selection for multi-select
  const toggleServiceSelection = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  // Handle view service details
  const handleViewServiceDetails = async (serviceId: string) => {
    setIsLoadingService(true);
    try {
      const service = await fetchServiceById(serviceId);
      if (service) {
        setSelectedService(service);
        setIsServiceSidebarOpen(true);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
    } finally {
      setIsLoadingService(false);
    }
  };

  // Handle share service
  const handleShareService = (service: Service) => {
    const shareText = `Check out ${service.name} - ${service.description}. Price: AED ${service.price}. Duration: ${service.duration} minutes.`;
    
    if (navigator.share) {
      navigator.share({
        title: `${service.name} - Premium Grooming`,
        text: shareText,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(`${service.name}\n${shareText}\n${window.location.href}`).then(() => {
        alert('Service details copied to clipboard!');
      });
    }
  };

  // Loading state
  const isLoading = servicesLoading || staffLoading;

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold text-primary">Loading services...</p>
          </div>
        </div>
      )}

      {/* Premium Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block bg-secondary/20 px-3 py-1 rounded-full mb-6 border border-secondary/30">
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">The Menu</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Our <span className="text-secondary italic">Services</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed">
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Badge className="bg-secondary text-primary px-4 py-1.5 font-bold">
              Live Data
            </Badge>
            <Badge variant="outline" className="text-white border-white/40">
              {services.length} Services Available
            </Badge>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Multi-select Row */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <Input 
                placeholder="Search services by name or description..." 
                className="pl-11 rounded-2xl border-gray-200 bg-white/80 text-sm h-12 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all shadow-sm"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Multi-select Button */}
            <div className="flex items-center gap-3">
              <Sheet open={showMultiSelectSheet} onOpenChange={setShowMultiSelectSheet}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline"
                    className={cn(
                      "rounded-2xl border-2 font-black tracking-widest text-[10px] uppercase px-6 py-2.5 transition-all gap-2 h-12",
                      selectedServices.size > 0
                        ? "bg-secondary border-secondary text-primary hover:bg-secondary/90 shadow-lg"
                        : "border-secondary text-secondary hover:bg-secondary/10 hover:shadow-md"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    MULTI-SELECT
                    {selectedServices.size > 0 && (
                      <Badge className="bg-primary text-white border-none ml-1 min-w-6 h-6 flex items-center justify-center">
                        {selectedServices.size}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                
                {/* Multi-select Sheet */}
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                  <SheetHeader className="border-b p-6">
                    <SheetTitle className="text-2xl font-serif font-bold text-primary">
                      Select Multiple Services
                    </SheetTitle>
                    <SheetDescription className="text-gray-600">
                      Choose multiple services to add to your booking at once
                    </SheetDescription>
                  </SheetHeader>

                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {filteredServices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No services found. Try adjusting your filters.</p>
                      </div>
                    ) : (
                      filteredServices.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => toggleServiceSelection(service.id)}
                          className={cn(
                            "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md",
                            selectedServices.has(service.id)
                              ? "border-secondary bg-secondary/10 shadow-sm"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <div className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1",
                              selectedServices.has(service.id)
                                ? "bg-secondary border-secondary"
                                : "border-gray-300"
                            )}>
                              {selectedServices.has(service.id) && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            
                            {/* Service Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <h3 className="font-bold text-primary text-lg">{service.name}</h3>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-secondary" />
                                    <span className="text-xs font-bold text-secondary">{service.duration}m</span>
                                  </div>
                                  <span className="font-bold text-primary text-lg">AED {service.price}</span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{service.description}</p>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {service.category}
                                </Badge>
                                <Badge className={cn(
                                  "text-xs",
                                  service.popularity === 'high' ? 'bg-red-100 text-red-800' :
                                  service.popularity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                )}>
                                  {service.popularity}
                                </Badge>
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  service.status === 'active' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                                )}>
                                  {service.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected Services Actions */}
                  {selectedServices.size > 0 && (
                    <div className="sticky bottom-0 bg-white border-t p-6 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-700">Selected Services:</span>
                          <span className="text-lg font-bold text-secondary ml-2">
                            {selectedServices.size} service{selectedServices.size !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <Button 
                          variant="ghost"
                          onClick={() => setSelectedServices(new Set())}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          type="button"
                        >
                          Clear All
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={handleAddSelectedServices}
                        className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-2xl tracking-[0.2em] text-sm shadow-lg"
                        type="button"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        ADD {selectedServices.size} SELECTED SERVICE{selectedServices.size !== 1 ? 'S' : ''} TO BOOKING
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border rounded-2xl min-w-[120px] text-center",
                    selectedCategory === cat.id 
                      ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" 
                      : "bg-white text-primary border-gray-200 hover:border-secondary hover:text-secondary hover:shadow-md"
                  )}
                  type="button"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Filter Section */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Available Staff:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedStaff('all')}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border flex items-center gap-2",
                  selectedStaff === 'all' 
                    ? "bg-secondary/20 text-secondary border-secondary/40 shadow-sm" 
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                )}
                type="button"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold">
                  All
                </div>
                All Barbers
              </button>
              
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaff(member.id)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 border min-w-[140px]",
                    selectedStaff === member.id 
                      ? "bg-secondary/10 text-secondary border-secondary/30 shadow-sm" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  )}
                  type="button"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-bold truncate">{member.name}</div>
                    <div className="text-[9px] text-gray-500 truncate">{member.position || 'Barber'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Services Count and Stats */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary">
                Premium Services
                <span className="text-secondary ml-2">({filteredServices.length})</span>
              </h2>
              <p className="text-gray-600 mt-2">
                Real-time services fetched from Firebase database
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-gray-600">
                Total: {services.length} services
              </Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Live Database
              </Badge>
            </div>
          </div>

          {/* Services Grid */}
          {services.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Services Available</h3>
              <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                No services found in the database. Please add services through Firebase console or contact administrator.
              </p>
              <Button 
                onClick={fetchServices}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px]"
                type="button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH SERVICES
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Matching Services</h3>
              <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                No services match your current filters. Try adjusting your search criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {setSelectedCategory('all'); setSearchQuery(''); setSelectedStaff('all');}}
                className="rounded-full px-8 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[10px]"
                type="button"
              >
                <Filter className="w-4 h-4 mr-2" />
                CLEAR ALL FILTERS
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className="group border-2 border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col hover:border-secondary/20"
                >
                  {/* Service Image with Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop';
                      }}
                    />
                    
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-5 right-5">
                      <div className="bg-white/95 backdrop-blur-sm text-primary border-none px-4 py-2.5 rounded-2xl font-black text-sm shadow-2xl">
                        ${service.price}
                      </div>
                    </div>
                    
                    {/* Popularity Badge */}
                    <div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <Badge className={cn(
                        "border-none px-3 py-1.5 font-black text-[9px] tracking-widest uppercase shadow-lg",
                        service.popularity === 'high' ? 'bg-red-500 text-white' :
                        service.popularity === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-secondary text-primary'
                      )}>
                        {service.popularity === 'high' ? '🔥 HOT' :
                         service.popularity === 'medium' ? '⭐ POPULAR' :
                         '✨ STANDARD'}
                      </Badge>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="absolute top-5 left-5">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 border-white shadow-lg",
                        service.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                      )}></div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardHeader className="pt-7 pb-4 px-7">
                    <div className="flex justify-between items-center mb-3">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] text-secondary border-secondary/30">
                        {service.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-secondary" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {service.duration} MIN
                        </span>
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300 leading-tight">
                      {service.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-7 pb-7 flex-1 flex flex-col">
                    {/* Description */}
                    <p className="text-gray-600 text-sm font-light leading-relaxed line-clamp-3 mb-6 flex-1">
                      {service.description}
                    </p>

                    {/* Service Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">5.0</span>
                          <span className="text-gray-400">({service.totalBookings})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">Revenue:</span>
                          <span>${service.revenue}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold",
                        service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {service.status.toUpperCase()}
                      </div>
                    </div>

                    {/* Branches Info (if available) */}
                    {service.branchNames && service.branchNames.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Available at:</p>
                        <div className="flex flex-wrap gap-2">
                          {service.branchNames.slice(0, 2).map((branch, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-[10px] px-2 py-1 border-gray-200 text-gray-600"
                            >
                              {branch}
                            </Badge>
                          ))}
                          {service.branchNames.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-1 border-gray-200 text-gray-600">
                              +{service.branchNames.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto flex gap-3">
                      <Button 
                        onClick={() => handleAddToCart(service)}
                        disabled={isAddingToCart === service.id}
                        className={cn(
                          "flex-1 h-14 rounded-2xl font-black tracking-[0.2em] text-[10px] transition-all duration-500 shadow-lg group/btn",
                          addedService === service.id 
                            ? "bg-green-600 hover:bg-green-600 text-white scale-95" 
                            : isAddingToCart === service.id
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-primary hover:bg-secondary hover:text-primary text-white"
                        )}
                        type="button"
                      >
                        {isAddingToCart === service.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                            ADDING...
                          </>
                        ) : addedService === service.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2" /> 
                            ADDED TO BOOKING
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:animate-bounce" /> 
                            ADD TO BOOKING
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewServiceDetails(service.id)}
                        className="w-14 h-14 rounded-2xl border-gray-200 text-primary hover:border-secondary hover:text-secondary hover:bg-secondary/10 transition-all duration-500 shadow-sm"
                        type="button"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer Stats */}
          {filteredServices.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Services</p>
                      <p className="text-2xl font-bold text-primary">{services.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Filter className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Filtered Services</p>
                      <p className="text-2xl font-bold text-secondary">{filteredServices.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Services</p>
                      <p className="text-2xl font-bold text-green-600">
                        {services.filter(s => s.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cart Summary */}
              {cartItems.length > 0 && (
                <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-secondary" />
                      <div>
                        <p className="font-bold text-primary">Your Booking Cart</p>
                        <p className="text-sm text-gray-600">
                          {cartItems.length} service{cartItems.length !== 1 ? 's' : ''} selected • 
                          Total: ${cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Link href="/customer/portal?tab=cart">
                      <Button className="bg-secondary hover:bg-secondary/90 text-primary font-bold">
                        View Booking in Portal
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Service Details Sidebar */}
      <Sheet open={isServiceSidebarOpen} onOpenChange={setIsServiceSidebarOpen}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-5 rounded-3xl h-[750px] m-auto">
          {isLoadingService ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedService ? (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>Service Details - {selectedService.name}</SheetTitle>
                <SheetDescription>
                  Detailed information about {selectedService.name} service
                </SheetDescription>
              </SheetHeader>
              
              <div className="h-full">
                {/* Header with Image */}
                <div className="relative h-64">
                  <img 
                    src={selectedService.imageUrl} 
                    alt={selectedService.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    onClick={() => setIsServiceSidebarOpen(false)}
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">
                      {selectedService.name}
                    </h2>
                    <div className="flex items-center gap-2 text-white/90">
                      <Scissors className="w-4 h-4" />
                      <span>{selectedService.category}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">${selectedService.price}</div>
                      <div className="text-xs text-gray-600">Price</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedService.duration}m</div>
                      <div className="text-xs text-gray-600">Duration</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedService.totalBookings}</div>
                      <div className="text-xs text-gray-600">Bookings</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="bookings">Quick Action</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">About This Service</h3>
                        <p className="text-gray-600">
                          {selectedService.description}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-2">Service Information</h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-secondary" />
                              <span className="font-medium">Duration</span>
                            </div>
                            <span className="font-bold">{selectedService.duration} minutes</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-secondary" />
                              <span className="font-medium">Popularity</span>
                            </div>
                            <Badge className={cn(
                              "font-bold",
                              selectedService.popularity === 'high' ? 'bg-red-100 text-red-800' :
                              selectedService.popularity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            )}>
                              {selectedService.popularity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-secondary" />
                              <span className="font-medium">Status</span>
                            </div>
                            <Badge className={cn(
                              "font-bold",
                              selectedService.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            )}>
                              {selectedService.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {selectedService.branchNames && selectedService.branchNames.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-2">Available Branches</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedService.branchNames.map((branch, i) => (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                <MapPin className="w-4 h-4 text-secondary" />
                                <span className="text-sm">{branch}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Financial Information</h3>
                          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-secondary" />
                                <span className="font-medium">Service Price</span>
                              </div>
                              <span className="font-bold text-green-600">${selectedService.price}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-secondary" />
                                <span className="font-medium">Total Revenue</span>
                              </div>
                              <span className="font-bold text-blue-600">${selectedService.revenue}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-lg mb-2">Service ID & Timestamps</h3>
                          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Service ID:</span>
                              <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                {selectedService.id}
                              </code>
                            </div>
                            {selectedService.categoryId && (
                              <div className="text-sm">
                                <span className="font-medium">Category ID:</span>
                                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                  {selectedService.categoryId}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="bookings" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => handleAddToCart(selectedService)}
                              type="button"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add to Booking
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => openWhatsApp(
                                `Hi, I'm interested in ${selectedService.name} service. Can you tell me more about it?`
                              )}
                              type="button"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => router.push('/booking')}
                              type="button"
                            >
                              <Calendar className="w-4 h-4" />
                              Book Now
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => handleShareService(selectedService)}
                              type="button"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Quick Actions */}
                  <div className="pt-6 border-t">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => {
                          handleAddToCart(selectedService);
                          setIsServiceSidebarOpen(false);
                        }}
                        type="button"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Booking
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/booking?service=${selectedService.id}`)}
                        type="button"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No service details available.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => {
            fetchServices();
            fetchStaff();
          }}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-xl"
          title="Refresh data from Firebase"
          type="button"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Refresh Icon Component
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}