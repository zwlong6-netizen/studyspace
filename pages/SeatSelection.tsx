import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, SlidersHorizontal, User, Check, Zap, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Seat, SeatStatus } from '../types';
import { seatsApi, shopsApi, Seat as ApiSeat, Schedule } from '../src/services/api';

export const SeatSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { storeName?: string; storeId?: string; zoneName?: string; price?: number } | null;
  const storeName = state?.storeName || '静音区 A';
  const storeId = state?.storeId || '';
  const zoneName = state?.zoneName;
  const pricePerHour = state?.price || 5;

  const backPath = storeId ? `/store/${storeId}` : '/store/default';

  const [selectedSeat, setSelectedSeat] = useState<string>('A4');
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [apiSeats, setApiSeats] = useState<ApiSeat[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({});

  // Interactive time selection state
  const [startTime, setStartTime] = useState<number>(13);
  const [endTime, setEndTime] = useState<number>(16);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);

  // Helper to get minimum selectable time
  const getMinSelectableTime = () => {
    if (selectedDateIndex === 0) {
      const now = new Date();
      const current = now.getHours() + now.getMinutes() / 60;
      return Math.ceil(current * 2) / 2;
    }
    return 0;
  };

  // Ensure start time is valid when date changes
  useEffect(() => {
    const min = getMinSelectableTime();
    if (startTime < min) {
      setStartTime(min);
      if (endTime <= min) {
        setEndTime(Math.min(24, min + 1));
      }
    }
  }, [selectedDateIndex]);

  // Dragging state
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // Derived duration
  const duration = Math.max(0, endTime - startTime);

  // 日期列表
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const day = date.getDate().toString();
      let label = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      if (i === 0) label = '今天';
      if (i === 1) label = '明天';
      return { label, day, fullDate: date.toISOString().split('T')[0] };
    });
  }, []);

  // 加载座位数据
  useEffect(() => {
    const fetchSeats = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }

      try {
        const response = await shopsApi.getShopSeats(storeId, zoneName);
        if (response.success && response.seats.length > 0) {
          setApiSeats(response.seats);
          // 默认选择第一个座位
          if (response.seats.length > 0) {
            setSelectedSeat(response.seats[0].label);
            setSelectedSeatId(response.seats[0].id);
          }
        }
      } catch (error) {
        console.log('Failed to fetch seats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [storeId, zoneName]);

  // 加载座位时间表
  useEffect(() => {
    const fetchSchedules = async () => {
      if (apiSeats.length === 0) return;

      const seatIds = apiSeats.map(s => s.id);
      const targetDate = dates[selectedDateIndex]?.fullDate;

      try {
        const response = await seatsApi.getBatchSchedules(seatIds, targetDate);
        if (response.success) {
          // 转换为按座位 label 索引的格式
          const scheduleByLabel: Record<string, Schedule[]> = {};
          apiSeats.forEach(seat => {
            scheduleByLabel[seat.label] = response.schedules[seat.id] || [];
          });
          setSchedules(scheduleByLabel);
        }
      } catch (error) {
        console.log('Failed to fetch schedules:', error);
        // 使用默认的 mock schedules
        setSchedules(getMockSchedules());
      }
    };

    fetchSchedules();
  }, [apiSeats, selectedDateIndex, dates]);

  // Mock Schedules (当 API 不可用时的后备数据)
  const getMockSchedules = (): Record<string, Schedule[]> => {
    if (selectedDateIndex === 0) {
      return {
        'A1': [{ start: 9, end: 11.5 }, { start: 13, end: 15 }],
        'A2': [{ start: 10, end: 12 }],
        'A3': [],
        'A4': [{ start: 9, end: 11.5 }, { start: 19, end: 22 }],
        'B1': [{ start: 14, end: 18 }],
        'B2': [{ start: 9, end: 22 }],
        'B3': [],
        'B4': [{ start: 16, end: 18 }]
      };
    }

    const ids = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
    const nextSched: Record<string, Schedule[]> = {};

    ids.forEach((id, idx) => {
      const hash = (idx + selectedDateIndex * 3) % 5;
      if (hash === 0) nextSched[id] = [{ start: 9, end: 12 }];
      else if (hash === 1) nextSched[id] = [{ start: 14, end: 17 }];
      else if (hash === 2) nextSched[id] = [{ start: 8, end: 22 }];
      else if (hash === 3) nextSched[id] = [{ start: 10, end: 11 }, { start: 15, end: 16 }];
      else nextSched[id] = [];
    });

    return nextSched;
  };

  // 使用 API 数据或默认座位
  const seats: Seat[] = apiSeats.length > 0
    ? apiSeats.map(s => ({
      id: s.id,
      label: s.label,
      status: s.label === selectedSeat ? SeatStatus.Selected : SeatStatus.Available,
      type: s.type as 'standard' | 'window' | 'vip'
    }))
    : [
      { id: 'A1', label: 'A1', status: SeatStatus.Occupied, type: 'standard' },
      { id: 'A2', label: 'A2', status: SeatStatus.Available, type: 'standard' },
      { id: 'A3', label: 'A3', status: SeatStatus.Available, type: 'standard' },
      { id: 'A4', label: 'A4', status: SeatStatus.Selected, type: 'standard' },
      { id: 'B1', label: 'B1', status: SeatStatus.Available, type: 'standard' },
      { id: 'B2', label: 'B2', status: SeatStatus.Occupied, type: 'standard' },
      { id: 'B3', label: 'B3', status: SeatStatus.Available, type: 'standard' },
      { id: 'B4', label: 'B4', status: SeatStatus.Available, type: 'standard' },
    ];

  // 当前使用的时间表
  const currentSchedules = Object.keys(schedules).length > 0 ? schedules : getMockSchedules();

  // Get occupied slots for the currently selected seat
  const occupiedSlots = useMemo(() => {
    return currentSchedules[selectedSeat] || [];
  }, [selectedSeat, currentSchedules]);

  // Check if a seat has a conflict with the selected time range
  const isConflicted = (seatLabel: string) => {
    const seatSchedule = currentSchedules[seatLabel] || [];
    return seatSchedule.some(slot =>
      (slot.start < endTime) && (slot.end > startTime)
    );
  };

  // Format time helper (e.g. 14.5 -> 14:30)
  const formatTime = (val: number) => {
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Interaction handlers
  const handlePointerDown = (type: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(type);
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat.label);
    setSelectedSeatId(seat.id);
  };

  const handleConfirm = () => {
    const today = new Date();
    today.setDate(today.getDate() + selectedDateIndex);
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

    navigate('/confirm-order', {
      state: {
        storeName,
        storeId,
        seatId: selectedSeatId || selectedSeat,
        seatLabel: selectedSeat,
        date: dateStr,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        duration,
        price: (duration * pricePerHour).toFixed(2),
        zoneName
      }
    });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = timelineRef.current.getBoundingClientRect();
      let percentage = (clientX - rect.left) / rect.width;

      percentage = Math.max(0, Math.min(1, percentage));

      let time = percentage * 24;
      time = Math.round(time * 2) / 2;

      const minTime = getMinSelectableTime();

      if (isDragging === 'start') {
        const maxStart = endTime - 0.5;
        // Enforce minTime restriction
        setStartTime(Math.max(minTime, Math.min(time, maxStart)));
      } else {
        const minEnd = startTime + 0.5;
        setEndTime(Math.max(time, minEnd));
      }
    };

    const handleUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, startTime, endTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden font-sans">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-white shrink-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">选座</h1>
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
          <SlidersHorizontal size={20} className="text-gray-900" />
        </button>
      </header>

      {/* Date Selector */}
      <div className="shrink-0 px-4 pb-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {dates.map((d, i) => (
            <div
              key={i}
              onClick={() => setSelectedDateIndex(i)}
              className={`flex flex-col items-center justify-center h-[72px] min-w-[64px] rounded-2xl border shrink-0 cursor-pointer transition-all active:scale-95 ${selectedDateIndex === i
                ? 'bg-[#1A1A1A] text-white border-transparent shadow-md shadow-black/20'
                : 'bg-white border-gray-100 text-gray-400'
                }`}
            >
              <span className={`text-xs font-medium mb-0.5 ${selectedDateIndex === i ? 'text-white/70' : ''}`}>{d.label}</span>
              <span className="text-xl font-bold">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background-light rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">

        {/* Zone Info & Legend */}
        <div className="px-6 pt-6 pb-4 shrink-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{storeName}</h2>
            <div className="flex items-center gap-1.5 text-gray-900 text-sm font-bold">
              <Zap size={16} className="fill-current" />
              <span>充足</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-gray-200 bg-white"></div>
              <span className="text-xs font-medium text-gray-500">可选</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#1A1A1A] shadow-sm flex items-center justify-center"></div>
              <span className="text-xs font-medium text-gray-500">已选</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-red-50 border border-red-100"></div>
              <span className="text-xs font-medium text-gray-500">有人</span>
            </div>
          </div>
        </div>

        {/* Seat Map */}
        <div className="flex-1 overflow-auto relative w-full no-scrollbar px-6 pb-20">

          <div className="relative min-h-[300px]">
            {/* Window Indicator */}
            <div className="flex justify-center mb-8 mt-2">
              <div className="relative flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-bold">窗边</span>
                <div className="h-1.5 w-24 rounded-full bg-gray-200/80 shadow-inner"></div>
              </div>
            </div>

            {/* Seats Grid */}
            <div className="flex justify-between gap-8 mx-auto max-w-[300px]">
              {/* Left Group */}
              <div className="grid grid-cols-2 gap-3">
                {seats.slice(0, 4).map(seat => {
                  const conflicted = isConflicted(seat.label);
                  const isSelected = seat.label === selectedSeat;

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat)}
                      className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isSelected
                        ? 'bg-[#1A1A1A] text-white shadow-lg ring-4 ring-[#1A1A1A]/10 z-10'
                        : conflicted
                          ? 'bg-red-50 border-2 border-red-100 text-red-400'
                          : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                        }`}
                    >
                      {isSelected ? <Check size={20} strokeWidth={3} /> :
                        conflicted ? <User size={20} className="text-red-300" /> :
                          <span className="text-sm font-bold">{seat.label}</span>
                      }
                    </button>
                  );
                })}
              </div>

              {/* Right Group */}
              <div className="grid grid-cols-2 gap-3">
                {seats.slice(4, 8).map(seat => {
                  const conflicted = isConflicted(seat.label);
                  const isSelected = seat.label === selectedSeat;

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat)}
                      className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isSelected
                        ? 'bg-[#1A1A1A] text-white shadow-lg ring-4 ring-[#1A1A1A]/10 z-10'
                        : conflicted
                          ? 'bg-red-50 border-2 border-red-100 text-red-400'
                          : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                        }`}
                    >
                      {isSelected ? <Check size={20} strokeWidth={3} /> :
                        conflicted ? <User size={20} className="text-red-300" /> :
                          <span className="text-sm font-bold">{seat.label}</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mock next row for context */}
            <div className="flex justify-between gap-8 mx-auto max-w-[300px] mt-8 opacity-30 pointer-events-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center"><span className="text-sm font-bold text-gray-400">A5</span></div>
                <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center"><span className="text-sm font-bold text-gray-400">A6</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center"><span className="text-sm font-bold text-gray-400">B5</span></div>
                <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center"><span className="text-sm font-bold text-gray-400">B6</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white z-20 pb-8 pt-6 px-6 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="w-full max-w-md mx-auto">

          {/* Timeline Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-900" />
                <span className="text-sm font-bold text-gray-900">
                  {formatTime(startTime)} - {formatTime(endTime)} ({duration}h)
                </span>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="text-[10px] text-gray-400">已约</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                  <span className="text-[10px] text-gray-400">已选</span>
                </div>
              </div>
            </div>

            {/* Timeline Container */}
            <div className="relative h-14 bg-gray-50 rounded-2xl border border-gray-100 w-full flex items-center px-4 select-none touch-none">
              {/* 24h Grid Labels */}
              <div className="absolute inset-0 flex justify-between px-4 pointer-events-none z-0">
                {[0, 6, 12, 18, 24].map((h) => (
                  <div key={h} className="h-full flex flex-col justify-end pb-1.5 relative w-0 items-center">
                    <div className="absolute bottom-0 h-1.5 w-px bg-gray-300"></div>
                    <span className="absolute bottom-2.5 text-[9px] font-medium text-gray-400 font-mono transform -translate-x-1/2">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Bar Track */}
              <div ref={timelineRef} className="relative w-full h-2.5 bg-gray-200 rounded-full z-10">
                {/* Selected Segment (Base Layer) */}
                <div
                  className="absolute top-0 bottom-0 bg-gray-900 shadow-sm"
                  style={{ left: `${(startTime / 24) * 100}%`, width: `${((endTime - startTime) / 24) * 100}%` }}
                />

                {/* Occupied Segments (Top Layer - showing conflict) */}
                {occupiedSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 bg-gray-400 rounded-sm z-20 opacity-90 border-x border-white/20"
                    style={{ left: `${(slot.start / 24) * 100}%`, width: `${((slot.end - slot.start) / 24) * 100}%` }}
                  />
                ))}

                {/* Start Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[3px] border-gray-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-30 touch-none"
                  style={{ left: `${(startTime / 24) * 100}%` }}
                  onMouseDown={handlePointerDown('start')}
                  onTouchStart={handlePointerDown('start')}
                ></div>

                {/* End Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[3px] border-gray-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-30 touch-none"
                  style={{ left: `${(endTime / 24) * 100}%` }}
                  onMouseDown={handlePointerDown('end')}
                  onTouchStart={handlePointerDown('end')}
                ></div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">总计费用</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-gray-900">¥</span>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{(duration * pricePerHour).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isConflicted(selectedSeat)}
              className={`flex-1 h-14 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isConflicted(selectedSeat)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-[#1A1A1A] hover:bg-black text-white shadow-black/10'
                }`}
            >
              {isConflicted(selectedSeat) ? '时段已被占用' : '确认预约'}
              {!isConflicted(selectedSeat) && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};