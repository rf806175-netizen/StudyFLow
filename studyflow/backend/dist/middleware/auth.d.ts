import { Request, Response, NextFunction } from "express";
import { schema } from "../db";
export interface AuthRequest extends Request {
    userId?: number;
    user?: typeof schema.users.$inferSelect;
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map