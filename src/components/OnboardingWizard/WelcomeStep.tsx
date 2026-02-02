import { motion } from 'framer-motion';
import { 
  Brain, 
  Sparkles,
  ArrowRight,
  Building2,
  CreditCard,
  Tag,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';

// ============================================================================
// Types
// ============================================================================

interface WelcomeStepProps {
  userName?: string;
  onStart: () => void;
}

// ============================================================================
// Feature Item Component
// ============================================================================

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureItem({ icon, title, description, delay }: FeatureItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', bounce: 0.3 }}
      className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100"
    >
      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center flex-shrink-0 text-blue-400">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-zinc-900">{title}</h4>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Welcome Step Component
// ============================================================================

export function WelcomeStep({ userName, onStart }: WelcomeStepProps) {
  const firstName = userName?.split(' ')[0] || 'você';

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-4">
      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring', 
          bounce: 0.5,
          duration: 0.8 
        }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-blue-400/40">
          <Brain className="w-12 h-12 text-white" />
        </div>
        
        {/* Sparkle Effects */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-6 h-6 text-amber-400" />
        </motion.div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-bold text-zinc-900">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-lg text-zinc-600 max-w-md">
          Bem-vindo ao <span className="font-semibold text-blue-500">Cérebro das Finanças</span>. 
          Vamos configurar sua conta em poucos passos.
        </p>
      </motion.div>

      {/* What we'll do */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full space-y-3"
      >
        <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          O que vamos configurar
        </p>
        
        <div className="space-y-2">
          <FeatureItem
            icon={<Building2 className="w-5 h-5" />}
            title="Suas Contas"
            description="Adicione suas contas bancárias e carteiras"
            delay={0.6}
          />
          <FeatureItem
            icon={<CreditCard className="w-5 h-5" />}
            title="Cartões de Crédito"
            description="Configure seus cartões para controle de faturas"
            delay={0.7}
          />
          <FeatureItem
            icon={<Tag className="w-5 h-5" />}
            title="Categorias"
            description="Escolha categorias para organizar seus gastos"
            delay={0.8}
          />
          <FeatureItem
            icon={<Settings className="w-5 h-5" />}
            title="Preferências"
            description="Personalize o visual do sistema"
            delay={0.9}
          />
        </div>
      </motion.div>

      {/* Time Estimate */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-sm text-zinc-400"
      >
        ⏱️ Leva cerca de <span className="font-medium text-zinc-600">2-3 minutos</span>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full pt-4"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="w-full h-14 bg-blue-400 hover:bg-blue-500 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-blue-400/30 group"
        >
          Começar Configuração
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}
