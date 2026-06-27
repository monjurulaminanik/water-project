import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  currentBranchId: string | null;
  setCurrentBranchId: (id: string | null) => void;
};

const BranchCtx = createContext<Ctx>({
  currentBranchId: null,
  setCurrentBranchId: () => {},
});

const KEY = "sk-current-branch";

export function BranchProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(KEY);
  });

  const setCurrentBranchId = (v: string | null) => {
    setId(v);
    if (typeof window !== "undefined") {
      if (v) window.localStorage.setItem(KEY, v);
      else window.localStorage.removeItem(KEY);
    }
  };

  return (
    <BranchCtx.Provider value={{ currentBranchId: id, setCurrentBranchId }}>
      {children}
    </BranchCtx.Provider>
  );
}

export const useCurrentBranch = () => useContext(BranchCtx);
