'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Store, Clock, Bell, Shield, CreditCard, Save, Upload } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/stores/currency.store";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [settings, setSettings] = useState({
    // Business Settings
    businessName: "Man of Cave Downtown",
    businessEmail: "downtown@manofcave.com",
    businessPhone: "(555) 123-4567",
    businessAddress: "123 Main Street, Downtown, NY 10001",
    businessDescription: "Man of Cave offering traditional and modern grooming with expert stylists.",
    timezone: "America/New_York",

    // Operating Hours
    monday: { open: "09:00", close: "19:00", closed: false },
    tuesday: { open: "09:00", close: "19:00", closed: false },
    wednesday: { open: "09:00", close: "19:00", closed: false },
    thursday: { open: "09:00", close: "19:00", closed: false },
    friday: { open: "09:00", close: "19:00", closed: false },
    saturday: { open: "08:00", close: "17:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    marketingEmails: false,

    // Booking Settings
    advanceBookingDays: 30,
    cancellationHours: 24,
    autoConfirmBookings: false,
    requireDeposit: false,
    depositAmount: 0,

    // Payment Settings
    acceptCash: true,
    acceptCard: true,
    acceptDigital: true,
    taxRate: 8.875
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleOperatingHoursChange = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev] as any,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    // Show success message
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar role="branch_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar role="branch_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-600">Manage your business settings</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrencySwitcher />
                <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
              <Tabs defaultValue="business" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="business" className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="hours" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hours
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="booking" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Booking
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                {/* Business Settings */}
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                      <CardDescription>Update your business details and profile</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={settings.businessName}
                            onChange={(e) => handleSettingChange('businessName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessEmail">Business Email</Label>
                          <Input
                            id="businessEmail"
                            type="email"
                            value={settings.businessEmail}
                            onChange={(e) => handleSettingChange('businessEmail', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone">Business Phone</Label>
                          <Input
                            id="businessPhone"
                            value={settings.businessPhone}
                            onChange={(e) => handleSettingChange('businessPhone', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/New_York">Eastern Time</SelectItem>
                              <SelectItem value="America/Chicago">Central Time</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Textarea
                          id="businessAddress"
                          value={settings.businessAddress}
                          onChange={(e) => handleSettingChange('businessAddress', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessDescription">Business Description</Label>
                        <Textarea
                          id="businessDescription"
                          value={settings.businessDescription}
                          onChange={(e) => handleSettingChange('businessDescription', e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Logo</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Store className="w-8 h-8 text-gray-400" />
                          </div>
                          <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Operating Hours */}
                <TabsContent value="hours">
                  <Card>
                    <CardHeader>
                      <CardTitle>Operating Hours</CardTitle>
                      <CardDescription>Set your business hours for each day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {daysOfWeek.map((day) => (
                          <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-24">
                              <Label className="text-sm font-medium">{day.label}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!(settings[day.key as keyof typeof settings] as any).closed}
                                onCheckedChange={(checked) => handleOperatingHoursChange(day.key, 'closed', !checked)}
                              />
                              <span className="text-sm text-gray-600">
                                {(settings[day.key as keyof typeof settings] as any).closed ? 'Closed' : 'Open'}
                              </span>
                            </div>
                            {!((settings[day.key as keyof typeof settings] as any).closed) && (
                              <>
                                <Input
                                  type="time"
                                  value={(settings[day.key as keyof typeof settings] as any).open}
                                  onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-sm text-gray-600">to</span>
                                <Input
                                  type="time"
                                  value={(settings[day.key as keyof typeof settings] as any).close}
                                  onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                                  className="w-32"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Configure how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Email Notifications</Label>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">SMS Notifications</Label>
                            <p className="text-sm text-gray-600">Receive notifications via text message</p>
                          </div>
                          <Switch
                            checked={settings.smsNotifications}
                            onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Booking Reminders</Label>
                            <p className="text-sm text-gray-600">Send automatic reminders to customers</p>
                          </div>
                          <Switch
                            checked={settings.bookingReminders}
                            onCheckedChange={(checked) => handleSettingChange('bookingReminders', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Marketing Emails</Label>
                            <p className="text-sm text-gray-600">Send promotional emails to customers</p>
                          </div>
                          <Switch
                            checked={settings.marketingEmails}
                            onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Booking Settings */}
                <TabsContent value="booking">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Settings</CardTitle>
                      <CardDescription>Configure booking policies and rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="advanceBooking">Advance Booking (Days)</Label>
                          <Input
                            id="advanceBooking"
                            type="number"
                            value={settings.advanceBookingDays}
                            onChange={(e) => handleSettingChange('advanceBookingDays', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cancellationHours">Cancellation Notice (Hours)</Label>
                          <Input
                            id="cancellationHours"
                            type="number"
                            value={settings.cancellationHours}
                            onChange={(e) => handleSettingChange('cancellationHours', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Auto-confirm Bookings</Label>
                            <p className="text-sm text-gray-600">Automatically confirm new bookings</p>
                          </div>
                          <Switch
                            checked={settings.autoConfirmBookings}
                            onCheckedChange={(checked) => handleSettingChange('autoConfirmBookings', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Require Deposit</Label>
                            <p className="text-sm text-gray-600">Require payment deposit for bookings</p>
                          </div>
                          <Switch
                            checked={settings.requireDeposit}
                            onCheckedChange={(checked) => handleSettingChange('requireDeposit', checked)}
                          />
                        </div>
                        {settings.requireDeposit && (
                          <div className="space-y-2">
                            <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
                            <Input
                              id="depositAmount"
                              type="number"
                              value={settings.depositAmount}
                              onChange={(e) => handleSettingChange('depositAmount', parseFloat(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Settings */}
                <TabsContent value="payment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Settings</CardTitle>
                      <CardDescription>Configure payment methods and tax rates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Accept Cash</Label>
                            <p className="text-sm text-gray-600">Allow cash payments at the shop</p>
                          </div>
                          <Switch
                            checked={settings.acceptCash}
                            onCheckedChange={(checked) => handleSettingChange('acceptCash', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Accept Credit/Debit Cards</Label>
                            <p className="text-sm text-gray-600">Allow card payments</p>
                          </div>
                          <Switch
                            checked={settings.acceptCard}
                            onCheckedChange={(checked) => handleSettingChange('acceptCard', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Accept Digital Payments</Label>
                            <p className="text-sm text-gray-600">Allow Apple Pay, Google Pay, etc.</p>
                          </div>
                          <Switch
                            checked={settings.acceptDigital}
                            onCheckedChange={(checked) => handleSettingChange('acceptDigital', checked)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                            <SelectItem value="PKR">PKR - Pakistani Rupee (₨)</SelectItem>
                            <SelectItem value="AED">AED - UAE Dirham (د.إ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.01"
                          value={settings.taxRate}
                          onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}