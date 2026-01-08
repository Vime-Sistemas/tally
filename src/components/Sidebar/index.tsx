import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import {
  Wallet,
  PieChart,
  PlusCircle,
  List,
  Target,
  Landmark,
  LayoutDashboard,
  ArrowRightLeft,
  BanknoteX,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Boxes,
  CaseUpper,
  ClipboardPen,
  Users,
  Building2,
  CalendarClock
} from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { Page } from "../../types/navigation";
import { useUser } from "../../contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useMemo } from "react";

interface SidebarProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onNavigate, currentPage, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useUser();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [businessModeOpen, setBusinessModeOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems = useMemo(() => {
    if (user?.type === 'PLANNER') {
      return [
        {
          id: 'dashboard',
          title: 'Visão Geral',
          icon: LayoutDashboard,
          page: 'planner-dashboard' as Page,
        },
        {
          id: 'cashflow',
          title: 'Fluxo Futuro',
          icon: CalendarClock,
          page: 'cashflow-future' as Page,
        },
        {
          id: 'clients',
          title: 'Meus Clientes',
          icon: Users,
          page: 'planner-clients' as Page,
        }
      ];
    }

    return [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        page: 'dashboard-summary' as Page,
      },
      {
        id: 'cashflow',
        title: 'Fluxo Futuro',
        icon: CalendarClock,
        page: 'cashflow-future' as Page,
      },
      {
        id: 'transactions',
        title: 'Transações',
        icon: ArrowRightLeft,
        page: 'transactions-new' as Page,
        submenu: [
          { title: 'Nova Transação', icon: PlusCircle, page: 'transactions-new' as Page },
          { title: 'Histórico', icon: List, page: 'transactions-history' as Page },
        ]
      },
      {
        id: 'accounts',
        title: 'Carteira',
        icon: Wallet,
        page: 'accounts-list' as Page,
        submenu: [
          { title: 'Nova Conta', icon: PlusCircle, page: 'accounts-new' as Page },
          { title: 'Gerenciar', icon: List, page: 'accounts-list' as Page },
        ]
      },
      {
        id: 'budgets',
        title: 'Orçamentos',
        icon: PieChart,
        page: 'budgets' as Page,
      },
      {
        id: 'equity',
        title: 'Patrimônio',
        icon: Landmark,
        page: 'equity-list' as Page,
        submenu: [
          { title: 'Novo Item', icon: PlusCircle, page: 'equity-new' as Page },
          { title: 'Meus Bens', icon: List, page: 'equity-list' as Page },
        ]
      },
      {
        id: 'debts',
        title: 'Dívidas',
        icon: BanknoteX,
        page: 'debts' as Page,
      },
      {
        id: 'params',
        title: 'Parâmetros',
        icon: Boxes,
        page: 'params' as Page,
        submenu: [
          { title: 'Categorias', icon: ClipboardPen, page: 'params-categories' as Page },
          { title: 'Tags', icon: CaseUpper, page: 'params-tags' as Page },
        ]
      },
      {
        id: 'goals',
        title: 'Metas',
        icon: Target,
        page: 'dashboard-goals' as Page,
      },
    ];
  }, [user]);

  // Effect: Auto-expand the menu group if the current page is inside it
  useEffect(() => {
    const activeGroup = menuItems.find(item => 
      item.submenu?.some(sub => sub.page === currentPage)
    );
    if (activeGroup && !expandedItems.includes(activeGroup.id)) {
      setExpandedItems(prev => [...prev, activeGroup.id]);
    }
  }, [currentPage, menuItems]); // Only runs when page changes

  const toggleExpanded = (id: string) => {
    // If collapsed, we generally don't want to expand the accordion as it breaks layout.
    // Instead, we might want to un-collapse the sidebar first, but here we just return.
    if (collapsed) return; 

    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userInitials = user?.name ? getInitials(user.name) : user?.email?.substring(0, 2).toUpperCase() || 'US';

  // Helper to determine active state styling
  const isActive = (page: string) => currentPage === page;

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-zinc-200 transition-all duration-300 fixed left-0 top-0 bottom-0 z-30 overflow-auto",
      collapsed ? "w-16" : "w-64"
    )}>
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-zinc-100">
        <div className={cn("flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all", collapsed && "opacity-0 w-0")}>
          <div className="w-9 h-8 bg-white rounded-lg flex flex-shrink-0 items-center justify-center shadow-sm">
            <img src="/icon.svg"></img>
          </div>
        </div>
        
        {/* Toggle Button - Centered when collapsed */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn(
            "h-8 w-8 hover:bg-zinc-100 text-zinc-500",
             collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* --- User Profile (Compact) --- */}
      <div className={cn("p-4 border-b border-zinc-100 overflow-hidden", collapsed ? "px-2 items-center flex flex-col" : "") }>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.picture || ""} />
            <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Navigation --- */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
        {menuItems.map((item) => {
          const isExpanded = expandedItems.includes(item.id);
          const isGroupActive = item.submenu?.some(sub => sub.page === currentPage) || item.page === currentPage;

          return (
            <div key={item.id}>
              {/* Main Menu Item */}
              <Button
                variant="ghost"
                title={collapsed ? item.title : undefined}
                className={cn(
                  "w-full justify-start h-10 mb-1",
                  collapsed ? "justify-center px-0" : "px-3",
                  isGroupActive && !isExpanded && !item.submenu ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                )}
                onClick={() => {
                  if (item.submenu && !collapsed) {
                    toggleExpanded(item.id);
                  } else {
                    onNavigate(item.page);
                  }
                }}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-3", isGroupActive ? "text-zinc-900" : "text-zinc-500")} />
                
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm text-left truncate">{item.title}</span>
                    {item.submenu && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-zinc-400 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                    )}
                  </>
                )}
              </Button>

              {/* Submenu Items (Only render if expanded AND not collapsed) */}
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded && !collapsed ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="ml-4 pl-3 border-l border-zinc-200 space-y-1 my-1">
                  {item.submenu?.map((subItem) => (
                    <Button
                      key={subItem.page}
                      variant="ghost"
                      onClick={() => onNavigate(subItem.page)}
                      className={cn(
                        "w-full justify-start h-9 px-3 text-sm",
                        isActive(subItem.page) 
                          ? "bg-zinc-100 text-zinc-900 font-medium" 
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                      )}
                    >
                      {/* Optional: sub-icons can be removed for a cleaner look, kept here for consistency */}
                      <subItem.icon className="h-3 w-3 mr-2 opacity-70" /> 
                      <span className="truncate">{subItem.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* --- Footer --- */}
      <div className="p-3 border-t border-zinc-100 space-y-1">
        {/* Business Mode Switch */}
        {!collapsed && (
          <div className="px-1 py-2 mb-2">
             <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2">
                   <Building2 className="h-4 w-4 text-zinc-500" />
                   <span className="text-xs font-medium text-zinc-600">Modo Empresarial</span>
                </div>
                <Switch 
                  checked={false} 
                  onCheckedChange={() => setBusinessModeOpen(true)} 
                  className="scale-75 data-[state=checked]:bg-blue-600"
                />
             </div>
          </div>
        )}

        <AlertDialog open={businessModeOpen} onOpenChange={setBusinessModeOpen}>
          <AlertDialogContent className="rounded-2xl border-zinc-100 shadow-2xl max-w-[400px]">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                 </div>
                 <AlertDialogTitle className="text-lg">Em breve!</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-zinc-500">
                Estamos trabalhando duro para trazer o <strong>Modo Empresarial</strong> para você. 
                <br/><br/>
                Em breve você poderá gerenciar as finanças da sua empresa separadamente, com funcionalidades exclusivas como emissão de notas, gestão de fluxo de caixa e muito mais.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end mt-4">
              <AlertDialogAction
                onClick={() => setBusinessModeOpen(false)}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
              >
                Entendi
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="ghost"
          title="Configurações"
          className={cn(
            "w-full justify-start h-10",
            collapsed ? "justify-center px-0" : "px-3",
            isActive('profile') ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          )}
          onClick={() => onNavigate('profile')}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3 text-sm">Configurações</span>}
        </Button>
        <Button
          variant="ghost"
          title="Sair"
          onClick={() => setLogoutOpen(true)}
          className={cn(
            "w-full justify-start h-10",
            collapsed ? "justify-center px-0" : "px-3",
            "text-red-500 hover:bg-red-50"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3 text-sm">Sair</span>}
        </Button>
        <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <AlertDialogContent className="rounded-2xl border-zinc-100 shadow-2xl max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Sair da conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Você precisará fazer login novamente para acessar suas informações financeiras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialogCancel className="rounded-xl border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                }}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm"
              >
                Sair
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}