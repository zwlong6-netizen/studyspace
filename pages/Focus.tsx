import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, RotateCcw, Timer, Hourglass, Check, X } from 'lucide-react';

type TimerMode = 'stopwatch' | 'countdown';

export const Focus: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<TimerMode>('stopwatch');

    // Stopwatch state
    const [swTime, setSwTime] = useState(0);
    const [isSwRunning, setIsSwRunning] = useState(false);

    // Countdown state
    const [cdTime, setCdTime] = useState(45 * 60); // Default 45 min
    const [cdDuration, setCdDuration] = useState(45 * 60);
    const [isCdRunning, setIsCdRunning] = useState(false);

    // Gesture state
    const touchStartY = useRef<number | null>(null);

    // Stopwatch Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSwRunning) {
            interval = setInterval(() => {
                setSwTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSwRunning]);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextUnlocked = useRef(false);
    const [isComplete, setIsComplete] = useState(false);

    // Initialize Audio
    useEffect(() => {
        try {
            const audio = new Audio('/djs.mp3');
            audio.loop = true;
            audio.preload = 'auto'; // Preload
            audioRef.current = audio;
        } catch (e) {
            console.error("Audio init failed", e);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Unlock Audio for Mobile (Warmup)
    const unlockAudio = () => {
        if (audioContextUnlocked.current || !audioRef.current) return;

        // Play silent brief note to unlock
        audioRef.current.volume = 0;
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Unlocked
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        audioRef.current.volume = 1; // Restore volume
                        audioContextUnlocked.current = true;
                    }
                })
                .catch(error => {
                    console.error("Audio unlock failed", error);
                });
        }
    };

    // Alarm Sound Logic
    const playAlarm = () => {
        if (!audioRef.current) return;

        // Ensure volume is up
        audioRef.current.volume = 1;
        audioRef.current.currentTime = 0;

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error("Audio playback failed (Autoplay blocked?)", e);
                // Fallback: alert? or just silent
            });
        }
    };

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // Countdown Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCdRunning && cdTime > 0) {
            interval = setInterval(() => {
                setCdTime((prev) => {
                    if (prev <= 1) {
                        setIsCdRunning(false);
                        setIsComplete(true);
                        playAlarm(); // Trigger alarm
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (cdTime === 0 && !isComplete && isCdRunning) { // Ensure completion state
            setIsCdRunning(false);
            setIsComplete(true);
            playAlarm();
        }
        return () => clearInterval(interval);
    }, [isCdRunning, cdTime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopAlarm();
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSwReset = () => {
        setIsSwRunning(false);
        setSwTime(0);
    };

    const handleCdReset = () => {
        setIsCdRunning(false);
        setCdTime(cdDuration);
    };

    const handleStop = () => {
        stopAlarm();
        setIsComplete(false);
        handleCdReset();
    };

    const handleRestart = () => {
        stopAlarm();
        setIsComplete(false);
        setCdTime(cdDuration);
        setIsCdRunning(true);
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-brand-green relative overflow-hidden text-white transition-colors duration-500 overscroll-none touch-none">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Mode Switcher */}
                <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-sm">
                    <button
                        onClick={() => setMode('stopwatch')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'stopwatch' ? 'bg-white text-brand-green shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <Timer size={14} /> 正计时
                    </button>
                    <button
                        onClick={() => setMode('countdown')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'countdown' ? 'bg-white text-brand-green shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <Hourglass size={14} /> 倒计时
                    </button>
                </div>

                <div className="w-10"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">

                {/* Timer Display */}
                <div className="mb-16 text-center px-4 w-full flex items-center justify-center gap-2 sm:gap-4">
                    {/* Display Component Helper */}
                    {(() => {
                        const seconds = mode === 'stopwatch' ? swTime : cdTime;
                        const h = Math.floor(seconds / 3600);
                        const m = Math.floor((seconds % 3600) / 60);
                        const s = seconds % 60;

                        const renderUnit = (value: number, unit: 'h' | 'm' | 's', label: string) => {
                            // Logic to handle adjustment
                            const handleAdjust = (delta: number) => {
                                if (mode === 'stopwatch' || isCdRunning) return;
                                let mult = 1;
                                if (unit === 'h') mult = 3600;
                                if (unit === 'm') mult = 60;
                                // My adjustTime took minutes. I should update adjustTime to take Seconds or just handle it here.
                            };

                            // Actually, let's redefine adjustTime to be more flexible or use a new handler
                            // Define handler inline for simplicity or reuse logic

                            const onWheel = (e: React.WheelEvent) => {
                                if (mode === 'stopwatch' || isCdRunning) return;
                                const delta = e.deltaY < 0 ? 1 : -1;
                                // Adjust based on unit
                                let secondsDelta = delta;
                                if (unit === 'h') secondsDelta = delta * 3600;
                                if (unit === 'm') secondsDelta = delta * 60;

                                setCdDuration(prev => {
                                    const newVal = Math.max(0, prev + secondsDelta);
                                    setCdTime(newVal);
                                    return newVal;
                                });
                            };

                            const onTouchStart = (e: React.TouchEvent) => {
                                if (mode === 'stopwatch' || isCdRunning) return;
                                touchStartY.current = e.touches[0].clientY;
                            };

                            const onTouchMove = (e: React.TouchEvent) => {
                                if (mode === 'stopwatch' || isCdRunning || touchStartY.current === null) return;
                                const currentY = e.touches[0].clientY;
                                const diff = touchStartY.current - currentY;
                                if (Math.abs(diff) > 20) {
                                    const delta = diff > 0 ? 1 : -1;
                                    let secondsDelta = delta;
                                    if (unit === 'h') secondsDelta = delta * 3600;
                                    if (unit === 'm') secondsDelta = delta * 60;

                                    setCdDuration(prev => {
                                        const newVal = Math.max(0, prev + secondsDelta);
                                        setCdTime(newVal);
                                        return newVal;
                                    });
                                    touchStartY.current = currentY;
                                }
                            };

                            const onTouchEnd = () => { touchStartY.current = null; };

                            return (
                                <div
                                    className={`flex flex-col items-center group relative select-none
                                ${mode === 'countdown' && !isCdRunning ? 'cursor-ns-resize active:scale-105 transition-transform' : ''}
                            `}
                                    onWheel={onWheel}
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                >
                                    <div className="text-6xl md:text-8xl font-bold font-mono tracking-wider tabular-nums">
                                        {value.toString().padStart(2, '0')}
                                    </div>
                                    {/* Optional Label if needed, user said minimal, so maybe none or very subtle */}
                                </div>
                            );
                        };

                        return (
                            <>
                                {renderUnit(h, 'h', '')}
                                <span className="text-4xl md:text-6xl font-bold text-white/50 -mt-2">:</span>
                                {renderUnit(m, 'm', '')}
                                <span className="text-4xl md:text-6xl font-bold text-white/50 -mt-2">:</span>
                                {renderUnit(s, 's', '')}
                            </>
                        );
                    })()}
                </div>

                <div className="mb-12 text-center h-7"></div>

                {/* Controls */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={mode === 'stopwatch' ? handleSwReset : handleCdReset}
                        className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        title="重置"
                    >
                        <RotateCcw className="w-6 h-6 text-white" />
                    </button>

                    <button
                        onClick={() => {
                            unlockAudio();
                            if (mode === 'stopwatch') setIsSwRunning(!isSwRunning);
                            else setIsCdRunning(!isCdRunning);
                        }}
                        className="w-24 h-24 rounded-full bg-white text-brand-green flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        {(mode === 'stopwatch' ? isSwRunning : isCdRunning) ? (
                            <Pause className="w-10 h-10 fill-current" />
                        ) : (
                            <Play className="w-10 h-10 fill-current ml-1" />
                        )}
                    </button>

                    <div className="w-16"></div>
                </div>
            </div>

            {isComplete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
                    <div className="w-full max-w-xs flex flex-col items-center gap-8 p-8 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-scale-in">
                        {/* Success Icon */}
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10 mb-2">
                            <Check className="w-10 h-10 text-brand-green stroke-[3]" />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <button
                                onClick={handleRestart}
                                className="w-full py-4 rounded-2xl bg-white text-brand-green text-lg font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                重新开始
                            </button>
                            <button
                                onClick={handleStop}
                                className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 text-white text-lg font-medium hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                停止
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
