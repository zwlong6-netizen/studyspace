import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './src/layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminShops } from './pages/admin/AdminShops';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminSeats } from './pages/admin/AdminSeats';
import { AdminLogin } from './pages/admin/AdminLogin';
import { Home } from './pages/Home';
import { MapExplore } from './pages/MapExplore';
import { StoreDetail } from './pages/StoreDetail';
import { SeatSelection } from './pages/SeatSelection';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Profile } from './pages/Profile';
import { StatsReport } from './pages/StatsReport';
import { OrderList } from './pages/OrderList';
import { Notifications } from './pages/Notifications';
import { ZoneList } from './pages/ZoneList';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TicketDetail } from './pages/TicketDetail';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapExplore />} />
        <Route path="/store/:id" element={<StoreDetail />} />
        <Route path="/select-seat" element={<SeatSelection />} />
        <Route path="/confirm-order" element={<OrderConfirmation />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/zones" element={<ZoneList />} />
        <Route path="/ticket/:id" element={<TicketDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<StatsReport />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes - Desktop Only */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="seats" element={<AdminSeats />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
