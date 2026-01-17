import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Smartphone, EyeOff, Eye, Lock, Loader2 } from 'lucide-react';
import { authApi } from '../src/services/api';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        // 验证
        if (!username) {
            setError('请输入用户名');
            return;
        }
        if (password.length < 6) {
            setError('密码长度至少为6位');
            return;
        }
        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        if (!agreed) {
            setError('请先同意用户协议和隐私政策');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.register(username, password, phone || undefined);
            if (response.success) {
                navigate('/');
            } else {
                setError(response.message || '注册失败');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white text-gray-900 min-h-screen max-w-md mx-auto">
            <div className="flex items-center p-4 pb-2 justify-between">
                <button onClick={() => navigate(-1)} className="text-gray-900 flex size-12 shrink-0 items-center justify-start cursor-pointer">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">用户注册</h2>
            </div>
            <div className="px-6 pt-8 pb-4">
                <h1 className="text-gray-900 tracking-tight text-[32px] font-bold leading-tight text-left">创建账号</h1>
                <p className="text-gray-500 text-sm mt-2">加入高效自习社区，开启你的专注之旅</p>
            </div>

            {error && (
                <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-end gap-4 px-6 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-gray-800 text-base font-medium leading-normal pb-2">用户名</p>
                        <div className="flex w-full flex-1 items-stretch rounded-lg">
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-1 focus:ring-brand-green border border-gray-200 bg-white focus:border-brand-green h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                placeholder="请输入用户名"
                                type="text"
                            />
                            <div className="text-gray-400 flex border border-gray-200 bg-white items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                                <User size={20} />
                            </div>
                        </div>
                    </label>
                </div>
                <div className="flex flex-wrap items-end gap-4 px-6 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-gray-800 text-base font-medium leading-normal pb-2">手机号 (选填)</p>
                        <div className="flex w-full flex-1 items-stretch rounded-lg">
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-1 focus:ring-brand-green border border-gray-200 bg-white focus:border-brand-green h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                placeholder="请输入11位手机号"
                                type="tel"
                            />
                            <div className="text-gray-400 flex border border-gray-200 bg-white items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                                <Smartphone size={20} />
                            </div>
                        </div>
                    </label>
                </div>
                <div className="flex flex-wrap items-end gap-4 px-6 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-gray-800 text-base font-medium leading-normal pb-2">设置密码</p>
                        <div className="flex w-full flex-1 items-stretch rounded-lg">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-1 focus:ring-brand-green border border-gray-200 bg-white focus:border-brand-green h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                placeholder="请设置6位以上密码"
                                type={showPassword ? 'text' : 'password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 flex border border-gray-200 bg-white items-center justify-center pr-[15px] rounded-r-lg border-l-0"
                            >
                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                    </label>
                </div>
                <div className="flex flex-wrap items-end gap-4 px-6 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-gray-800 text-base font-medium leading-normal pb-2">确认密码</p>
                        <div className="flex w-full flex-1 items-stretch rounded-lg">
                            <input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-1 focus:ring-brand-green border border-gray-200 bg-white focus:border-brand-green h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                placeholder="请再次输入密码"
                                type={showConfirmPassword ? 'text' : 'password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-400 flex border border-gray-200 bg-white items-center justify-center pr-[15px] rounded-r-lg border-l-0"
                            >
                                {showConfirmPassword ? <Eye size={20} /> : <Lock size={20} />}
                            </button>
                        </div>
                    </label>
                </div>
            </div>
            <div className="px-6 py-4 flex items-start gap-3">
                <div className="flex items-center h-6">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 bg-white text-brand-green focus:ring-brand-green"
                    />
                </div>
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    我已阅读并同意 <span className="text-brand-green font-bold underline underline-offset-4">《用户协议》</span> 与 <span className="text-brand-green font-bold underline underline-offset-4">《隐私政策》</span>
                </label>
            </div>
            <div className="px-6 py-6 mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-brand-green hover:bg-[#1a3d2c] text-white text-lg font-bold py-4 rounded-xl transition-colors shadow-lg shadow-black/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            注册中...
                        </>
                    ) : '立即注册'}
                </button>
            </div>
            <div className="pb-10 text-center">
                <p className="text-gray-600 text-sm">
                    已有账号？ <button onClick={() => navigate('/login')} className="text-brand-green font-bold ml-1 hover:underline">立即登录</button>
                </p>
            </div>
        </div>
    );
};