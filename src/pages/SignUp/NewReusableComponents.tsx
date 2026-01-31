import React from 'react';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
// Assumindo uso do Link do react-router-dom
import { Link, useLocation } from 'react-router-dom';

// --- COMPONENTES REUTILIZÁVEIS (Coloque em arquivos separados no seu projeto) ---

export const MotionButton = ({ children, variant = "primary", className = "", asLink = false, ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 h-10 px-8 py-2 relative overflow-hidden select-none";
  const variants = {
    primary: "bg-blue-400 text-slate-50 shadow-lg shadow-slate-900/20",
    outline: "border border-blue-200 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "hover:bg-blue-100 text-slate-600 hover:text-slate-900",
    link: "text-slate-900 hover:underline pl-0 justify-start"
  };

  const Component = asLink ? Link : motion.button;
  const motionProps = asLink ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.95 } };

  return (
    <Component 
      {...props} 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

export const NavBar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md"
      >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="rounded-lg flex items-center justify-center"><Brain className="h-5 w-5 text-blue-400" /></div>
          <span className="text-lg font-bold tracking-tight">Cérebro das Finanças</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          {[
            { name: 'Funcionalidades', path: '/funcionalidades' },
            { name: 'Planos', path: '/planos' },
            { name: 'Comparativo CDF vs Planilha', path: '/comparativo-planilha-e-cdf'},
             // Advisor poderia ser uma página separada ou uma seção na home, mantive como link externo por enquanto
            { name: 'Para Advisors', path: '/advisor' } 
          ].map((item) => (
            <Link key={item.path} to={item.path} className={`text-sm font-medium transition-colors relative group ${isActive(item.path) ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
              {item.name}
              {isActive(item.path) && <motion.span layoutId="nav-underline" className="absolute -bottom-[21px] left-0 w-full h-[2px] bg-blue-400" />}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <MotionButton variant="ghost" asLink to="/login" className="hidden sm:inline-flex px-4">Entrar</MotionButton>
          <MotionButton asLink to="/cadastro">Começar</MotionButton>
        </div>
      </div>
    </motion.header>
  );
};

export const Footer = () => (
  <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
    <div className="container mx-auto px-4 md:px-6 text-center text-slate-400 text-sm">
       &copy; {new Date().getFullYear()} Cérebro das Finanças.
    </div>
  </footer>
);

// Wrapper padrão para as páginas
export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white font-sans text-slate-950 selection:bg-slate-900 selection:text-white overflow-x-hidden flex flex-col">
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);