import toast from 'react-hot-toast';

export const confirmToast = (message: string, onConfirm: () => void) => {
    toast((t) => (
        <div className="flex flex-col gap-3 min-w-[240px]">
            <div className="font-medium text-gray-900">{message}</div>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    取消
                </button>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        onConfirm();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                    确认
                </button>
            </div>
        </div>
    ), {
        duration: 5000,
        position: 'top-center',
        style: {
            background: '#fff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
        },
    });
};
