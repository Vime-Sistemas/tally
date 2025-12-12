import { useUser } from "../../contexts/UserContext";
import { MobileProfile } from "./Mobile";
import { DesktopProfile } from "./Desktop";
import { useIsMobile } from "../../hooks/use-mobile";

interface ProfileProps {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
}

export function Profile({ hasBusiness, setHasBusiness }: ProfileProps) {
  const { setUser } = useUser();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  if (isMobile) {
    return (
      <MobileProfile 
        hasBusiness={hasBusiness} 
        setHasBusiness={setHasBusiness} 
        onLogout={handleLogout}
      />
    );
  }
  
  return <DesktopProfile hasBusiness={hasBusiness} setHasBusiness={setHasBusiness} />;
}
