import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  ArrowRightLeft,
  Wallet,
  PieChart,
  Landmark,
  BanknoteX,
  Boxes,
  Target,
  Settings,
  LogOut,
  Building2,
  PlusCircle,
  List,
  ClipboardPen,
  CaseUpper,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useUser } from "../contexts/UserContext";
import type { Page } from "../types/navigation";
import { QuickTransactionMenu } from "./QuickTransactionMenu";

interface FloatingDockProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function FloatingDock({ onNavigate, currentPage }: FloatingDockProps) {
  const { user, logout } = useUser();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // --- Lógica de Itens (Replicada do Sidebar) ---
  const menuItems = useMemo(() => {
    if (user?.type === "PLANNER") {
      return [
        {
          id: "dashboard",
          title: "Visão Geral",
          icon: LayoutDashboard,
          page: "planner-dashboard" as Page,
        },
        {
          id: "cashflow",
          title: "Fluxo Futuro",
          icon: CalendarClock,
          page: "cashflow-future" as Page,
        },
        {
          id: "clients",
          title: "Meus Clientes",
          icon: Users,
          page: "planner-clients" as Page,
        },
      ];
    }

    return [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        page: "dashboard-summary" as Page,
      },
      {
        id: "cashflow",
        title: "Fluxo Futuro",
        icon: CalendarClock,
        page: "cashflow-future" as Page,
      },
      {
        id: "transactions",
        title: "Transações",
        icon: ArrowRightLeft,
        page: "transactions-new" as Page,
        submenu: [
          { title: "Nova", icon: PlusCircle, page: "transactions-new" as Page },
          {
            title: "Histórico",
            icon: List,
            page: "transactions-history" as Page,
          },
        ],
      },
      {
        id: "accounts",
        title: "Carteira",
        icon: Wallet,
        page: "accounts-list" as Page,
        submenu: [
          {
            title: "Nova Conta",
            icon: PlusCircle,
            page: "accounts-new" as Page,
          },
          { title: "Gerenciar", icon: List, page: "accounts-list" as Page },
        ],
      },
      {
        id: "budgets",
        title: "Orçamentos",
        icon: PieChart,
        page: "budgets" as Page,
      },
      {
        id: "equity",
        title: "Patrimônio",
        icon: Landmark,
        page: "equity-list" as Page,
      },
      { id: "debts", title: "Dívidas", icon: BanknoteX, page: "debts" as Page },
      {
        id: "params",
        title: "Parâmetros",
        icon: Boxes,
        page: "params" as Page,
        submenu: [
          {
            title: "Categorias",
            icon: ClipboardPen,
            page: "params-categories" as Page,
          },
          { title: "Tags", icon: CaseUpper, page: "params-tags" as Page },
        ],
      },
      {
        id: "goals",
        title: "Metas",
        icon: Target,
        page: "dashboard-goals" as Page,
      },
    ];
  }, [user]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const userInitials = user?.name ? getInitials(user.name) : "US";
  const isActive = (page: string) => currentPage === page;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 max-w-full">
      <div className="flex items-end gap-2 p-2 bg-white/90 backdrop-blur-xl border border-zinc-200/60 rounded-full shadow-2xl shadow-zinc-200/50 transition-all duration-300 ease-out hover:scale-[1.01]">
        {/* --- Quick Action (Adaptação do QuickTransactionMenu) --- */}
        <div className="mr-2 border-r border-zinc-200 pr-2">
          {/* Assumindo que QuickTransactionMenu renderiza um botão/trigger.
               Passamos collapsed={true} para ele renderizar apenas o ícone se for o caso */}
          <div className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors">
            <QuickTransactionMenu onNavigate={onNavigate} collapsed={true} />
          </div>
        </div>

        {/* --- Main Navigation Items --- */}
        <TooltipProvider delayDuration={0}>
          {menuItems.map((item, index) => {
            const isGroupActive =
              item.submenu?.some((sub) => sub.page === currentPage) ||
              item.page === currentPage;
            const hasSubmenu = !!item.submenu;

            // Render Item Logic
            const ItemButton = (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-10 w-10 rounded-full transition-all duration-200 ease-out",
                  isGroupActive
                    ? "bg-zinc-100 text-zinc-900 shadow-inner"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50",
                  hoveredIndex === index && "scale-110 -translate-y-1",
                )}
                onClick={() => !hasSubmenu && onNavigate(item.page)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <item.icon className="h-5 w-5" />
                {isGroupActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-zinc-900 rounded-full" />
                )}
              </Button>
            );

            if (hasSubmenu) {
              return (
                <DropdownMenu key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        {ItemButton}
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="mb-2 bg-zinc-900 text-white border-0"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    align="center"
                    side="top"
                    className="mb-2 w-48 rounded-xl"
                  >
                    <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.submenu?.map((sub) => (
                      <DropdownMenuItem
                        key={sub.page}
                        onClick={() => onNavigate(sub.page)}
                        className={cn(
                          "cursor-pointer",
                          isActive(sub.page) && "bg-zinc-50 font-medium",
                        )}
                      >
                        <sub.icon className="mr-2 h-4 w-4" />
                        {sub.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{ItemButton}</TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="mb-2 bg-zinc-900 text-white border-0"
                >
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* --- User Actions (Separator) --- */}
        <div className="ml-2 border-l border-zinc-200 pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full p-0 overflow-hidden border border-zinc-100 hover:border-zinc-300 transition-colors"
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={user?.picture || ""} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="w-56 mb-2 rounded-xl p-2"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("profile")}>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              {/* Opção futura de Business Mode */}
              <DropdownMenuItem disabled className="opacity-50">
                <Building2 className="mr-2 h-4 w-4" /> Modo Empresarial (Em
                breve)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
