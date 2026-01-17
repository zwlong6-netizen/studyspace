import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'studyspace-secret-key';

/**
 * 认证中间件 - 验证 JWT Token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: '未提供认证令牌' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: '无效的认证令牌' });
        return;
    }
};

/**
 * 可选认证中间件 - 如果有 token 则解析，没有也放行
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            req.user = decoded;
        } catch {
            // Token 无效但不阻止请求
        }
    }

    next();
};

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export default authMiddleware;
