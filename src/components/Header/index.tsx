import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../ui/navigation-menu";
import { cn } from "../../lib/utils";
import { Wallet, PieChart, TrendingUp, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
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
                <NavigationMenuLink
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent cursor-pointer")}
                  href="#"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Visão Geral
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent cursor-pointer")}
                  href="#"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Transações
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent cursor-pointer")}
                  href="#"
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  Relatórios
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile Menu Button could go here */}

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other controls */}
          </div>
          <nav className="flex items-center">
             <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9">
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
