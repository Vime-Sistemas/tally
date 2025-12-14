import { useIsMobile } from "../../hooks/use-mobile";
import { EditEquitySheet } from "./Mobile";
import { EditEquityDesktopDialog } from "./Desktop";
import type { Equity } from "../../types/equity";

interface EditEquityDialogProps {
  open: boolean;
  equity: Equity;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEquityDialog(props: EditEquityDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <EditEquitySheet {...props} />;
  }

  return <EditEquityDesktopDialog {...props} />;
}
