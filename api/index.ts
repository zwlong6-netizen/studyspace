export default async (req: any, res: any) => {
    // 1. 调试环境变量 (这能直接告诉我们是不是变量没配对)
    const missingVars = [];
    if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
    if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

    if (missingVars.length > 0) {
        return res.status(500).json({
            success: false,
            message: 'Server Environment Variables Missing',
            missing: missingVars,
            hint: 'Please configure these in Vercel Project Settings'
        });
    }

    try {
        // 2. 动态导入后端 App
        // 注意：这里尝试捕获模块加载错误 (比如 .js 扩展名问题)
        const mod = await import('../backend/src/index.js');
        const app = mod.default;

        // 3. 执行 App
        app(req, res);
    } catch (error: any) {
        console.error('Failed to load backend:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load backend application',
            error: error.message,
            stack: error.stack
        });
    }
};
