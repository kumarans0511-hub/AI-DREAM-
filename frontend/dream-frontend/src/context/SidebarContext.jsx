import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  const toggle = () => setPinned(prev => !prev);
  const collapse = () => { setPinned(false); setHovered(false); };

  return (
    <SidebarContext.Provider value={{ pinned, hovered, setHovered, toggle, collapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export default SidebarContext;
