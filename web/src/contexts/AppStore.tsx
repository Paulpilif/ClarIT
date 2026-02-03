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

type StoredGraphNode = {
  id: string;
  [key: string]: unknown;
};

type StoredGraphLink = {
  source: string;
  target: string;
  type?: string;
  [key: string]: unknown;
};

export type StoredNetworkGraph = {
  nodes: StoredGraphNode[];
  links?: StoredGraphLink[];
};

interface AppStoreType {
  auth_status: boolean;
  subscription_tier: SubscriptionTier;
  is_subscription_loading: boolean;
  scan_data_status: ScanDataStatus;
  last_scan_target: string | null;
  last_scan_graph: StoredNetworkGraph | null;
  is_scanning: boolean;
  scan_target_prompt_requested: boolean;
  login: () => void;
  logout: () => void;
  set_subscription_tier: (tier: SubscriptionTier) => void;
  set_scan_data_status: (status: ScanDataStatus) => void;
  set_last_scan_target: (target: string | null) => void;
  set_last_scan_graph: (graph: StoredNetworkGraph | null) => void;
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
  const [last_scan_graph, setLastScanGraph] =
    useState<StoredNetworkGraph | null>(null);
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
  }, [persistAuth, setLastScanGraph]);

  const logout = useCallback(() => {
    persistAuth(false);
    localStorage.removeItem("api_token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("subscription_tier");
    setSubscriptionTier("eclaireur");
    setScanDataStatus("none");
    setScanTargetPromptRequested(false);
    setLastScanGraph(null);
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

  const set_last_scan_graph = useCallback(
    (graph: StoredNetworkGraph | null) => {
      setLastScanGraph(graph);
    },
    [],
  );

  const set_scan_target_prompt_requested = useCallback((value: boolean) => {
    setScanTargetPromptRequested(value);
  }, []);

  const parseTargets = (rawTarget?: string | null) =>
    (rawTarget ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  const mergeGraphs = (graphs: StoredNetworkGraph[]): StoredNetworkGraph => {
    const nodeMap = new Map<string, StoredGraphNode>();
    const links: StoredGraphLink[] = [];
    const linkKeys = new Set<string>();

    graphs.forEach((graph) => {
      graph.nodes?.forEach((node) => {
        const existing = nodeMap.get(node.id) ?? {};
        nodeMap.set(node.id, { ...existing, ...node });
      });
      graph.links?.forEach((link) => {
        const key = `${link.source}|${link.target}|${String(link.type ?? "")}`;
        if (linkKeys.has(key)) return;
        linkKeys.add(key);
        links.push(link);
      });
    });

    return { nodes: Array.from(nodeMap.values()), links };
  };

  const launch_scan = useCallback(
    async (target?: string) => {
      const resolvedTargets = parseTargets(target ?? last_scan_target);
      if (resolvedTargets.length === 0) {
        setScanTargetPromptRequested(true);
        return "missing-target";
      }

      try {
        setIsScanning(true);
        const companyName = localStorage.getItem("currentUser") || undefined;
        const apiToken = localStorage.getItem("api_token") || undefined;
        const isBatch = resolvedTargets.length > 1;
        const response = await fetch(
          isBatch
            ? "http://localhost:8090/scan-batch"
            : "http://localhost:8090/scan",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              isBatch
                ? {
                    cidrs: resolvedTargets,
                    save: true,
                    company: companyName,
                    api_token: apiToken,
                  }
                : {
                    cidr: resolvedTargets[0],
                    save: true,
                    company: companyName,
                    api_token: apiToken,
                  },
            ),
          },
        );

        if (!response.ok) {
          throw new Error("Scan failed");
        }

        const responseJson = (await response.json()) as
          | { graph?: StoredNetworkGraph }
          | { items?: Array<{ graph?: StoredNetworkGraph; error?: string }> };

        if (isBatch && "items" in responseJson) {
          const graphs = (responseJson.items ?? [])
            .map((item) => item.graph)
            .filter(Boolean) as StoredNetworkGraph[];
          set_last_scan_graph(graphs.length > 0 ? mergeGraphs(graphs) : null);
        } else if (!isBatch && "graph" in responseJson) {
          set_last_scan_graph(responseJson.graph ?? null);
        } else {
          set_last_scan_graph(null);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        set_scan_data_status("valid");
        set_last_scan_target(resolvedTargets.join(", "));
        return "success";
      } catch (error) {
        console.error("Scan error:", error);
        return "error";
      } finally {
        setIsScanning(false);
      }
    },
    [
      last_scan_target,
      set_last_scan_target,
      set_last_scan_graph,
      set_scan_data_status,
    ],
  );

  const value = useMemo(
    () => ({
      auth_status,
      subscription_tier,
      is_subscription_loading,
      scan_data_status,
      last_scan_target,
      last_scan_graph,
      is_scanning,
      scan_target_prompt_requested,
      login,
      logout,
      set_subscription_tier,
      set_scan_data_status,
      set_last_scan_target,
      set_last_scan_graph,
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
      last_scan_graph,
      is_scanning,
      scan_target_prompt_requested,
      login,
      logout,
      set_subscription_tier,
      set_scan_data_status,
      set_last_scan_target,
      set_last_scan_graph,
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
