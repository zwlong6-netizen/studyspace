import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { MapExplore } from './pages/MapExplore';
import { StoreDetail } from './pages/StoreDetail';
import { SeatSelection } from './pages/SeatSelection';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Profile } from './pages/Profile';
import { StatsReport } from './pages/StatsReport';
import { OrderList } from './pages/OrderList';
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
        <Route path="/ticket/:id" element={<TicketDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<StatsReport />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;
