import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionExpiredDialogProps {
  onRedirect: () => void;
}

export function SessionExpiredDialog({ onRedirect }: SessionExpiredDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
        onRedirect();
      }, 3000);
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [onRedirect]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sessão Expirada</DialogTitle>
          <DialogDescription>
            Sua sessão expirou. Você será redirecionado para a tela de login em instantes...
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
