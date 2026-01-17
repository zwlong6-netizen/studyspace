import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingBag, LogOut, User } from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // In a real app, clear auth tokens here
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar for PC */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <Store className="text-white w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-800 tracking-tight">StudySpace 后台</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">主要功能</p>
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                        }
                    >
                        <LayoutDashboard size={18} />
                        <span className="font-medium text-[15px]">数据仪表盘</span>
                    </NavLink>

                    <NavLink
                        to="/admin/shops"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                        }
                    >
                        <Store size={18} />
                        <span className="font-medium text-[15px]">店铺管理</span>
                    </NavLink>

                    <NavLink
                        to="/admin/orders"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                        }
                    >
                        <ShoppingBag size={18} />
                        <span className="font-medium text-[15px]">订单管理</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <User size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">管理员</p>
                            <p className="text-xs text-gray-500 truncate">admin@studyspace.com</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        <span>退出登录</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800">管理控制台</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">今天是 {new Date().toLocaleDateString()}</span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
