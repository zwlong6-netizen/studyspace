import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, TrendingUp, Grid, PieChart, VolumeX, Users } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Tooltip } from 'recharts';

export const StatsReport: React.FC = () => {
  const navigate = useNavigate();

  const weeklyData = [
    { day: '周一', hours: 4.2 },
    { day: '周二', hours: 3.1 },
    { day: '周三', hours: 2.5 },
    { day: '周四', hours: 6.2 },
    { day: '周五', hours: 2.8 },
    { day: '周六', hours: 5.5 },
    { day: '周日', hours: 4.0 },
  ];

  const pieData = [
    { name: '静音区', value: 70, color: '#118811' },
    { name: '研讨区', value: 30, color: '#dcfce7' },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-background-light pb-32 max-w-md mx-auto">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur-md shadow-sm">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="text-primary" />
        </button>
        <div className="text-center">
            <h1 className="text-lg font-bold leading-tight tracking-tight text-primary">学习周报</h1>
            <p className="text-xs font-medium text-gray-500 mt-0.5">10月23日 - 10月29日</p>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <Calendar className="text-primary" size={20} />
        </button>
      </header>

      <div className="mt-4 px-4 flex gap-4">
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm border border-white/50">
            <div className="flex items-start justify-between">
                <div className="text-primary bg-primary/5 p-2 rounded-lg"><Clock size={20} /></div>
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-primary">18.5<span className="text-sm font-medium text-gray-500 ml-1">h</span></p>
                <p className="text-sm font-medium text-gray-500 mt-1">本周累计</p>
            </div>
        </div>
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm border border-white/50">
            <div className="flex items-start justify-between">
                 <div className="text-primary bg-primary/5 p-2 rounded-lg"><TrendingUp size={20} /></div>
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-primary">82<span className="text-sm font-medium text-gray-500 ml-1">%</span></p>
                <p className="text-sm font-medium text-gray-500 mt-1">超过用户</p>
            </div>
        </div>
      </div>

      <section className="mt-6 px-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-white/50">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-primary">本周学习时长</h3>
                    <p className="text-sm text-gray-500 mt-1">平均每日 2.6 小时</p>
                </div>
                <button className="text-primary text-sm font-bold px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors">详情</button>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                        <Bar dataKey="hours" radius={[4, 4, 4, 4]}>
                            {weeklyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.day === '周四' ? '#1A1A1A' : '#e5e7eb'} />
                            ))}
                        </Bar>
                         <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-2 px-1">
                 {weeklyData.map((d, i) => (
                    <span key={i} className={`text-xs font-bold ${d.day === '周四' ? 'text-primary' : 'text-gray-400'}`}>{d.day}</span>
                 ))}
            </div>
        </div>
      </section>

      <section className="mt-6 px-4">
         <div className="rounded-2xl bg-white p-6 shadow-sm border border-white/50">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-primary">专注频率</h3>
                    <p className="text-sm text-gray-500 mt-1">过去30天热力图</p>
                </div>
                <Grid className="text-primary/40" />
            </div>
            <div className="grid grid-cols-7 gap-2">
                 {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-sm ${Math.random() > 0.7 ? 'bg-primary' : Math.random() > 0.4 ? 'bg-primary/40' : 'bg-gray-100'}`}></div>
                 ))}
            </div>
             <div className="mt-5 flex items-center justify-end gap-2 text-xs font-medium text-gray-500">
                <span>少</span>
                <div className="h-3 w-3 rounded-sm bg-gray-100"></div>
                <div className="h-3 w-3 rounded-sm bg-primary/40"></div>
                <div className="h-3 w-3 rounded-sm bg-primary"></div>
                <span>多</span>
            </div>
         </div>
      </section>

      <section className="mt-6 px-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-white/50">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-primary">学习偏好</h3>
                <PieChart className="text-primary/40" />
            </div>
            <div className="flex flex-col items-center gap-8 py-2">
                <div className="relative h-48 w-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 m-auto h-32 w-32 rounded-full flex items-center justify-center">
                        <div className="text-center">
                            <span className="block text-4xl font-bold text-primary tracking-tighter">70<span className="text-lg">%</span></span>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest mt-1">静音区</span>
                        </div>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-3">
                     <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-transparent">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <VolumeX size={20} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold">静音区</span>
                                <span className="block text-xs text-gray-500">深度专注，无打扰</span>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-primary">13h</span>
                     </div>
                     <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-transparent">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dcfce7] text-primary/80">
                                <Users size={20} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold">研讨区</span>
                                <span className="block text-xs text-gray-500">小组讨论，头脑风暴</span>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-primary">5.5h</span>
                     </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};
