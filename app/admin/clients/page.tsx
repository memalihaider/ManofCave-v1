// 'use client';

// import { useState } from 'react';
// import ProtectedRoute from "@/components/ProtectedRoute";
// import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";
// import ClientsManagement from "@/components/admin/ClientsManagement";

// export default function AdminClientsPage() {
//   const { user, logout } = useAuth();
//   const router = useRouter();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const handleLogout = () => {
//     logout();
//     router.push('/login');
//   };

//   return (
//     <ProtectedRoute requiredRole="branch_admin">
//       <div className="flex h-screen bg-[#f8f9fa]">
//         {/* Sidebar */}
//         <AdminSidebar
//           role="admin"
//           onLogout={handleLogout}
//           isOpen={sidebarOpen}
//           onToggle={() => setSidebarOpen(!sidebarOpen)}
//         />

//         {/* Main Content */}
//         <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0">
//           {/* Header */}
//           <header className="bg-white border-b border-gray-200 shrink-0">
//             <div className="flex items-center justify-between px-4 py-4 lg:px-8">
//               <div className="flex items-center gap-4">
//                 <AdminMobileSidebar
//                   role="admin"
//                   onLogout={handleLogout}
//                   isOpen={sidebarOpen}
//                   onToggle={() => setSidebarOpen(!sidebarOpen)}
//                 />
//                 <div>
//                   <h1 className="text-2xl font-serif font-bold text-primary">Client Management</h1>
//                   <p className="text-sm text-muted-foreground">Manage and track all customer relationships</p>
//                 </div>
//               </div>
//             </div>
//           </header>

//           {/* Page Content */}
//           <div className="flex-1 overflow-auto p-4 lg:p-8">
//             <div className="max-w-7xl mx-auto">
//               <ClientsManagement role="admin" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// }

// new code
'use client';

import { useState } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ClientsManagement from "@/components/admin/ClientsManagement";

export default function AdminClientsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-[#f8f9fa]">
        {/* Sidebar */}
        <AdminSidebar
         
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} role={'branch_admin'}        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                 
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)} role={'branch_admin'}                />
                <div>
                  <h1 className="text-2xl font-serif font-bold text-primary">Client Management</h1>
                  <p className="text-sm text-muted-foreground">Manage and track all customer relationships</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <ClientsManagement role="admin" />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

