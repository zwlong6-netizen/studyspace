import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Edit2, Medal, Clock, Flame, Brain, Wallet, Ticket, BarChart4, Settings, ChevronRight, Share2, LogOut, Loader2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { authApi, User } from '../src/services/api';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            // 先尝试从本地获取
            const localUser = authApi.getLocalUser();
            if (localUser) {
                setUser(localUser);
            }

            // 如果已登录，从 API 获取最新数据
            if (authApi.isLoggedIn()) {
                try {
                    const response = await authApi.getProfile();
                    if (response.success && response.user) {
                        setUser(response.user);
                    }
                } catch (error) {
                    console.log('Failed to fetch profile:', error);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        authApi.logout();
        navigate('/login');
    };

    const getMemberLevelLabel = (level: string): string => {
        const labels: Record<string, string> = {
            'normal': '普通会员',
            'silver': '白银会员',
            'gold': '黄金会员',
            'platinum': '铂金会员'
        };
        return labels[level] || '普通会员';
    };

    const getMemberLevelColor = (level: string): string => {
        const colors: Record<string, string> = {
            'normal': 'from-gray-50 to-gray-100 border-gray-200 text-gray-600',
            'silver': 'from-gray-50 to-slate-100 border-slate-200 text-slate-600',
            'gold': 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700',
            'platinum': 'from-purple-50 to-indigo-50 border-purple-200 text-purple-700'
        };
        return colors[level] || colors['normal'];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
        );
    }

    // 使用用户数据或默认值
    const displayUser = user || {
        username: 'Alex Chen',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAduKN1Wg2-1UPBiruSzBpyKAyB783gEY_UcNHF8wVF1C0VUW_gEgGDXMJ4kJ-dltSsYQ3UYAyfdiLHR1_OETYsc0X7ppQueEi1UqGML_S8kn5Mix0dJGDGooSN7NnoO8Sjk5hl4DNEJP2TngB-Rnqoh8u2rrrYfcJ-IkhoKdaELlGYHgm6trb5mcpL-kKm4oNTIIS3c4GyJcD-VPDCERArZoGkc5w2-OdErE_4pHiYUACFV4TR62WTBoeY1LeMW4Svcg_1_N1rLsg',
        member_level: 'gold',
        total_hours: 32.5,
        consecutive_days: 12,
        focus_points: 850,
        balance: 12.00
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light pb-24 max-w-md mx-auto">
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center px-4 py-3 justify-between">
                    <div className="w-10"></div>
                    <h2 className="text-primary text-lg font-bold leading-tight flex-1 text-center">个人中心</h2>
                    <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors relative">
                        <Bell size={24} className="text-primary fill-current" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>
            </div>

            <div className="px-4 pt-6 pb-2">
                <div className="bg-white rounded-2xl p-6 shadow-soft flex flex-col items-center gap-4 relative overflow-hidden">
                    {/* Abstract background blobs */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

                    <div className="relative">
                        <div className="w-24 h-24 rounded-full ring-4 ring-primary/5 shadow-sm overflow-hidden">
                            <img src={displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm">
                            <div className="bg-primary h-6 w-6 rounded-full flex items-center justify-center text-white">
                                <Edit2 size={12} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center z-10">
                        <h3 className="text-black text-xl font-bold leading-tight mb-1">{displayUser.username}</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${getMemberLevelColor(displayUser.member_level)} border rounded-full`}>
                            <Medal size={16} />
                            <span className="text-xs font-semibold tracking-wide">{getMemberLevelLabel(displayUser.member_level)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 py-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {[
                        { icon: Clock, val: displayUser.total_hours?.toFixed(1) || '0', unit: 'h', label: '累计时长', color: 'text-primary', bg: 'bg-primary/10' },
                        { icon: Flame, val: displayUser.consecutive_days?.toString() || '0', unit: '天', label: '连续天数', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { icon: Brain, val: displayUser.focus_points?.toString() || '0', unit: '', label: '专注积分', color: 'text-blue-500', bg: 'bg-blue-500/10' }
                    ].map((stat, idx) => (
                        <div key={idx} className="flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1 rounded-2xl p-4 bg-white shadow-sm border border-gray-100">
                            <div className={`h-10 w-10 rounded-full ${stat.bg} flex items-center justify-center mb-1 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-black text-xl font-bold leading-tight">
                                {stat.val}<span className="text-sm font-normal text-gray-500 ml-0.5">{stat.unit}</span>
                            </p>
                            <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu */}
            <div className="px-4 py-2">
                <div className="flex flex-col gap-3">
                    {[
                        { icon: Wallet, label: '我的钱包', extra: <span className="text-xs text-gray-500">余额: ¥{displayUser.balance?.toFixed(2) || '0.00'}</span> },
                        { icon: Ticket, label: '优惠券', extra: <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">2张可用</span> },
                        { icon: BarChart4, label: '学习周报', extra: null, onClick: () => navigate('/stats') },
                        { icon: Settings, label: '设置', extra: null },
                        { icon: LogOut, label: '退出登录', extra: null, onClick: handleLogout }
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={item.onClick}
                            className="w-full group flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/20 transition-all active:scale-[0.99]"
                        >
                            <div className="flex items-center justify-center rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0 size-10 text-primary">
                                <item.icon size={20} />
                            </div>
                            <p className="text-primary text-base font-medium leading-normal flex-1 text-left">{item.label}</p>
                            {item.extra}
                            <div className="shrink-0 text-gray-400">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Invite Banner */}
            <div className="px-4 py-4">
                <div className="relative w-full h-24 rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-forest-green to-[#2e7d32]"></div>
                    <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBW6iDV3ZjkToFcnSkm-cyF2Fx9b5cJnX6eLXRi1hQZEtqBiTLdpSve95kC9Hgkt3qABQsm7hb3D4Xoostbmj7ZQlqFcNhg65KrEUot2oBHQ8eGKFxV4OUcyH1v9PFkGsShQhcQWP7xGmEQv22idBwSNrRVSL6bct5SblMK8D0kNFTF67_YZWnNHljkYayARbkB60UIuf7faFUvR8TBhvFr5xpiu49DiwQ3NnhAenLw-tH0C59Njev0rNR6mTS3m0ielAbxbAvKh8M")' }}></div>
                    <div className="relative h-full flex items-center justify-between px-6">
                        <div>
                            <h4 className="text-white font-bold text-lg tracking-wide">邀请好友加入</h4>
                            <p className="text-white text-sm opacity-90">双方各得 50 专注积分</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <Share2 className="text-white" size={20} />
                        </div>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};