import { useUser } from "../../contexts/UserContext";
import { MobileProfile } from "./Mobile";
import { DesktopProfile } from "./Desktop";
import { useIsMobile } from "../../hooks/use-mobile";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
}

export function Profile({ hasBusiness, setHasBusiness }: ProfileProps) {
  const { logout } = useUser();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileProfile 
        hasBusiness={hasBusiness} 
        setHasBusiness={setHasBusiness} 
        onLogout={logout}
      />
    );
  }
  
  return <DesktopProfile hasBusiness={hasBusiness} setHasBusiness={setHasBusiness} />;
}
