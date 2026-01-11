/**
 * Main App Component
 * Modular routing with feature-based imports
 */
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

// Feature imports
import { AuthProvider } from '@/features/auth';
import { Login, Register } from '@/features/auth';
import { Landing, WorkshopDetail, Header } from '@/features/workshop';
import { MyWorkshops, UserProfile, UserLayout } from '@/features/dashboard';
import {
  AdminDashboard,
  AdminUsers,
  AdminTransactions,
  AdminSettings,
  AdminMarketing,
  AdminWorkshopStudents,
} from '@/features/admin';
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminWorkshopDetail from '@/features/admin/AdminWorkshopDetail';
import AdminWorkshops from '@/pages/AdminWorkshops';

// Route constants
import { ROUTES } from '@/constants';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes - With Header */}
            <Route element={<><Header /><Outlet /></>}>
              <Route path={ROUTES.HOME} element={<Landing />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path={ROUTES.WORKSHOP_DETAIL} element={<WorkshopDetail />} />
            </Route>

            {/* User Dashboard - With Sidebar */}
            <Route path={ROUTES.DASHBOARD} element={<UserLayout />}>
              <Route index element={<MyWorkshops />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Admin Routes - With Sidebar */}
            <Route path={ROUTES.ADMIN} element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="workshops" element={<AdminWorkshops />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="marketing" element={<AdminMarketing />} />
              <Route path="workshops/:id" element={<AdminWorkshopDetail />} />
              <Route path="workshops/:id/students" element={<AdminWorkshopStudents />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;