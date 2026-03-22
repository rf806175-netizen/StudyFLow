import { useState } from "react";
import { useAuthStore } from "../store/auth";

type GateType = "login" | "pricing";

export function useActionGate() {
  const { user, consumeFreeAction, freeActions } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingFeature, setPricingFeature] = useState<string | undefined>();

  // Gate for actions that require login first, then freemium check
  const gateAction = (
    freeActionKey: "organize" | "search",
    callback: () => void,
    featureName?: string
  ) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const allowed = consumeFreeAction(freeActionKey);
    if (allowed) {
      callback();
    } else {
      setPricingFeature(featureName);
      setShowPricing(true);
    }
  };

  // Gate for actions that only require login (no freemium limit)
  const requireLogin = (callback: () => void) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    callback();
  };

  // Check if a free action is still available (without consuming)
  const hasFreeAction = (key: "organize" | "search") => freeActions[key] === 0;

  return {
    showLogin,
    showPricing,
    pricingFeature,
    setShowLogin,
    setShowPricing,
    gateAction,
    requireLogin,
    hasFreeAction,
  };
}
