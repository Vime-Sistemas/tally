import { motion, AnimatePresence,  } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export const MotionButton = ({ children, variant = "primary", className = "", asLink = false, ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 h-10 px-8 py-2 relative overflow-hidden select-none cursor-pointer";
  
  const variants = {
    primary: "bg-blue-400 text-white shadow-lg shadow-blue-400/20 hover:bg-blue-500",
    outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    link: "text-slate-900 hover:underline pl-0 justify-start"
  };
  
  // Se for link, o Framer Motion não anima automaticamente, então envolvemos o conteúdo
  if (asLink) {
    return (
      <Link 
        {...props} 
        className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      >
        <motion.span 
          className="flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }}
        >
          {children}
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button 
      {...props} 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};

import  { useState, useEffect } from 'react';
import { Brain, Menu, X, Home, BarChart3, Layers, LayoutGrid, ChevronRight, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// --- NAVBAR ---
export const NavBar = () => {
  const location = useLocation();
  const [advisorAlertOpen, setAdvisorAlertOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { name: 'Funcionalidades', path: '/funcionalidades', icon: <Layers size={18}/> },
    { name: 'Planos', path: '/planos', icon: <LayoutGrid size={18}/> },
    { name: 'Comparativo', path: '/comparativo-planilha-e-cdf', icon: <BarChart3 size={18}/> },
  ];

  return (
    <>
      <motion.header 
        initial={{ y: -100 }} 
        animate={{ y: 0 }}
        className={`sticky top-0 z-[40] w-full transition-all duration-300 ${
          scrolled ? 'border-b border-slate-200 bg-white/90 backdrop-blur-md py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 z-50">
            <div className="bg-blue-400 p-1.5 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden xs:block">CDF</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`text-sm font-medium transition-all relative py-1 ${
                  isActive(item.path) ? 'text-blue-500' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.name}
                {isActive(item.path) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-[2px] bg-blue-400" />
                )}
              </Link>
            ))}
            <button onClick={() => setAdvisorAlertOpen(true)} className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Advisors
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-500 px-3 hidden sm:block">
              Entrar
            </Link>
            <MotionButton asLink to="/cadastro" className="h-9 px-5 text-xs md:text-sm">
              Criar Conta
            </MotionButton>
            
            {/* Mobile Menu Toggle (Apenas se quiser o menu lateral além da tab bar) */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Fullscreen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col p-6 md:hidden"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-xl">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3 font-semibold text-slate-800">
                    {link.icon} {link.name}
                  </div>
                  <ChevronRight className="text-slate-400" size={18} />
                </Link>
              ))}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4">
               <MotionButton variant="outline" asLink to="/login" className="h-14 rounded-2xl">Login</MotionButton>
               <MotionButton asLink to="/cadastro" className="h-14 rounded-2xl">Começar</MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdvisorAlert open={advisorAlertOpen} onOpenChange={setAdvisorAlertOpen} />
    </>
  );
};

// --- FOOTER COM BOTTOM NAV NO MOBILE ---
export const Footer = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <footer className="bg-white border-t border-slate-100 py-12 pb-32 md:pb-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-blue-400 opacity-50" />
            <span className="font-bold text-slate-900">CDF</span>
          </div>
          <p className="text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} Cérebro das Finanças. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl z-[60] flex items-center justify-around px-2">
        <BottomNavLink to="/" icon={<Home size={20}/>} label="Home" active={isActive('/')} />
        <BottomNavLink to="/funcionalidades" icon={<Layers size={20}/>} label="Recursos" active={isActive('/funcionalidades')} />
        <BottomNavLink to="/comparativo-planilha-e-cdf" icon={<BarChart3 size={20}/>} label="Planilhas" active={isActive('/comparativo-planilha-e-cdf')} />
        <BottomNavLink to="/login" icon={<User size={20}/>} label="Perfil" active={isActive('/login')} />
      </nav>
    </>
  );
};

// Componente Auxiliar para a Tab Bar
const BottomNavLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className="flex flex-col items-center justify-center gap-1 w-16 relative">
    <div className={`transition-all duration-300 ${active ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'text-blue-500' : 'text-slate-400'}`}>
      {label}
    </span>
    {active && (
      <motion.div layoutId="bottom-nav-dot" className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
    )}
  </Link>
);

const AdvisorAlert = ({ open, onOpenChange }: any) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-white rounded-3xl max-w-[90%] md:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>Área do Advisor</AlertDialogTitle>
        <AlertDialogDescription>
          Estamos refinando o portal para consultores. Em breve você poderá gerenciar o patrimônio de seus clientes com um clique.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction className="bg-blue-400 text-white rounded-xl" onClick={() => onOpenChange(false)}>
          Entendido
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Wrapper padrão para as páginas

export const PageWrapper = ({ children }: { children: React.ReactNode }) => (

  <div className="min-h-screen bg-white font-sans text-slate-950 selection:bg-slate-900 selection:text-white overflow-x-hidden flex flex-col">

    <NavBar />

    <main className="flex-1">{children}</main>

    <Footer />

  </div>

);