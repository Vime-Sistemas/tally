import { motion } from 'framer-motion';
import { 
  CheckCircle2,
  PartyPopper,
  Rocket,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// ============================================================================
// Types
// ============================================================================

interface CompletionStepProps {
  accountsCount: number;
  cardsCount: number;
  categoriesCount: number;
  onFinish: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Summary Item Component
// ============================================================================

interface SummaryItemProps {
  label: string;
  value: number;
  emoji: string;
  delay: number;
}

function SummaryItem({ label, value, emoji, delay }: SummaryItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', bounce: 0.4 }}
      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <span className="font-medium text-zinc-700">{label}</span>
      </div>
      <span className="text-xl font-bold text-blue-500">{value}</span>
    </motion.div>
  );
}

// ============================================================================
// Main Completion Step Component
// ============================================================================

export function CompletionStep({ 
  accountsCount, 
  cardsCount, 
  categoriesCount, 
  onFinish,
  isLoading 
}: CompletionStepProps) {
  const { width, height } = useWindowSize();

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-4 relative">
      {/* Confetti Effect */}
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.2}
        colors={['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa']}
      />

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring', 
          bounce: 0.6,
          duration: 0.8 
        }}
        className="relative"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-400/40">
          <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
        
        {/* Party Popper */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
          className="absolute -top-2 -right-4"
        >
          <PartyPopper className="w-10 h-10 text-amber-500" />
        </motion.div>
      </motion.div>

      {/* Completion Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-bold text-zinc-900">
          Tudo Pronto! 🎉
        </h1>
        <p className="text-lg text-zinc-600 max-w-md">
          Sua conta está configurada. Agora você pode começar a organizar suas finanças!
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Resumo da configuração
        </p>
        
        <div className="space-y-2">
          <SummaryItem
            label="Contas criadas"
            value={accountsCount}
            emoji="🏦"
            delay={0.7}
          />
          {cardsCount > 0 && (
            <SummaryItem
              label="Cartões cadastrados"
              value={cardsCount}
              emoji="💳"
              delay={0.8}
            />
          )}
          {categoriesCount > 0 && (
            <SummaryItem
              label="Categorias selecionadas"
              value={categoriesCount}
              emoji="🏷️"
              delay={0.9}
            />
          )}
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="bg-blue-50 rounded-2xl p-4 w-full"
      >
        <div className="flex items-start gap-3 text-left">
          <Rocket className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700">Próximo passo</p>
            <p className="text-sm text-blue-600">
              Registre sua primeira transação para começar a ver seus dados no dashboard!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Finish Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full pt-4"
      >
        <Button
          onClick={onFinish}
          disabled={isLoading}
          size="lg"
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 group"
        >
          {isLoading ? (
            'Salvando...'
          ) : (
            <>
              Ir para o Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
