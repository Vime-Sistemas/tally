import { useState, useEffect, Component } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import api, { setAuthToken } from "./services/api";
import { costCenterService } from "./services/costCenters";
import { Transactions } from "./pages/Transactions";
import { Accounts } from "./pages/Accounts";
import { Summary } from "./pages/Dashboard/Summary";
import { MobileSummary } from "./pages/Dashboard/Mobile/Summary";
import { Goals } from "./pages/Dashboard/Goals";
import { EquityNew } from "./pages/Equity/New";
import { EquityList } from "./pages/Equity/List";
import { Profile } from "./pages/Profile";
import HomePage from "./pages/SignUp/HomePage";
import NewFeaturesPage from "./pages/SignUp/NewFeaturesPage";
import PricingPage from "./pages/SignUp/PricingPage";
import SignUp from "./pages/SignUp";
import { Login } from "./pages/Login";
import { Releases } from "./pages/Releases";
import { BudgetsPage } from "./pages/Budgets/index";
import { Debts } from "./pages/Debts";
import { Categories } from "./pages/Params/Categories";
import { Tags } from "./pages/Params/Tags";
import { TransactionHistory } from "./components/TransactionHistory";
import { AccountsList } from "./components/AccountsList";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LoadingScreen } from "./components/LoadingScreen";
import type { Page, AppContext } from "./types/navigation";
import { UserProvider, useUser } from "./contexts/UserContext";
import { Toaster } from "./components/ui/sonner";
import { SessionExpiredDialog } from "./components/SessionExpiredDialog";
import { useIsMobile } from "./hooks/use-mobile";
import "./App.css";
import { AppBreadcrumb } from "./components/AppBreadCrumb/AppBreadcrumb";
import { PlannerClients } from "./pages/Planner/Clients";
import { PlannerDashboard } from "./pages/Planner/Dashboard";
import { InviteLandingPage } from "./pages/InviteLandingPage";
import { PlannerInvitesDialog } from "./components/PlannerInvitesDialog";
import { CashflowFuturePage } from "./pages/CashflowFuture";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { FloatingDock } from "./components/FloatingDock";
import { cn } from "@/lib/utils";

