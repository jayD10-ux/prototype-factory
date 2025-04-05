
import { FC, ReactNode } from "react";

interface NovuProviderProps {
  children: ReactNode;
}

// Temporarily disabled Novu Provider
export const NovuProvider: FC<NovuProviderProps> = ({ children }) => {
  // Just pass through children without any Novu initialization
  return <>{children}</>;
};
