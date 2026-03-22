import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function requirePremium(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (user.subscriptionTier !== "premium") {
    res.status(402).json({
      error: "Premium subscription required",
      upgradeUrl: "/payments",
    });
    return;
  }

  // Double-check expiry as safety net (webhooks handle this normally)
  if (user.subscriptionExpiresAt) {
    const expiresAt = new Date(user.subscriptionExpiresAt);
    if (expiresAt < new Date()) {
      res.status(402).json({
        error: "Subscription expired",
        upgradeUrl: "/payments",
      });
      return;
    }
  }

  next();
}
