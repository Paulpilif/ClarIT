/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";

const GRAPH_API_BASE_URL =
  import.meta.env.VITE_GRAPH_API_URL || "http://localhost:8080/api/v1";

export type SubscriptionTier = "eclaireur" | "navigateur";
export type ScanDataStatus = "none" | "valid" | "outdated";

interface AppStoreType {
  auth_status: boolean;
  subscription_tier: SubscriptionTier;
  is_subscription_loading: boolean;
  scan_data_status: ScanDataStatus;
  last_scan_target: string | null;
  is_scanning: boolean;
  scan_target_prompt_requested: boolean;
  login: () => void;
  logout: () => void;
  set_subscription_tier: (tier: SubscriptionTier) => void;
  set_scan_data_status: (status: ScanDataStatus) => void;
  set_last_scan_target: (target: string | null) => void;
  set_scan_target_prompt_requested: (value: boolean) => void;
  refresh_subscription_tier: () => Promise<void>;
  launch_scan: (
    target?: string,
  ) => Promise<"success" | "missing-target" | "error">;
}

const AppStore = createContext<AppStoreType | undefined>(undefined);

const getInitialAuthStatus = (): boolean => {
  const saved = localStorage.getItem("auth_status");
  if (saved !== null) return saved === "true";
  const apiToken = localStorage.getItem("api_token");
  if (apiToken) return true;
  const legacy = localStorage.getItem("isAuthenticated");
  return legacy === "true";
};

const getInitialSubscriptionTier = (): SubscriptionTier => {
  const saved = localStorage.getItem("subscription_tier");
  if (saved === "eclaireur" || saved === "navigateur") return saved;
  const legacy = localStorage.getItem("tier");
  if (legacy === "scout") return "eclaireur";
  if (legacy === "navigator") return "navigateur";
  return "eclaireur";
};

const getInitialScanDataStatus = (): ScanDataStatus => {
  const saved = localStorage.getItem("scan_data_status");
  if (saved === "none" || saved === "valid" || saved === "outdated")
    return saved;
  const legacyOutdated = localStorage.getItem("requiresRescan") === "true";
  const legacyValid = localStorage.getItem("scanCompleted") === "true";
  if (legacyOutdated) return "outdated";
  if (legacyValid) return "valid";
  return "none";
};

const getInitialScanTarget = (): string | null => {
  return (
    localStorage.getItem("last_scan_target") ??
    localStorage.getItem("currentScanTarget")
  );
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [auth_status, setAuthStatus] = useState<boolean>(getInitialAuthStatus);
  const [subscription_tier, setSubscriptionTier] = useState<SubscriptionTier>(
    getInitialSubscriptionTier,
  );
  const [is_subscription_loading, setIsSubscriptionLoading] = useState(false);
  const [scan_data_status, setScanDataStatus] = useState<ScanDataStatus>(
    getInitialScanDataStatus,
  );
  const [last_scan_target, setLastScanTargetState] = useState<string | null>(
    getInitialScanTarget,
  );
  const [is_scanning, setIsScanning] = useState(false);
  const [scan_target_prompt_requested, setScanTargetPromptRequested] =
    useState(false);

  const persistAuth = useCallback((value: boolean) => {
    setAuthStatus(value);
    localStorage.setItem("auth_status", value.toString());
    localStorage.setItem("isAuthenticated", value.toString());
  }, []);

  const login = useCallback(() => {
    persistAuth(true);
  }, [persistAuth]);

  const logout = useCallback(() => {
    persistAuth(false);
    localStorage.removeItem("api_token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("subscription_tier");
    setSubscriptionTier("eclaireur");
    setScanDataStatus("none");
    setScanTargetPromptRequested(false);
  }, [persistAuth]);

  const set_subscription_tier = useCallback((tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
    localStorage.setItem("subscription_tier", tier);
  }, []);

  const refresh_subscription_tier = useCallback(async () => {
    const apiToken = localStorage.getItem("api_token");
    if (!apiToken) {
      set_subscription_tier("eclaireur");
      return;
    }

    try {
      setIsSubscriptionLoading(true);
      const response = await fetch(`${GRAPH_API_BASE_URL}/premium/status`, {
        headers: {
          "X-API-Token": apiToken,
        },
      });
      if (!response.ok) {
        throw new Error(`Premium status failed: ${response.status}`);
      }
      const data = (await response.json()) as { premium?: boolean };
      set_subscription_tier(data.premium ? "navigateur" : "eclaireur");
    } catch (error) {
      console.error("Premium status error:", error);
      set_subscription_tier("eclaireur");
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [set_subscription_tier]);

  const set_scan_data_status = useCallback((status: ScanDataStatus) => {
    setScanDataStatus(status);
    localStorage.setItem("scan_data_status", status);
  }, []);

  const set_last_scan_target = useCallback((target: string | null) => {
    setLastScanTargetState(target);
    if (target) {
      localStorage.setItem("last_scan_target", target);
    } else {
      localStorage.removeItem("last_scan_target");
    }
  }, []);

  const set_scan_target_prompt_requested = useCallback((value: boolean) => {
    setScanTargetPromptRequested(value);
  }, []);

  const launch_scan = useCallback(
    async (target?: string) => {
      const resolvedTarget = (target ?? last_scan_target)?.trim();
      if (!resolvedTarget) {
        setScanTargetPromptRequested(true);
        return "missing-target";
      }

      try {
        setIsScanning(true);
        const companyName = localStorage.getItem("currentUser") || undefined;
        const apiToken = localStorage.getItem("api_token") || undefined;
        const response = await fetch("http://localhost:8090/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cidr: resolvedTarget,
            save: true,
            company: companyName,
            api_token: apiToken,
          }),
        });

        if (!response.ok) {
          throw new Error("Scan failed");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        set_scan_data_status("valid");
        set_last_scan_target(resolvedTarget);
        return "success";
      } catch (error) {
        console.error("Scan error:", error);
        return "error";
      } finally {
        setIsScanning(false);
      }
    },
    [last_scan_target, set_last_scan_target, set_scan_data_status],
  );

  const value = useMemo(
    () => ({
      auth_status,
      subscription_tier,
      is_subscription_loading,
      scan_data_status,
      last_scan_target,
      is_scanning,
      scan_target_prompt_requested,
      login,
      logout,
      set_subscription_tier,
      set_scan_data_status,
      set_last_scan_target,
      set_scan_target_prompt_requested,
      refresh_subscription_tier,
      launch_scan,
    }),
    [
      auth_status,
      subscription_tier,
      is_subscription_loading,
      scan_data_status,
      last_scan_target,
      is_scanning,
      scan_target_prompt_requested,
      login,
      logout,
      set_subscription_tier,
      set_scan_data_status,
      set_last_scan_target,
      set_scan_target_prompt_requested,
      refresh_subscription_tier,
      launch_scan,
    ],
  );

  useEffect(() => {
    if (!auth_status) return;
    refresh_subscription_tier();
  }, [auth_status, refresh_subscription_tier]);

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}

export function useAppStore(): AppStoreType {
  const context = useContext(AppStore);
  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return context;
}
