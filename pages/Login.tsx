import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, EyeOff, Eye, Check, Loader2 } from 'lucide-react';
import { authApi } from '../src/services/api';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('请输入用户名和密码');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.login(username, password);
            if (response.success) {
                navigate('/');
            } else {
                setError(response.message || '登录失败');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-hidden bg-white">
            <div className="relative h-[30vh] w-full overflow-hidden rounded-b-[3rem]">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtLtJFV3RaZ_UHTi0160PB_3UhqNdvErYuSxkPhthWGswd2PxU81QuFsBL2NfF7FSxY8gSrqPahDVXQG62Qfhdq9nn6ENO2gHasnH9i4R68VVx5SOkAwmqufG6btW6Yt3GyeaoTMfXriL2vsL-qjidB77LK6UYacrbBzc_o7zZGHYTMAJnTMN5Qmq-AHaLHudz2uitkGBUWP8gDlS-h_1jSI0tHVwSajGYYwetyqFH8T0s03dVf8ZOetf70mS_o_sF4pU4S-LcZrM" className="w-full h-full object-cover" alt="Login bg" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white"></div>
            </div>
            <div className="flex-1 flex flex-col px-8 pt-4 pb-12 z-20">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">账号密码登录</h1>
                    <p className="text-gray-500 text-sm">连接周边优质学习空间，开启专注时光</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">账号 / 手机号</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all outline-none"
                                placeholder="请输入您的账号或手机号"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">密码</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-gray-900 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all outline-none"
                                placeholder="请输入您的密码"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <a href="#" className="text-sm text-brand-green font-medium hover:underline">忘记密码？</a>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-brand-green hover:bg-forest-green text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand-green/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    登录中...
                                </>
                            ) : '登录'}
                        </button>
                    </div>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        新用户？
                        <button onClick={() => navigate('/register')} className="text-brand-green font-bold ml-1 hover:underline">立即注册</button>
                    </p>
                </div>
                <div className="mt-auto pt-10">
                    <div className="flex items-start justify-center gap-2">
                        <div className="relative flex items-center justify-center mt-0.5">
                            <input type="checkbox" defaultChecked className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-brand-green checked:bg-brand-green transition-all" />
                            <Check size={12} className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal max-w-[260px] text-center">
                            我已阅读并同意
                            <a href="#" className="text-gray-600 underline font-medium ml-1">用户协议</a>
                            与
                            <a href="#" className="text-gray-600 underline font-medium ml-1">隐私政策</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};