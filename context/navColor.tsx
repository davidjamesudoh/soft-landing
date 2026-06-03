"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type NavColor = "white" | "black";

export const NavColorContext = createContext<{
  color: NavColor;
  setColor: (c: NavColor) => void;
}>({ color: "white", setColor: () => {} });

export function NavColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<NavColor>("white");
  return (
    <NavColorContext.Provider value={{ color, setColor }}>
      {children}
    </NavColorContext.Provider>
  );
}

export function useNavColor() {
  return useContext(NavColorContext);
}

/** Returns a stable setColor that only fires when the value actually changes — avoids re-renders on every scroll frame. */
export function useStableNavColor() {
  const { setColor } = useNavColor();
  const last = useRef<NavColor | null>(null);
  return useCallback(
    (c: NavColor) => {
      if (c !== last.current) {
        last.current = c;
        setColor(c);
      }
    },
    [setColor],
  );
}