function AppContent() {
  const {
    isAuthenticated,
    isLoading,
    error,
    getAccessTokenSilently,
    user: auth0User,
  } = useAuth0();
  const navigate = useNavigate();
  const { setUser, setCostCenters, user } = useUser();

  const [currentPage, setCurrentPage] = useState<Page>("dashboard-summary");
  const [hasBusiness, setHasBusiness] = useState(false);
  const [currentContext, setCurrentContext] = useState<AppContext>("PERSONAL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && auth0User) {
        setIsSyncing(true);
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            },
          });
          setAuthToken(token);
          setIsTokenReady(true);

          const signupAccountType = localStorage.getItem("signup_account_type");
          const inviteToken = localStorage.getItem("invite_token");

          const syncData: any = {
            email: auth0User.email,
            name: auth0User.name,
          };

          if (signupAccountType) {
            syncData.type = signupAccountType;
          }

          if (inviteToken) {
            syncData.inviteToken = inviteToken;
          }

          const response = await api.post("/auth/sync", syncData);

          if (signupAccountType) {
            localStorage.removeItem("signup_account_type");
          }

          if (inviteToken) {
            localStorage.removeItem("invite_token");
          }

          // Preserve any locally-stored menuPreference (server may not persist this yet)
          let existingMenuPref: "header" | "sidebar" | undefined = undefined;
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const parsed = JSON.parse(raw);
              existingMenuPref = parsed?.menuPreference;
            }
          } catch (e) {
            // ignore
          }

          const mergedUser = {
            ...(response.data || {}),
            menuPreference: response.data?.menuPreference || existingMenuPref,
          };
          setUser(mergedUser);

          if (mergedUser.hasBusiness) {
            setHasBusiness(true);
          }

          // Load cost centers
          const costCenters = await costCenterService.getCostCenters();
          setCostCenters(costCenters);
        } catch (err) {
          console.error("Error syncing user:", err);
        } finally {
          setIsSyncing(false);
          if (
            auth0User &&
            (auth0User as any)["https://tally.app/type"] === "PLANNER"
          ) {
            setCurrentPage("planner-clients");
          } else {
            // We can also check the local user state if available, but auth0User might not have the type yet if it's not in the token.
            // However, we just synced and got the user from backend.
            // Let's rely on the response from sync if possible, but here we are in finally block.
            // Actually, we can check the user context or the response data if we lift the variable.
            // But simpler: let's check the localStorage user which we just updated.
            try {
              const localUser = JSON.parse(
                localStorage.getItem("user") || "{}",
              );
              if (localUser.type === "PLANNER") {
                setCurrentPage("planner-clients");
              } else {
                setCurrentPage("dashboard-summary");
              }
            } catch (e) {
              setCurrentPage("dashboard-summary");
            }
          }
        }
      }
    };

    if (!isLoading) {
      syncUser();
    }
  }, [
    isAuthenticated,
    isLoading,
    auth0User,
    getAccessTokenSilently,
    setUser,
    setCostCenters,
  ]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Alt + Key shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "d": // Dashboard
            e.preventDefault();
            setCurrentPage("dashboard-summary");
            break;
          case "t": // Transaction (New)
            e.preventDefault();
            setCurrentPage("transactions-new");
            break;
          case "h": // History
            e.preventDefault();
            setCurrentPage("transactions-history");
            break;
          case "c": // Contas (Accounts)
            e.preventDefault();
            setCurrentPage("accounts-list");
            break;
          case "m": // Metas (Goals)
            e.preventDefault();
            setCurrentPage("dashboard-goals");
            break;
          case "p": // Patrimônio (Equity)
            e.preventDefault();
            setCurrentPage("equity-list");
            break;
          case "b": // Budgets (Orçamentos)
            e.preventDefault();
            setCurrentPage("budgets");
            break;
          case "v": // Dívidas (Debts) - Alt+V (D reserved for Dashboard)
            e.preventDefault();
            setCurrentPage("debts");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading || isSyncing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Erro de Autenticação
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <p className="text-sm text-gray-500">
            Verifique se as conexões sociais (Google/Instagram) estão
            habilitadas no painel do Auth0.
          </p>
          <button
            onClick={() => window.location.origin}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "transactions-new":
        return <Transactions onNavigate={setCurrentPage} />;
      case "transactions-history":
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
              <TransactionHistory onNavigate={setCurrentPage} />
            </div>
          </div>
        );
      case "accounts-new":
        return <Accounts onNavigate={setCurrentPage} />;
      case "accounts-list":
        return (
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-8xl">
              <AccountsList onNavigate={setCurrentPage} />
            </div>
          </div>
        );
      case "cashflow-future":
        return <CashflowFuturePage />;
      case "equity-new":
        return <EquityNew onNavigate={setCurrentPage} />;
      case "equity-list":
        return <EquityList onNavigate={setCurrentPage} />;
      case "profile":
        return (
          <Profile hasBusiness={hasBusiness} setHasBusiness={setHasBusiness} />
        );
      case "dashboard-summary":
        return isMobile ? (
          <MobileSummary />
        ) : (
          <Summary onNavigate={setCurrentPage} />
        );
      case "dashboard-goals":
        return <Goals />;
      case "reports":
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
              <p className="text-gray-500 mt-2">Em breve</p>
            </div>
          </div>
        );
      case "budgets":
        return <BudgetsPage />;
      case "debts":
        return <Debts onNavigate={setCurrentPage} />;
      case "params-categories":
        return <Categories onNavigate={setCurrentPage} />;
      case "params-tags":
        return <Tags onNavigate={setCurrentPage} />;
      case "planner-clients":
        return <PlannerClients />;
      case "planner-dashboard":
        return <PlannerDashboard />;
      default:
        return <Transactions onNavigate={setCurrentPage} />;
    }
  };

  class ErrorBoundary extends Component<any, { error: Error | null }> {
    constructor(props: any) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    componentDidCatch(error: Error, info: any) {
      // eslint-disable-next-line no-console
      console.error("Uncaught error in page render:", error, info);
    }
    render() {
      if (this.state.error) {
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-red-600">
              Erro ao renderizar a página
            </h2>
            <pre className="mt-2 text-sm text-zinc-700">
              {String(this.state.error)}
            </pre>
          </div>
        );
      }
      // @ts-ignore
      return this.props.children;
    }
  }

  const menuPreference = (user?.menuPreference || "sidebar") as
    | "sidebar"
    | "header"
    | "dock";
  const isAuthPage = false;
  // Lógica de exibição
  const showSidebar = menuPreference === "sidebar" && !isMobile && !isAuthPage;
  const showDock = menuPreference === "dock" && !isMobile && !isAuthPage;
  const showHeader = menuPreference === "header" && !isAuthPage;

  // Main padding: when sidebar is shown we offset the content; for auth pages we want full-bleed (no horizontal padding)
  let mainPadding = "px-4 md:px-8"; // Padrão
  if (showSidebar) {
    mainPadding = sidebarCollapsed ? "pl-16" : "pl-64";
  } else if (isAuthPage) {
    mainPadding = "px-0";
  }

  const bottomPadding = showDock ? "pb-32" : "pb-24";

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {/* Opção 1: Sidebar Layout */}
      {showSidebar ? (
        <div className="flex">
          <Sidebar
            onNavigate={setCurrentPage}
            currentPage={currentPage}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className="flex-1 transition-all duration-300">
            <main className={`w-full ${bottomPadding} md:pb-0 ${mainPadding}`}>
              <ErrorBoundary>
                {!isAuthPage && (
                  <AppBreadcrumb
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                  />
                )}
                <div className="px-4 md:px-8">{renderPage()}</div>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      ) : (
        /* Opção 2 & 3: Header ou Dock Layout (Full Width) */
        <>
          {showHeader && (
            <Header
              onNavigate={setCurrentPage}
              hasBusiness={hasBusiness}
              currentContext={currentContext}
              onContextChange={setCurrentContext}
              currentPage={currentPage}
            />
          )}

          <main className={`w-full ${bottomPadding} ${mainPadding}`}>
            <ErrorBoundary>
              {!isAuthPage && !showHeader && (
                /* Se usar Dock, talvez queira um Breadcrumb flutuante ou no topo simples */
                <div className="pt-4 px-4 md:px-8 max-w-7xl mx-auto">
                  <AppBreadcrumb
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                  />
                </div>
              )}
              {/* Wrapper para centralizar conteúdo em telas muito grandes quando sem sidebar */}
              <div className={cn("mx-auto", showDock ? "max-w-7xl" : "")}>
                {renderPage()}
              </div>
            </ErrorBoundary>
          </main>

          {/* Renderiza o Dock se a preferência for essa */}
          {showDock && (
            <FloatingDock
              onNavigate={setCurrentPage}
              currentPage={currentPage}
            />
          )}
        </>
      )}

      {/* ... Dialogs e Analytics ... */}
      <SessionExpiredDialog onRedirect={() => navigate("/login") } />
      {isTokenReady && <PlannerInvitesDialog />}
      <Toaster />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

function LandingRoute() {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <HomePage />;
}

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Login />;
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/funcionalidades" element={<NewFeaturesPage />} />
          <Route path="/planos" element={<PricingPage />} />
          <Route path="/cadastro" element={<SignUp />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/:slug/invite/:token" element={<InviteLandingPage />} />
          <Route path="/app/*" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
