"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Search,
  Mail,
  Phone,
  DollarSign,
  Gift,
  ShoppingCart,
  Calendar,
  Eye,
  Loader2,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interface for Branch
export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// Updated Client Interface with branch
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  spendingAmount: number;
  totalOrders: number;
  totalBookings: number;
  membershipTier: "bronze" | "silver" | "gold" | "platinum";
  registrationDate: string;
  lastBookingDate?: string;
  address?: string;
  notes?: string;
  branch?: string; // Branch ID
  branchName?: string; // Branch Name (for display)
  createdAt?: Date;
}

interface ClientsManagementProps {
  role?: "admin" | "super_admin";
}

const MEMBERSHIP_COLORS: Record<
  "bronze" | "silver" | "gold" | "platinum",
  string
> = {
  bronze: "bg-orange-100 text-orange-800",
  silver: "bg-gray-100 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-blue-100 text-blue-800",
};

type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export default function ClientsManagement({
  role = "super_admin",
}: ClientsManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMembership, setFilterMembership] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Add Client State - with branch
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    branch: "", // Branch ID
    membershipTier: "bronze" as MembershipTier,
  });

  // Edit Client State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 🔥 Firebase se real-time data fetch for Branches
  useEffect(() => {
    const fetchBranches = () => {
      try {
        setLoadingBranches(true);
        const branchesRef = collection(db, "branches");
        const q = query(branchesRef, orderBy("name"));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const branchesData: Branch[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              branchesData.push({
                id: doc.id,
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                isActive: data.isActive !== false,
              });
            });

            setBranches(branchesData);
            setLoadingBranches(false);
          },
          (error) => {
            console.error("Error fetching branches: ", error);
            setLoadingBranches(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error in fetchBranches: ", error);
        setLoadingBranches(false);
        return undefined;
      }
    };

    const unsubscribeBranches = fetchBranches();

    return () => {
      if (unsubscribeBranches) {
        unsubscribeBranches();
      }
    };
  }, []);

  // 🔥 Firebase se real-time data fetch for Clients
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchClients = () => {
      try {
        setLoading(true);
        const clientsRef = collection(db, "clients");
        const q = query(clientsRef, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const clientsData: Client[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const branchId = data.branch || "";
              const branch = branches.find(b => b.id === branchId);
              
              clientsData.push({
                id: doc.id,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                email: data.email || "",
                phone: data.phone || "",
                loyaltyPoints: data.loyaltyPoints || 0,
                spendingAmount: data.spendingAmount || 0,
                totalOrders: data.totalOrders || 0,
                totalBookings: data.totalBookings || 0,
                membershipTier: (data.membershipTier ||
                  "bronze") as MembershipTier,
                registrationDate:
                  data.registrationDate ||
                  new Date().toISOString().split("T")[0],
                lastBookingDate: data.lastBookingDate || undefined,
                address: data.address || undefined,
                notes: data.notes || undefined,
                branch: branchId,
                branchName: branch ? branch.name : undefined,
                createdAt: data.createdAt?.toDate() || new Date(),
              });
            });

            setClients(clientsData);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching clients: ", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error in fetchClients: ", error);
        setLoading(false);
      }
    };

    fetchClients();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [branches]);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const searchMatch =
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);

    const membershipMatch =
      filterMembership === "all" || client.membershipTier === filterMembership;

    const branchMatch =
      filterBranch === "all" || client.branch === filterBranch;

    return searchMatch && membershipMatch && branchMatch;
  });

  // Calculate metrics
  const totalClients = clients.length;
  const totalSpending = clients.reduce((sum, c) => sum + c.spendingAmount, 0);
  const totalLoyaltyPoints = clients.reduce(
    (sum, c) => sum + c.loyaltyPoints,
    0
  );
  const totalOrders = clients.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSpending / totalOrders : 0;

  // Get branch name by ID
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "No Branch";
  };

  // 🔥 Add Client to Firebase with branch
  const handleAddClient = async () => {
    if (
      !newClient.firstName ||
      !newClient.lastName ||
      !newClient.email ||
      !newClient.phone
    ) {
      alert("Please fill all required fields");
      return;
    }

    setIsAdding(true);
    try {
      const clientsRef = collection(db, "clients");
      const selectedBranch = branches.find(b => b.id === newClient.branch);
      
      const newClientData = {
        firstName: newClient.firstName.trim(),
        lastName: newClient.lastName.trim(),
        email: newClient.email.trim().toLowerCase(),
        phone: newClient.phone.trim(),
        address: newClient.address.trim(),
        notes: newClient.notes.trim(),
        branch: newClient.branch || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        loyaltyPoints: 0,
        spendingAmount: 0,
        totalOrders: 0,
        totalBookings: 0,
        membershipTier: newClient.membershipTier,
        registrationDate: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
      };

      await addDoc(clientsRef, newClientData);

      // Reset form
      setNewClient({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        branch: "",
        membershipTier: "bronze",
      });

      // Close sheet
      setIsAddSheetOpen(false);
      alert("Client added successfully!");
    } catch (error) {
      console.error("Error adding client: ", error);
      alert("Error adding client. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Client in Firebase
  const handleEditClient = async () => {
    if (!editingClient) return;

    if (
      !editingClient.firstName ||
      !editingClient.lastName ||
      !editingClient.email ||
      !editingClient.phone
    ) {
      alert("Please fill all required fields");
      return;
    }

    setIsEditing(true);
    try {
      const clientDoc = doc(db, "clients", editingClient.id);
      const selectedBranch = branches.find(b => b.id === editingClient.branch);
      
      await updateDoc(clientDoc, {
        firstName: editingClient.firstName.trim(),
        lastName: editingClient.lastName.trim(),
        email: editingClient.email.trim().toLowerCase(),
        phone: editingClient.phone.trim(),
        address: editingClient.address?.trim() || "",
        notes: editingClient.notes?.trim() || "",
        branch: editingClient.branch || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        membershipTier: editingClient.membershipTier,
        lastBookingDate: editingClient.lastBookingDate || null,
        updatedAt: new Date(),
      });

      // Close edit sheet
      setIsEditSheetOpen(false);
      setEditingClient(null);
      alert("Client updated successfully!");
    } catch (error) {
      console.error("Error updating client: ", error);
      alert("Error updating client. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Client from Firebase
  const handleDeleteClient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const clientDoc = doc(db, "clients", id);
      await deleteDoc(clientDoc);
      alert("Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client: ", error);
      alert("Error deleting client. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Open Edit Sheet with client data
  const openEditSheet = (client: Client) => {
    setEditingClient({ ...client });
    setIsEditSheetOpen(true);
  };

  // Handle Export Clients
  const handleExportClients = () => {
    const csv = [
      [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Branch",
        "Loyalty Points",
        "Spending Amount",
        "Total Orders",
        "Total Bookings",
        "Membership Tier",
        "Registration Date",
        "Last Booking Date",
        "Address",
        "Notes",
      ],
      ...filteredClients.map((c) => [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.branchName || getBranchName(c.branch || "") || "No Branch",
        c.loyaltyPoints,
        c.spendingAmount,
        c.totalOrders,
        c.totalBookings,
        c.membershipTier,
        c.registrationDate,
        c.lastBookingDate || "",
        c.address || "",
        c.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `clients-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle Import Clients
  const handleImportClients = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.trim().split("\n");

        for (let i = 1; i < lines.length; i++) {
          // Simple CSV parsing - assuming no commas in fields
          const values = lines[i].split(",").map((v) => v.replace(/"/g, ""));

          if (values.length >= 10) {
            const branchName = values[4] || "";
            const branch = branches.find(b => b.name === branchName);
            
            const clientData = {
              firstName: values[0] || "",
              lastName: values[1] || "",
              email: values[2] || "",
              phone: values[3] || "",
              branch: branch ? branch.id : null,
              branchName: branchName || null,
              loyaltyPoints: parseInt(values[5]) || 0,
              spendingAmount: parseFloat(values[6]) || 0,
              totalOrders: parseInt(values[7]) || 0,
              totalBookings: parseInt(values[8]) || 0,
              membershipTier: (values[9] || "bronze") as MembershipTier,
              registrationDate:
                values[10] || new Date().toISOString().split("T")[0],
              lastBookingDate: values[11] || undefined,
              address: values[12] || undefined,
              notes: values[13] || undefined,
              createdAt: new Date(),
            };

            await addDoc(collection(db, "clients"), clientData);
          }
        }

        alert("Clients imported successfully!");
      } catch (error) {
        console.error("Error importing clients:", error);
        alert("Error importing file. Please ensure it's a valid CSV.");
      }
    };
    reader.readAsText(file);
  };

  // Render loading state
  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Clients
                </p>
                <p className="text-3xl font-serif font-bold text-primary">
                  {totalClients}
                </p>
              </div>
              <ShoppingCart className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Spending
                </p>
                <p className="text-3xl font-serif font-bold text-primary">
                  AED {totalSpending.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Loyalty Points
                </p>
                <p className="text-3xl font-serif font-bold text-primary">
                  {totalLoyaltyPoints.toLocaleString()}
                </p>
              </div>
              <Gift className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Avg Order Value
                </p>
                <p className="text-3xl font-serif font-bold text-primary">
                  AED {avgOrderValue.toFixed(2)}
                </p>
              </div>
              <ShoppingCart className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-gray-200"
            disabled={loading}
          />
          <select
            value={filterMembership}
            onChange={(e) => setFilterMembership(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
            disabled={loading}
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportClients}
            variant="outline"
            className="border-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50"
            disabled={loading || filteredClients.length === 0}
          >
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="border-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
            asChild
          >
            <label className="cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
              <input
                type="file"
                accept=".csv"
                onChange={handleImportClients}
                className="hidden"
                disabled={loading}
              />
            </label>
          </Button>

          {/* Add Client Sheet */}
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg flex items-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                <Plus className="w-4 h-4" /> Add Client
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
              <SheetHeader>
                <SheetTitle className="font-bold text-4xl text-center text-slate-700">
                  Add New Client
                </SheetTitle>
                <SheetDescription className="font-bold text-md text-center text-slate-800">
                  Create a new client record
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-xs font-bold uppercase">
                    First Name *
                  </Label>
                  <Input
                    placeholder="First name"
                    value={newClient.firstName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, firstName: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Last Name *
                  </Label>
                  <Input
                    placeholder="Last name"
                    value={newClient.lastName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, lastName: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Phone *</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                    disabled={isAdding}
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Membership Tier
                  </Label>
                  <select
                    value={newClient.membershipTier}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        membershipTier: e.target.value as MembershipTier,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={isAdding}
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Address</Label>
                  <Input
                    placeholder="Street address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Notes</Label>
                  <textarea
                    placeholder="Any additional notes..."
                    value={newClient.notes}
                    onChange={(e) =>
                      setNewClient({ ...newClient, notes: e.target.value })
                    }
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    disabled={isAdding}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAddClient}
                  className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold disabled:opacity-50"
                  disabled={
                    isAdding ||
                    !newClient.firstName ||
                    !newClient.lastName ||
                    !newClient.email ||
                    !newClient.phone
                  }
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Client"
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <CardTitle className="text-lg font-serif">
            All Clients ({filteredClients.length})
            {loading && clients.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                Syncing...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading && clients.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-secondary" />
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || filterMembership !== "all" || filterBranch !== "all"
                    ? "No clients match your search criteria"
                    : "No clients found. Add your first client!"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">
                      Contact
                    </th>
                   
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Spending
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Points
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={cn(
                            MEMBERSHIP_COLORS[client.membershipTier],
                            "rounded-full"
                          )}
                        >
                          {client.membershipTier}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                        AED {client.spendingAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-primary">
                        {client.loyaltyPoints.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {client.totalOrders}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {client.totalBookings}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Details Button */}
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedClient(client)}
                                className="text-secondary hover:bg-secondary rounded-lg"
                                disabled={isDeleting === client.id}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
                              <SheetHeader>
                                <SheetTitle>Client Details</SheetTitle>
                              </SheetHeader>
                              {selectedClient && (
                                <div className="space-y-6 mt-6">
                                  <div>
                                    <h3 className="font-bold text-lg mb-4">
                                      {selectedClient.firstName}{" "}
                                      {selectedClient.lastName}
                                    </h3>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Email
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.email}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Phone
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.phone}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Address
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.address || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Branch
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.branchName || 
                                             getBranchName(selectedClient.branch || "") || 
                                             "N/A"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Membership Tier
                                          </p>
                                          <Badge
                                            className={cn(
                                              MEMBERSHIP_COLORS[
                                                selectedClient.membershipTier
                                              ],
                                              "rounded-full"
                                            )}
                                          >
                                            {selectedClient.membershipTier}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                                            Registration Date
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.registrationDate}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-bold mb-3">
                                          Activity & Metrics
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                                            <p className="text-xs font-bold uppercase text-muted-foreground">
                                              Total Spending
                                            </p>
                                            <p className="text-2xl font-bold text-primary mt-1">
                                              AED
                                              {selectedClient.spendingAmount.toLocaleString()}
                                            </p>
                                          </div>
                                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                                            <p className="text-xs font-bold uppercase text-muted-foreground">
                                              Loyalty Points
                                            </p>
                                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                              {selectedClient.loyaltyPoints.toLocaleString()}
                                            </p>
                                          </div>
                                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                                            <p className="text-xs font-bold uppercase text-muted-foreground">
                                              Total Orders
                                            </p>
                                            <p className="text-2xl font-bold text-green-600 mt-1">
                                              {selectedClient.totalOrders}
                                            </p>
                                          </div>
                                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                                            <p className="text-xs font-bold uppercase text-muted-foreground">
                                              Bookings
                                            </p>
                                            <p className="text-2xl font-bold text-orange-600 mt-1">
                                              {selectedClient.totalBookings}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <div className="mt-3">
                                          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                            Last Booking
                                          </p>
                                          <p className="text-sm font-semibold">
                                            {selectedClient.lastBookingDate ||
                                              "No bookings yet"}
                                          </p>
                                        </div>
                                        {selectedClient.notes && (
                                          <div className="mt-3">
                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                              Notes
                                            </p>
                                            <p className="text-sm">
                                              {selectedClient.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>

                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditSheet(client)}
                            className="text-green-700 hover:bg-green-700 rounded-lg"
                            disabled={isDeleting === client.id}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:bg-red-600  rounded-lg disabled:opacity-50"
                            disabled={isDeleting === client.id}
                          >
                            {isDeleting === client.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Client Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
            <SheetDescription>Update client information</SheetDescription>
          </SheetHeader>
          {editingClient && (
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-xs font-bold uppercase">
                  First Name *
                </Label>
                <Input
                  placeholder="First name"
                  value={editingClient.firstName}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      firstName: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Last Name *
                </Label>
                <Input
                  placeholder="Last name"
                  value={editingClient.lastName}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      lastName: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Email *</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={editingClient.email}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Phone *</Label>
                <Input
                  placeholder="(555) 123-4567"
                  value={editingClient.phone}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
             
              <div>
                <Label className="text-xs font-bold uppercase">
                  Membership Tier
                </Label>
                <select
                  value={editingClient.membershipTier}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      membershipTier: e.target.value as MembershipTier,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isEditing}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Loyalty Points
                </Label>
                <Input
                  type="number"
                  placeholder="Loyalty Points"
                  value={editingClient.loyaltyPoints}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      loyaltyPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Spending Amount (AED)
                </Label>
                <Input
                  type="number"
                  placeholder="Spending Amount"
                  value={editingClient.spendingAmount}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      spendingAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Address</Label>
                <Input
                  placeholder="Street address"
                  value={editingClient.address || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      address: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                  disabled={isEditing}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Notes</Label>
                <textarea
                  placeholder="Any additional notes..."
                  value={editingClient.notes || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      notes: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                  disabled={isEditing}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleEditClient}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold disabled:opacity-50"
                disabled={
                  isEditing ||
                  !editingClient.firstName ||
                  !editingClient.lastName ||
                  !editingClient.email ||
                  !editingClient.phone
                }
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Client"
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}