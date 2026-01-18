import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, shopsApi, Shop } from '../../src/services/api';
import { Lock, User, AlertCircle, Store } from 'lucide-react';

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shopId, setShopId] = useState('');
    const [shops, setShops] = useState<Shop[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await shopsApi.getShops();
                if (res.success) {
                    setShops(res.shops);
                    // Default to first shop or empty?
                    // Usually handy to default to one.
                    if (res.shops.length > 0) {
                        setShopId(res.shops[0].id);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch shops", e);
            }
        };
        fetchShops();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use adminLogin which stores to admin_token/admin_user (separate from APP)
            const res = await authApi.adminLogin(username, password, shopId);
            if (res.success && res.user) {
                if (res.user.role === 1) {
                    navigate('/admin');
                } else {
                    setError('该账号没有管理员权限');
                    authApi.adminLogout(); // Clear invalid admin session
                }
            } else {
                setError(res.message || '登录失败');
            }
        } catch (err) {
            setError('登录发生错误，请重试');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-[#3E6950] p-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">StudySpace 管理后台</h1>
                    <p className="text-white/80 text-sm">请登录以继续</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">登录门店</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <select
                                    value={shopId}
                                    onChange={(e) => setShopId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E6950] focus:border-[#3E6950] outline-none transition-all appearance-none bg-white"
                                    required
                                >
                                    <option value="">请选择门店 (总部/平台管理员可不选)</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E6950] focus:border-[#3E6950] outline-none transition-all"
                                    placeholder="请输入管理员账号"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E6950] focus:border-[#3E6950] outline-none transition-all"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3E6950] text-white py-3 rounded-lg font-bold hover:bg-[#2c4a38] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#3E6950]/20"
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
