export const getMemberLevelName = (level: number): string => {
    switch (level) {
        case 0: return '普通会员';
        case 1: return '白银会员';
        case 2: return '黄金会员';
        case 3: return '铂金会员';
        case 4: return '钻石会员';
        default: return '普通会员';
    }
};

export const getMemberLevelColor = (level: number): string => {
    switch (level) {
        case 0: return 'from-gray-50 to-gray-100 border-gray-200 text-gray-600';
        case 1: return 'from-gray-50 to-slate-100 border-slate-200 text-slate-600';
        case 2: return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700';
        case 3: return 'from-purple-50 to-indigo-50 border-purple-200 text-purple-700';
        case 4: return 'from-blue-50 to-cyan-50 border-blue-200 text-blue-700'; // Added Diamond color
        default: return 'from-gray-50 to-gray-100 border-gray-200 text-gray-600';
    }
};
