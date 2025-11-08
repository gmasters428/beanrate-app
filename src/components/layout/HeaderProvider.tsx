import { createContext, useContext, useEffect } from "react";

const HeaderContext = createContext(false);

let headerMounted = false;

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (headerMounted) {
      throw new Error("Header mounted twice! Only one header should be rendered at a time.");
    }
    
    headerMounted = true;
    
    return () => {
      headerMounted = false;
    };
  }, []);
  
  return (
    <HeaderContext.Provider value={true}>
      {children}
    </HeaderContext.Provider>
  );
}

export const useHeaderContext = () => useContext(HeaderContext);
