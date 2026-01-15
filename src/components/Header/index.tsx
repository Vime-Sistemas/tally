import React, { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { cn } from "../../lib/utils";
import {
  Wallet,
  PieChart,
  TrendingUp,
  PlusCircle,
  List,
  Target,
  Building2,
  User,
  LogOut,
  BarChart3,
  Landmark,
  LayoutDashboard,
  ArrowRightLeft,
  BanknoteX,
  Users,
  CalendarClock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Page, AppContext } from "../../types/navigation";
import { useUser } from "../../contexts/UserContext";
import { QuickTransactionMenu } from "../QuickTransactionMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import { MobileHeader } from "./Mobile";

interface HeaderProps {
  onNavigate: (page: Page) => void;
  hasBusiness: boolean;
  currentContext: AppContext;
  onContextChange: (context: AppContext) => void;
  currentPage: Page;
}

interface ListItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "group block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-zinc-50 focus:bg-zinc-50 cursor-pointer",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none text-zinc-900 group-hover:text-blue-600 transition-colors">
            {Icon && <Icon className="h-4 w-4 text-zinc-400 group-hover:text-blue-500" />}
            {title}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-zinc-500 pl-6 group-hover:text-zinc-600">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function Header({ onNavigate, hasBusiness, currentContext, onContextChange, currentPage }: HeaderProps) {
  const { user, logout } = useUser();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userInitials = user?.name ? getInitials(user.name) : user?.email?.substring(0, 2).toUpperCase() || 'US';
  const displayName = user?.name || user?.email || 'Usuário';
  const isPlanner = user?.type === 'PLANNER';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hidden md:block">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-8">
          
          {/* Logo Area */}
          <div className="mr-8 flex items-center">
            <a 
              className="flex items-center gap-2 group" 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate(isPlanner ? 'planner-clients' : 'dashboard-summary'); }}
            >
              <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <div className="font-bold text-blue-600 text-sm">C</div>
              </div>
              <span className="hidden font-bold text-zinc-900 sm:inline-block tracking-tight">
                CDF
              </span>
            </a>
          </div>

          {/* Navigation */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              
              {isPlanner ? (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <a
                        className="group inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:bg-zinc-50 focus:text-zinc-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-zinc-50/50 data-[state=open]:bg-zinc-50/50 cursor-pointer text-zinc-600"
                        onClick={(e) => { e.preventDefault(); onNavigate('planner-clients'); }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Meus Clientes
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <a
                        className="group inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:bg-zinc-50 focus:text-zinc-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-zinc-50/50 data-[state=open]:bg-zinc-50/50 cursor-pointer text-zinc-600"
                        onClick={(e) => { e.preventDefault(); onNavigate('cashflow-future'); }}
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Fluxo Futuro
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              ) : (
                <>
              {/* Visão Geral */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 data-[state=open]:bg-zinc-50 rounded-lg h-9 px-4">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Visão Geral
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-4 w-[300px] bg-white rounded-2xl border border-zinc-100 shadow-xl">
                    <ListItem 
                      href="#" 
                      title="Resumo Financeiro" 
                      icon={PieChart}
                      onClick={(e) => { e.preventDefault(); onNavigate('dashboard-summary'); }}
                    >
                      Dashboard completo com seus indicadores.
                    </ListItem>
                    <ListItem 
                      href="#" 
                      title="Metas & Objetivos" 
                      icon={Target}
                      onClick={(e) => { e.preventDefault(); onNavigate('dashboard-goals'); }}
                    >
                      Acompanhe o progresso dos seus sonhos.
                    </ListItem>
                    <ListItem 
                      href="#" 
                      title="Fluxo Futuro" 
                      icon={CalendarClock}
                      onClick={(e) => { e.preventDefault(); onNavigate('cashflow-future'); }}
                    >
                      Timeline semanal com ações rápidas.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Transações */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 data-[state=open]:bg-zinc-50 rounded-lg h-9 px-4">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transações
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white rounded-2xl border border-zinc-100 shadow-xl">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100 p-6 no-underline outline-none focus:shadow-md hover:from-blue-50 hover:to-blue-100 transition-all group"
                          href="#"
                          onClick={(e) => { e.preventDefault(); onNavigate('transactions-new'); }}
                        >
                          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                             <TrendingUp className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="mb-2 text-lg font-medium text-zinc-900">
                            Nova Transação
                          </div>
                          <p className="text-sm leading-tight text-zinc-500 group-hover:text-zinc-600">
                            Registre receitas ou despesas em segundos.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <div className="flex flex-col justify-center gap-1">
                       <ListItem href="#" title="Registrar Rápido" icon={PlusCircle} onClick={(e) => { e.preventDefault(); onNavigate('transactions-new'); }}>
                          Adicionar movimentação
                       </ListItem>
                       <ListItem href="#" title="Histórico Completo" icon={List} onClick={(e) => { e.preventDefault(); onNavigate('transactions-history'); }}>
                          Ver todas as transações
                       </ListItem>
                    </div>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Contas e Cartões */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 data-[state=open]:bg-zinc-50 rounded-lg h-9 px-4">
                  <Wallet className="mr-2 h-4 w-4" />
                  Carteira
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px] bg-white rounded-2xl border border-zinc-100 shadow-xl">
                    <ListItem href="#" title="Minhas Contas" icon={Wallet} onClick={(e) => { e.preventDefault(); onNavigate('accounts-list'); }}>
                      Gerencie saldos e contas bancárias.
                    </ListItem>
                    <ListItem href="#" title="Adicionar Nova" icon={PlusCircle} onClick={(e) => { e.preventDefault(); onNavigate('accounts-new'); }}>
                      Conecte uma nova instituição.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Patrimônio & Orçamentos (Combinados para economizar espaço ou separados se preferir) */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 data-[state=open]:bg-zinc-50 rounded-lg h-9 px-4">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Planejamento
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                   <ul className="grid gap-3 p-4 w-[350px] bg-white rounded-2xl border border-zinc-100 shadow-xl">
                    <div className="px-3 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Orçamentos
                    </div>
                    <ListItem href="#" title="Meus Orçamentos" icon={PieChart} onClick={(e) => { e.preventDefault(); onNavigate('budgets'); }}>
                       Defina limites de gastos mensais.
                    </ListItem>
                    
                    <div className="h-px bg-zinc-100 my-1 mx-2" />
                    
                    <div className="px-3 pt-2 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Patrimônio
                    </div>
                    <ListItem href="#" title="Meus Bens" icon={Landmark} onClick={(e) => { e.preventDefault(); onNavigate('equity-list'); }}>
                       Imóveis, veículos e investimentos.
                    </ListItem>

                    <div className="h-px bg-zinc-100 my-1 mx-2" />
                    
                    <div className="px-3 pt-2 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Dívidas
                    </div>
                    <ListItem href="#" title="Dívidas" icon={BanknoteX} onClick={(e) => { e.preventDefault(); onNavigate('debts'); }}>
                       Registre as suas dívidas.
                    </ListItem>
                   </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              </>
              )}

            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="flex-1" />

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">

            <QuickTransactionMenu onNavigate={onNavigate} variant="header" />

            {/* Context Selector */}
            {hasBusiness && (
              <Select value={currentContext} onValueChange={(v) => onContextChange(v as AppContext)}>
                <SelectTrigger className="w-[140px] h-9 border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-zinc-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {currentContext === 'PERSONAL' ? <User className="h-3.5 w-3.5 text-zinc-500" /> : <Building2 className="h-3.5 w-3.5 text-zinc-500" />}
                    <SelectValue placeholder="Contexto" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-lg">
                  <SelectItem value="PERSONAL" className="text-xs">Pessoal</SelectItem>
                  <SelectItem value="BUSINESS" className="text-xs">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-zinc-200" />

            {/* Profile & Logout */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('profile')} 
                className="group flex items-center gap-2 outline-none"
                title="Meu Perfil"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-zinc-900 leading-none group-hover:text-blue-600 transition-colors">
                    {displayName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                    {hasBusiness ? (currentContext === 'BUSINESS' ? 'Business' : 'Pessoal') : 'Free'}
                  </p>
                </div>
                <Avatar className="h-9 w-9 border border-zinc-200 group-hover:border-blue-200 transition-colors">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-zinc-50 text-zinc-600 text-xs font-bold group-hover:text-blue-500 group-hover:bg-blue-50">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>

              <button
                onClick={() => setLogoutOpen(true)}
                title="Sair"
                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Logout Alert */}
          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <AlertDialogContent className="rounded-2xl border-zinc-100 shadow-2xl max-w-[400px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">Sair da conta?</AlertDialogTitle>
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
      </header>
      
      <MobileHeader onNavigate={onNavigate} currentPage={currentPage} />
    </>
  );
}