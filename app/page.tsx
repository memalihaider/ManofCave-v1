'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, MapPin, Star, Clock, Phone, Mail, Award, Users, 
  Calendar, ChevronRight, ShoppingBag, Ticket, ArrowRight,
  Quote, Instagram, CheckCircle2, ShieldCheck, Zap, Building,
  Loader2, TrendingUp, Package, DollarSign, RefreshCw
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import Link from "next/link";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== STORE DEFINITION ====================
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
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  sku: string;
  rating: number;
  reviews: number;
  revenue: number;
  status: string;
  totalSold: number;
  totalStock: number;
  branchNames: string[];
  branches: string[];
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  role: string;
  rating: number;
  reviews: number;
  status: string;
  bio?: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  openingTime: string;
  closingTime: string;
  phone: string;
  email: string;
  status: string;
}

interface HomeStore {
  // Data
  services: Service[];
  products: Product[];
  staff: StaffMember[];
  branches: Branch[];
  stats: {
    totalStaff: number;
    totalServices: number;
    totalProducts: number;
    totalBranches: number;
  };
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHomeData: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  calculateStats: () => void;
}

const useHomeStore = create<HomeStore>((set, get) => ({
  // Initial state
  services: [],
  products: [],
  staff: [],
  branches: [],
  stats: {
    totalStaff: 0,
    totalServices: 0,
    totalProducts: 0,
    totalBranches: 0
  },
  isLoading: false,
  error: null,

  // Fetch all home data
  fetchHomeData: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchServices(),
        get().fetchProducts(),
        get().fetchStaff(),
        get().fetchBranches()
      ]);
      get().calculateStats();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error fetching home data:', error);
      set({ 
        error: 'Failed to load data. Please try again.', 
        isLoading: false 
      });
    }
  },

  // Fetch services
  fetchServices: async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('createdAt', 'desc'), limit(6));
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
        });
      });
      
      set({ services: servicesData });
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  },

  // Fetch products
  fetchProducts: async () => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'), limit(8));
      const querySnapshot = await getDocs(q);
      
      const productsData: Product[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          name: data.name || 'Unnamed Product',
          description: data.description || 'No description available',
          price: Number(data.price) || 0,
          cost: Number(data.cost) || 0,
          category: data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
          sku: data.sku || 'N/A',
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          revenue: Number(data.revenue) || 0,
          status: data.status || 'active',
          totalSold: Number(data.totalSold) || 0,
          totalStock: Number(data.totalStock) || 0,
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
        });
      });
      
      set({ products: productsData });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  },

  // Fetch staff
  fetchStaff: async () => {
    try {
      const staffRef = collection(db, 'staff');
      const q = query(staffRef, orderBy('name', 'asc'), limit(4));
      const querySnapshot = await getDocs(q);
      
      const staffData: StaffMember[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        staffData.push({
          id: doc.id,
          name: data.name || 'Unknown Staff',
          image: data.imageUrl || data.avatar || data.photoURL || '/default-avatar.png',
          role: data.role || data.position || 'Barber',
          rating: Number(data.rating) || 4.5,
          reviews: Number(data.reviews) || 0,
          status: data.status || 'active',
          bio: data.description || data.experience || 'Professional barber with extensive experience.',
        });
      });
      
      set({ staff: staffData });
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  },

  // Fetch branches
  fetchBranches: async () => {
    try {
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, orderBy('name', 'asc'), limit(4));
      const querySnapshot = await getDocs(q);
      
      const branchesData: Branch[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        branchesData.push({
          id: doc.id,
          name: data.name || 'Unnamed Branch',
          address: data.address || 'Address not available',
          city: data.city || 'City not available',
          country: data.country || 'Country not available',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '18:00',
          phone: data.phone || 'N/A',
          email: data.email || 'N/A',
          status: data.status || 'active',
        });
      });
      
      set({ branches: branchesData });
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  },

  // Calculate statistics
  calculateStats: () => {
    const state = get();
    set({
      stats: {
        totalStaff: state.staff.length,
        totalServices: state.services.length,
        totalProducts: state.products.length,
        totalBranches: state.branches.length
      }
    });
  },
}));

