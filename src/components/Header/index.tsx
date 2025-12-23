import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { cn } from "../../lib/utils";
import { Wallet, PieChart, TrendingUp, CreditCard, PlusCircle, List, CreditCard as CardIcon, Target, Building2, User, LogOut, BarChart3 } from "lucide-react";
import { HousePlus } from "lucide-react";
import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Kbd } from "../ui/kbd";
import type { Page, AppContext } from "../../types/navigation";
import { useUser } from "../../contexts/UserContext";
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

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 hidden md:block">
        <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard-summary'); }}>
            <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center">
              <img src="/icon.svg"></img>
            </div>
            <span className="hidden font-bold sm:inline-block">
              CDF
            </span>
          </a>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <Wallet className="mr-2 h-4 w-4" />
                  Visão Geral
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[260px]">
                    <ListItem href="#" title="Resumo" onClick={(e) => { e.preventDefault(); onNavigate('dashboard-summary'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          <span>Visão resumo</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + D</Kbd>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Metas" onClick={(e) => { e.preventDefault(); onNavigate('dashboard-goals'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Analisar metas</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + M</Kbd>
                      </div>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Transações
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-white p-6 no-underline outline-none focus:shadow-md"
                          href="#"
                          onClick={(e) => { e.preventDefault(); onNavigate('transactions-new'); }}
                        >
                          <TrendingUp className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Transações
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Gerencie suas receitas, despesas e transferências em um só lugar.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#" title="Nova Transação" onClick={(e) => { e.preventDefault(); onNavigate('transactions-new'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          <span>Registrar nova movimentação</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + T</Kbd>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Histórico" onClick={(e) => { e.preventDefault(); onNavigate('transactions-history'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          <span>Ver todas as transações</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + H</Kbd>
                      </div>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Contas e Cartões
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-white p-6 no-underline outline-none focus:shadow-md"
                          href="#"
                          onClick={(e) => { e.preventDefault(); onNavigate('accounts-list'); }}
                        >
                          <Wallet className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Carteira
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Visualize seus saldos e limites de cartão de crédito.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#" title="Nova Conta ou Cartão" onClick={(e) => { e.preventDefault(); onNavigate('accounts-new'); }}>
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Adicionar nova conta</span>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Cadastrados" onClick={(e) => { e.preventDefault(); onNavigate('accounts-list'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardIcon className="h-4 w-4" />
                          <span>Gerenciar contas e cartões</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + C</Kbd>
                      </div>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <HousePlus className="mr-2 h-4 w-4" />
                  Patrimônio
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-white p-6 no-underline outline-none focus:shadow-md"
                          href="#"
                          onClick={(e) => { e.preventDefault(); onNavigate('equity-list'); }}
                        >
                          <HousePlus className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Patrimônio
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Gerencie seus bens.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#" title="Novo Item" onClick={(e) => { e.preventDefault(); onNavigate('equity-new'); }}>
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Adicionar novo bem</span>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Cadastrados" onClick={(e) => { e.preventDefault(); onNavigate('equity-list'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardIcon className="h-4 w-4" />
                          <span>Gerenciar os bens cadastrados</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-14">Alt + P</Kbd>
                      </div>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Orçamentos
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-white p-6 no-underline outline-none focus:shadow-md"
                          href="#"
                          onClick={(e) => { e.preventDefault(); onNavigate('budgets'); }}
                        >
                          <BarChart3 className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Orçamentos
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Planeje e acompanhe seus orçamentos.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#" title="Visualizar" onClick={(e) => { e.preventDefault(); onNavigate('budgets'); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Gerenciar orçamentos</span>
                        </div>
                        <Kbd className="bg-blue-300 text-white h-6 w-12">Alt + B</Kbd>
                      </div>
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile Menu Button could go here */}

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other controls */}
          </div>
          <nav className="flex items-center gap-2">
             {hasBusiness && (
              <Select value={currentContext} onValueChange={(v) => onContextChange(v as AppContext)}>
                <SelectTrigger className="w-[160px] h-9 border-dashed bg-transparent hover:bg-accent/50 transition-colors focus:ring-0 focus:ring-offset-0">
                  <div className="flex items-center gap-2">
                    {currentContext === 'PERSONAL' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    <SelectValue placeholder="Contexto" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">
                    <div className="flex items-center gap-2">
                        <span>Pessoal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BUSINESS">
                    <div className="flex items-center gap-2">
                        <span>Empresarial</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
             <div className="hidden md:flex items-center gap-2">
               <button
                 onClick={() => setLogoutOpen(true)}
                 title="Sair"
                 className="ml-2 inline-flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
               >
                 <LogOut className="h-4 w-4" />
                 <span className="hidden sm:inline">Sair</span>
               </button>
               <button 
                 onClick={() => onNavigate('profile')} 
                 className="ml-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-2"
                 title={displayName}
               >
                 <span className="hidden md:inline-block text-sm font-medium text-gray-700">{displayName}</span>
                 <Avatar className="h-8 w-8 border border-gray-200">
                   <AvatarImage src="" alt={displayName} />
                   <AvatarFallback>{userInitials}</AvatarFallback>
                 </Avatar>
               </button>
             </div>
             <div className="md:hidden">
               <button 
                 onClick={() => onNavigate('profile')} 
                 className="ml-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-2"
                 title={displayName}
               >
                 <Avatar className="h-8 w-8 border border-gray-200">
                   <AvatarImage src="" alt={displayName} />
                   <AvatarFallback>{userInitials}</AvatarFallback>
                 </Avatar>
               </button>
             </div>
          </nav>
          {/* Logout confirmation dialog */}
          <AlertDialog open={logoutOpen} onOpenChange={(open) => setLogoutOpen(open)}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Sair da conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair da sua conta? Você será redirecionado para a tela de login.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <AlertDialogCancel className="">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setLogoutOpen(false);
                    logout();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sair
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      </header>
      <MobileHeader onNavigate={onNavigate} currentPage={currentPage} />
    </>
  );
}
