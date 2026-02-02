import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuthErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
  variant?: 'blue' | 'emerald';
}

export function AuthErrorAlert({ error, onDismiss, variant = 'blue' }: AuthErrorAlertProps) {
  const errorMessages: Record<string, string> = {
    'access_denied': 'Acesso negado. Por favor, tente novamente.',
    'login_required': 'É necessário fazer login para continuar.',
    'consent_required': 'Consentimento necessário para prosseguir.',
    'interaction_required': 'Interação adicional necessária.',
    'unauthorized': 'Você não tem permissão para acessar este recurso.',
    'invalid_request': 'Requisição inválida. Tente novamente.',
    'too_many_attempts': 'Muitas tentativas. Aguarde alguns minutos.',
    'user_cancelled': 'Login cancelado pelo usuário.',
    'default': 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.',
  };

  const getErrorMessage = (errorCode: string): string => {
    return errorMessages[errorCode] || errorMessages['default'];
  };

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative p-4 rounded-xl border flex items-start gap-3",
            variant === 'emerald'
              ? "bg-red-50/50 border-red-200/50 text-red-800"
              : "bg-red-50/50 border-red-200/50 text-red-800"
          )}
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">
              Erro de Autenticação
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              {getErrorMessage(error)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors"
            aria-label="Fechar alerta"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