// ==================== MAIN COMPONENT ====================
export default function Home() {
  const { 
    services, 
    products, 
    staff, 
    branches, 
    stats,
    isLoading, 
    error, 
    fetchHomeData 
  } = useHomeStore();

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Calculate real-time stats
  const totalActiveServices = services.filter(s => s.status === 'active').length;
  const totalActiveProducts = products.filter(p => p.status === 'active').length;
  const totalActiveStaff = staff.filter(s => s.status === 'active').length;
  const totalActiveBranches = branches.filter(b => b.status === 'active').length;

  // Calculate total revenue
  const totalServicesRevenue = services.reduce((sum, service) => sum + service.revenue, 0);
  const totalProductsRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  const totalRevenue = totalServicesRevenue + totalProductsRevenue;

  const coupons = [
    { code: "WELCOME20", discount: "20% OFF", description: "On your first visit", color: "bg-secondary" },
    { code: "LUXURY50", discount: "$50 OFF", description: "On Premium Packages", color: "bg-primary" },
    { code: "STYLE10", discount: "10% OFF", description: "On all hair products", color: "bg-accent" },
    { code: "GROOMED", discount: "FREE SHAVE", description: "With any signature cut", color: "bg-secondary" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-semibold text-primary">Loading premium experience...</p>
          <p className="text-sm text-gray-500">Fetching real-time data from Firebase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-primary">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={fetchHomeData} 
            className="mt-4 bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={fetchHomeData}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-xl"
          title="Refresh data from Firebase"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden mt-[3.5rem]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/70 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-secondary">For The Modern Caveman</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            Unleash Your <br />
            <span className="text-secondary italic">Raw</span> Potential
          </h1>
          
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light text-gray-300 leading-relaxed drop-shadow-lg">
            Primal grooming for the modern man. Embrace your inner strength with bold, authentic style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Button size="lg" asChild className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-10 py-7 text-base rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:shadow-[0_0_50px_rgba(197,160,89,0.5)] hover:scale-105 active:scale-95">
              <Link href="/services">RESERVE YOUR SERVICE</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-primary hover:bg-white hover:text-primary px-10 py-7 text-base rounded-xl transition-all duration-500 backdrop-blur-sm hover:scale-105 active:scale-95">
              <Link href="/services">VIEW OUR MENU</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-2 bg-secondary rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Trust Bar - Real-time Data */}
      <section className="py-10 border-b border-gray-100 bg-white relative z-20 -mt-10 mx-4 md:mx-10 rounded-2xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { 
                icon: Award, 
                label: "Master Barbers", 
                value: `${totalActiveStaff}+`, 
                desc: "Expertly Trained",
                data: totalActiveStaff
              },
              { 
                icon: Users, 
                label: "Active Services", 
                value: `${totalActiveServices}+`, 
                desc: "Premium Offerings",
                data: totalActiveServices
              },
              { 
                icon: MapPin, 
                label: "Luxury Studios", 
                value: `${totalActiveBranches}+`, 
                desc: "Prime Locations",
                data: totalActiveBranches
              },
              { 
                icon: TrendingUp, 
                label: "Total Revenue", 
                value: `$${Math.floor(totalRevenue/1000)}k+`, 
                desc: "Generated Value",
                data: totalRevenue
              },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                  <stat.icon className="w-6 h-6 text-secondary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-2xl font-serif font-bold text-primary mb-0.5">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">{stat.label}</span>
                <span className="text-[9px] text-muted-foreground font-medium">{stat.desc}</span>
                <div className="w-16 h-1 bg-secondary/20 rounded-full mt-2">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (stat.data || 0) * 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured In Section */}
      <section className="py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-8 font-bold">As Featured In</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['GQ', 'VOGUE', 'ESQUIRE', 'FORBES', 'MEN\'S HEALTH'].map((brand) => (
              <span key={brand} className="text-2xl md:text-3xl font-serif font-black tracking-tighter text-primary">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Coupon Slider Section */}
      <section className="py-20 px-4 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Exclusive Privileges</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Member Rewards</h2>
            </div>
            <p className="text-muted-foreground max-w-md text-sm font-light">
              Unlock premium benefits and exclusive savings designed for our most loyal patrons.
            </p>
          </div>
          
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-6">
              {coupons.map((coupon, i) => (
                <CarouselItem key={i} className="pl-6 md:basis-1/2 lg:basis-1/4">
                  <div className={cn(
                    "p-8 rounded-3xl text-white relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2",
                    coupon.color
                  )}>
                    <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                      <Ticket className="w-32 h-32 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold tracking-widest opacity-70 uppercase block mb-1">{coupon.description}</span>
                        <h4 className="text-4xl font-serif font-bold">{coupon.discount}</h4>
                      </div>
                      <div className="pt-4 flex items-center justify-between border-t border-white/20">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest opacity-60">Use Code</span>
                          <code className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono font-bold tracking-wider block">{coupon.code}</code>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 text-white">
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex justify-end gap-3 mt-8">
              <CarouselPrevious className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
              <CarouselNext className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Services Slider Section - Real-time Data */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Our Signature Menu</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Bespoke Services</h2>
              <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                {services.length} Premium Services Available
              </Badge>
            </div>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-8 py-6 font-bold tracking-widest group transition-all duration-500">
              <Link href="/services" className="flex items-center">
                EXPLORE FULL MENU <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Services Available</h3>
              <p className="text-gray-400 font-light">Add services to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-6">
                {services.map((service) => (
                  <CarouselItem key={service.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                    <Card className="group border-none bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden rounded-[2rem] transition-all duration-500">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img 
                          src={service.imageUrl || "https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop"} 
                          alt={service.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-6 right-6">
                          <div className="bg-white/90 backdrop-blur-md text-primary border-none px-4 py-2 rounded-2xl font-black text-sm shadow-xl">
                            ${service.price}
                          </div>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-primary font-black rounded-xl py-6 shadow-2xl">
                            <Link href={`/booking?service=${service.id}`}>BOOK THIS SERVICE</Link>
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="px-8 pt-8 pb-2">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] text-secondary border-secondary/30">
                            {service.category}
                          </Badge>
                          <div className="flex items-center gap-2 text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">{service.duration} MIN</span>
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300">
                          {service.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 font-light">
                          {service.description || "Premium grooming service for the modern gentleman"}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] text-gray-500">
                              {service.branchNames?.length || 0} branch(es)
                            </span>
                          </div>
                          <Badge className={cn(
                            "text-[9px]",
                            service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {service.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:flex justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
                <CarouselNext className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      {/* Products Slider Section - Real-time Data */}
      <section className="py-24 px-4 bg-[#0f0f0f] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 blur-[150px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/20 px-3 py-1 rounded-full border border-secondary/30">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Premium Apothecary</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">Grooming Essentials</h2>
              <Badge variant="outline" className="text-xs border-white/20 text-white">
                {products.length} Premium Products Available
              </Badge>
            </div>
            <Button asChild variant="outline" className="border-white/20 text-black bg-white hover:text-primary rounded-full px-8 py-6 font-bold tracking-widest group transition-all duration-500">
              <Link href="/products" className="flex items-center">
                SHOP ALL PRODUCTS <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-300 mb-2">No Products Available</h3>
              <p className="text-gray-400 font-light">Add products to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-6">
                {products.map((product) => (
                  <CarouselItem key={product.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                    <div className="group cursor-pointer bg-white/[0.03] p-6 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.07] hover:border-secondary/50 transition-all duration-500">
                      <div className="relative aspect-square overflow-hidden mb-6 rounded-[2rem] bg-white/5">
                        <img 
                          src={product.imageUrl || "https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop"} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        {product.totalStock <= 5 && (
                          <div className="absolute top-4 left-4 bg-secondary text-primary px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-2xl">
                            LIMITED STOCK
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <Button asChild className="bg-white text-primary hover:bg-secondary hover:text-primary rounded-full w-12 h-12 p-0 shadow-2xl">
                            <Link href={`/products#${product.id}`}>
                              <ShoppingBag className="w-5 h-5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-black border-gray-700">
                            {product.category}
                          </Badge>
                          <span className="text-secondary font-black text-lg">${product.price}</span>
                        </div>
                        <h4 className="text-xl font-serif font-bold group-hover:text-secondary transition-colors duration-300 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn(
                                "w-2.5 h-2.5", 
                                s <= Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-gray-700"
                              )} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-gray-400">{product.rating.toFixed(1)}</span>
                          <span className="text-[9px] text-gray-600">({product.reviews})</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                          <span>SKU: {product.sku}</span>
                          <span>Stock: {product.totalStock}</span>
                        </div>
                        <Button asChild className="w-full mt-6 bg-white/10 hover:bg-secondary hover:text-primary text-white rounded-2xl py-6 text-[10px] font-black tracking-[0.2em] transition-all duration-500 border border-white/5 hover:border-secondary">
                          <Link href={`/products?product=${product.id}`}>ADD TO COLLECTION</Link>
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:flex justify-end gap-3 mt-12">
                <CarouselPrevious className="static translate-y-0 border-white/10 text-white hover:bg-white/10 transition-all" />
                <CarouselNext className="static translate-y-0 border-white/10 text-white hover:bg-white/10 transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      {/* Staff Slider Section - Real-time Data */}
      <section className="py-32 px-4 bg-gray-50/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full mb-4">
              <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">The Artisans</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">Meet The Masters</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light text-lg">
              Our barbers are more than just stylists; they are highly trained artisans dedicated to the perfection of their craft.
            </p>
            <Badge variant="outline" className="mt-4 border-secondary/30 text-secondary">
              {staff.length} Professional Staff Members
            </Badge>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Staff Available</h3>
              <p className="text-gray-400 font-light">Add staff to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-8">
                {staff.map((member) => (
                  <CarouselItem key={member.id} className="pl-8 basis-1/4">
                    <Card className="group overflow-hidden border-none shadow-none bg-transparent">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] mb-8 shadow-2xl">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-10">
                          <div className="flex gap-4 mb-6 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                            <a href="#" className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary hover:scale-110 transition-all shadow-xl">
                              <Instagram className="w-5 h-5" />
                            </a>
                            <Button asChild className="bg-white text-primary hover:bg-secondary hover:text-primary rounded-2xl px-6 font-black text-[10px] tracking-widest shadow-xl">
                              <Link href={`/staff/${member.id}`}>VIEW PROFILE</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <div className="inline-block border border-secondary/30 text-secondary text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1 rounded-full mb-4">
                          {member.role}
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-primary mb-3 group-hover:text-secondary transition-colors duration-300">
                          {member.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-light line-clamp-2 mb-6 leading-relaxed">
                          {member.bio || "Professional barber with extensive experience in modern grooming techniques."}
                        </p>
                        <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn(
                                "w-3 h-3",
                                s <= Math.floor(member.rating) ? "fill-secondary text-secondary" : "text-gray-300"
                              )} />
                            ))}
                          </div>
                          <span className="text-xs font-black text-primary">{member.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            ({member.reviews} REVIEWS)
                          </span>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-6 mt-16">
                <CarouselPrevious className="static translate-y-0 w-14 h-14 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
                <CarouselNext className="static translate-y-0 w-14 h-14 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      {/* Branches Section - Real-time Data */}
      <section className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Our Global Presence</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary leading-[1.1]">
                Luxury Grooming, <br /><span className="text-secondary italic">Everywhere.</span>
              </h2>
              <Badge variant="outline" className="border-secondary/30 text-secondary">
                {branches.length} Premium Branches
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl font-light leading-relaxed">
              With {branches.length} flagship studios across prime locations, we bring the ultimate grooming experience closer to you. Each location is a sanctuary of style.
            </p>
          </div>

          {branches.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Branches Available</h3>
              <p className="text-gray-400 font-light">Add branches to Firebase to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-start gap-6 p-6 rounded-[2rem] bg-gray-50 border border-transparent hover:border-secondary/30 hover:bg-white hover:shadow-2xl transition-all duration-500 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500 shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-black text-primary text-sm uppercase tracking-widest mb-1">
                        {branch.name}
                      </h4>
                      <Badge className={cn(
                        "text-[9px]",
                        branch.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {branch.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                      {branch.address}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {branch.city}, {branch.country}
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[9px] text-gray-600">
                        Hours: {branch.openingTime} - {branch.closingTime}
                      </p>
                      <p className="text-[9px] text-gray-600">
                        Phone: {branch.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {branches.length > 0 && (
            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white px-10 py-8 rounded-2xl group shadow-2xl transition-all duration-500 hover:scale-105">
                <Link href="/branches" className="flex items-center justify-center gap-3 font-black tracking-[0.2em] text-xs">
                  EXPLORE ALL {branches.length} BRANCHES <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 px-4 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block bg-secondary/20 px-4 py-1.5 rounded-full mb-8 border border-secondary/30">
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">The Inner Circle</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-10 leading-tight">
            Join The <span className="text-secondary italic">Elite</span>
          </h2>
          <p className="text-xl text-gray-400 mb-16 font-light max-w-2xl mx-auto leading-relaxed">
            Subscribe to receive exclusive invitations, grooming insights, and priority access to our most sought-after events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 max-w-3xl mx-auto bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
            <input 
              placeholder="Your prestigious email address" 
              className="h-16 bg-transparent text-white rounded-2xl px-8 focus:outline-none transition-all w-full font-light text-lg"
            />
            <Button size="lg" className="h-16 bg-secondary text-primary hover:bg-white hover:scale-105 transition-all font-black px-12 rounded-[1.8rem] shrink-0 tracking-[0.2em] text-xs">
              SUBSCRIBE NOW
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-10 uppercase tracking-[0.3em] font-bold">
            Privacy is our priority. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-primary/95 via-primary/80 to-primary/95"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white space-y-12">
          <h2 className="text-6xl md:text-8xl font-serif font-bold leading-[1.1] tracking-tight">
            Your Chair <br />
            <span className="text-secondary italic">Awaits.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Step into a world where time slows down and style takes center stage. Experience the pinnacle of luxury grooming today.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
            <Button size="lg" asChild className="bg-secondary hover:bg-white text-primary font-black px-14 py-10 text-sm rounded-2xl shadow-[0_20px_50px_rgba(197,160,89,0.3)] transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href="/services">BOOK APPOINTMENT</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-primary hover:bg-white hover:text-primary px-14 py-10 text-sm rounded-2xl backdrop-blur-md transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href="/login">JOIN THE CLUB</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] text-white py-32 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
            <div className="space-y-10">
              <Link href="/" className="inline-block">
                <h3 className="text-3xl font-serif font-bold tracking-tighter">
                  PREMIUM<span className="text-secondary">CUTS</span>
                </h3>
              </Link>
              <div className="space-y-4">
                <p className="text-gray-500 text-base leading-relaxed font-light max-w-xs">
                  The city's premier destination for luxury grooming and traditional barbering since 2015.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {stats.totalServices} Services
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {stats.totalStaff} Masters
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-6">
                {[Instagram, Phone, Mail].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all duration-500 cursor-pointer group shadow-xl">
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Navigation</h4>
              <ul className="space-y-5 text-gray-400 text-sm font-medium">
                {[
                  { label: 'Our Services', href: '/services' },
                  { label: 'Shop Products', href: '/products' },
                  { label: 'Book Appointment', href: '/booking' },
                  { label: 'Our Staff', href: '/staff' },
                  { label: 'Our Branches', href: '/branches' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-secondary transition-colors flex items-center group">
                      <div className="w-0 group-hover:w-4 h-[1px] bg-secondary transition-all duration-300 mr-0 group-hover:mr-3"></div>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Business Stats</h4>
              <ul className="space-y-6 text-gray-400 text-sm font-medium">
                {[
                  { label: 'Total Services', value: stats.totalServices },
                  { label: 'Total Products', value: stats.totalProducts },
                  { label: 'Active Staff', value: stats.totalStaff },
                  { label: 'Active Branches', value: stats.totalBranches },
                  { label: 'Total Revenue', value: `$${Math.floor(totalRevenue/1000)}k` }
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Headquarters</h4>
              <ul className="space-y-8 text-gray-400 text-sm font-medium">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-light leading-relaxed">
                    {branches[0]?.address || "123 Luxury Way, Suite 100"}<br />
                    {branches[0]?.city || "Financial District"}, {branches[0]?.country || "NY 10004"}
                  </span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-light">{branches[0]?.phone || "+1 (555) 000-1234"}</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="font-light">{branches[0]?.email || "concierge@premiumcuts.com"}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-600 text-[9px] tracking-[0.4em] font-black uppercase">
            <p>&copy; 2026 PREMIUM CUTS LUXURY GROOMING. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-12">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}