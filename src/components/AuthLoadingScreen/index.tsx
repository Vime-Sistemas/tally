import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Shield, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type LoadingPhase = 
  | 'redirecting' 
  | 'authenticating' 
  | 'syncing' 
  | 'preparing'
  | 'complete';

interface AuthLoadingScreenProps {
  phase?: LoadingPhase;
  message?: string;
}

// ============================================================================
// Loading Messages
// ============================================================================

const PHASE_CONFIG: Record<LoadingPhase, { message: string; icon: React.ReactNode }> = {
  redirecting: {
    message: 'Redirecionando para login seguro...',
    icon: <Shield className="w-6 h-6" />,
  },
  authenticating: {
    message: 'Autenticando sua conta...',
    icon: <Lock className="w-6 h-6" />,
  },
  syncing: {
    message: 'Sincronizando seus dados...',
    icon: <Sparkles className="w-6 h-6" />,
  },
  preparing: {
    message: 'Preparando sua experiência...',
    icon: <Brain className="w-6 h-6" />,
  },
  complete: {
    message: 'Tudo pronto!',
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
};

// ============================================================================
// Animated Background
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/50" />
      
      {/* Animated orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]"
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================================================
// Animated Logo
// ============================================================================

function AnimatedLogo() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring', 
        bounce: 0.4,
        duration: 0.8 
      }}
      className="relative mb-8"
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-blue-400 rounded-3xl blur-xl"
      />
      
      {/* Logo container */}
      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-blue-400/40">
        <Brain className="w-10 h-10 text-white" />
      </div>
      
      {/* Orbiting particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0"
          style={{ transform: `rotate(${i * 120}deg)` }}
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ============================================================================
// Progress Dots
// ============================================================================

function ProgressDots() {
  return (
    <div className="flex items-center gap-1.5 mt-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-2 h-2 rounded-full bg-blue-400"
        />
      ))}
    </div>
  );
}

// ============================================================================
// Fun Facts (to keep user engaged)
// ============================================================================

const FUN_FACTS = [
  "Quem controla seu dinheiro, controla seu destino.",
  "87% das pessoas não sabem pra onde vai seu dinheiro.",
  "Pequenos gastos diários somam grandes valores no ano.",
  "Planejamento financeiro aumenta sua tranquilidade.",
  "Você está a um passo de organizar suas finanças.",
];

function FunFactDisplay() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-12 max-w-sm text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={factIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-zinc-400 italic"
        >
          "{FUN_FACTS[factIndex]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AuthLoadingScreen({ phase = 'authenticating', message }: AuthLoadingScreenProps) {
  const config = PHASE_CONFIG[phase];
  const displayMessage = message || config.message;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <AnimatedLogo />
        
        {/* Phase Icon */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-zinc-600"
        >
          <motion.div
            animate={{ rotate: phase !== 'complete' ? 360 : 0 }}
            transition={{ 
              duration: 2, 
              repeat: phase !== 'complete' ? Infinity : 0,
              ease: "linear" 
            }}
            className={phase === 'complete' ? 'text-emerald-500' : 'text-blue-400'}
          >
            {config.icon}
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.span
              key={displayMessage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-base font-medium"
            >
              {displayMessage}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {phase !== 'complete' && <ProgressDots />}

        <FunFactDisplay />

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-2 text-xs text-zinc-400"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Conexão segura via Auth0</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export type { LoadingPhase };
