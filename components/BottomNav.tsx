import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Receipt, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/') ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">首页</span>
        </button>
        <button
          onClick={() => navigate('/orders')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/orders') ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Receipt size={24} strokeWidth={isActive('/orders') ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">订单</span>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/profile') ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">我的</span>
        </button>
      </div>
    </div>
  );
};