import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingBag, LogOut, User, ChevronDown } from 'lucide-react';
import { shopsApi, Shop } from '../services/api';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [shops, setShops] = useState<Shop[]>([]);
    const [currentShopId, setCurrentShopId] = useState<string>('');
    const [isRestricted, setIsRestricted] = useState(false);

    const fetchShops = async (userShopId?: string) => {
        try {
            const res = await shopsApi.getShops();
            if (res.success && res.shops.length > 0) {
                if (userShopId) {
                    // Filter shops to only the user's shop
                    const userShop = res.shops.find(s => s.id === userShopId);
                    if (userShop) {
                        setShops([userShop]);
                        setCurrentShopId(userShop.id);
                        setIsRestricted(true);
                        return; // Done
                    }
                    // Fallback if shop not found?
                }

                setShops(res.shops);
                const storedShopId = localStorage.getItem('adminLastShopId');
                const wudaokouId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

                // Only restore from storage if not restricted (though logic above handles restricted case)
                if (storedShopId && res.shops.some(s => s.id === storedShopId)) {
                    setCurrentShopId(storedShopId);
                } else if (res.shops.some(s => s.id === wudaokouId)) {
                    setCurrentShopId(wudaokouId);
                } else {
                    setCurrentShopId(res.shops[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch shops');
        }
    };

    const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newShopId = e.target.value;
        setCurrentShopId(newShopId);
        localStorage.setItem('adminLastShopId', newShopId);
    };

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                navigate('/admin/login');
                return;
            }

            try {
                const user = JSON.parse(userStr);
                if (user.role !== 1) {
                    navigate('/admin/login');
                    return;
                }

                // Fetch shops passing user.shop_id if it exists
                fetchShops(user.shop_id);

            } catch (e) {
                navigate('/admin/login');
            }
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        navigate('/admin/login');
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

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                        }
                    >
                        <User size={18} />
                        <span className="font-medium text-[15px]">用户管理</span>
                    </NavLink>

                    <NavLink
                        to="/admin/announcements"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                        }
                    >
                        <LayoutDashboard size={18} />
                        <span className="font-medium text-[15px]">公告管理</span>
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
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">管理控制台</h2>
                        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
                        <div className="relative">
                            {isRestricted ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg">
                                    <Store size={16} className="text-[#3E6950]" />
                                    {shops.find(s => s.id === currentShopId)?.name || '未知门店'}
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={currentShopId}
                                        onChange={handleShopChange}
                                        className="appearance-none bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] cursor-pointer"
                                    >
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">今天是 {new Date().toLocaleDateString()}</span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet context={{ currentShopId }} />
                    </div>
                </main>
            </div>
        </div>
    );
};
