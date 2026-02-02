import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { OnboardingWizard } from '../../components/OnboardingWizard';
import { Brain } from 'lucide-react';

export function Onboarding() {
  const { user } = useUser();
  const navigate = useNavigate();

  // Redirect if onboarding already completed
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleComplete = () => {
    // Force reload to get fresh user data
    window.location.href = '/app';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-6">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center"
          >
            <Brain className="w-5 h-5 text-white" />
          </motion.div>
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold text-lg text-zinc-900"
          >
            Cérebro das Finanças
          </motion.span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <OnboardingWizard 
          userName={user?.name || undefined} 
          onComplete={handleComplete}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-zinc-400"
        >
          Seus dados estão seguros e criptografados 🔒
        </motion.p>
      </footer>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200 rounded-full blur-[100px] opacity-20" />
      </div>
    </div>
  );
}
