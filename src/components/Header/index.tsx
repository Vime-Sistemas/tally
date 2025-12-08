import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { cn } from "../../lib/utils";
import { Wallet, PieChart, TrendingUp, Settings, CreditCard, PlusCircle, List, CreditCard as CardIcon, Target } from "lucide-react";
import { HousePlus } from "lucide-react";
import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type Page = 'dashboard-summary' | 'dashboard-goals' | 'transactions-new' | 'transactions-history' | 'accounts-new' | 'accounts-list' | 'reports' | 'equity-list' | 'equity-new' | 'profile';

export type AppContext = 'PERSONAL' | 'BUSINESS';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  hasBusiness: boolean;
  currentContext: AppContext;
  onContextChange: (context: AppContext) => void;
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

export function Header({ onNavigate, hasBusiness, currentContext, onContextChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard-summary'); }}>
            <div className="h-6 w-6 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              Tally
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
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        <span>Visão resumo</span>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Metas" onClick={(e) => { e.preventDefault(); onNavigate('dashboard-goals'); }}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Analisar metas</span>
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
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
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
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Registrar nova movimentação</span>
                      </div>
                    </ListItem>
                    <ListItem href="#" title="Histórico" onClick={(e) => { e.preventDefault(); onNavigate('transactions-history'); }}>
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>Ver todas as transações</span>
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
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
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
                      <div className="flex items-center gap-2">
                        <CardIcon className="h-4 w-4" />
                        <span>Gerenciar contas e cartões</span>
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
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
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
                      <div className="flex items-center gap-2">
                        <CardIcon className="h-4 w-4" />
                        <span>Gerenciar os bens cadastrados</span>
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
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Contexto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Pessoal</SelectItem>
                  <SelectItem value="BUSINESS">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            )}
             <button onClick={() => onNavigate('profile')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Configurações</span>
             </button>
             <div className="ml-2 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200">
                <span className="text-xs font-medium text-gray-600">US</span>
             </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
