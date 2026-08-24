import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import CommandPalette from './components/CommandPalette';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MemoryExplorer from './pages/MemoryExplorer';
import MemoryGraph from './pages/MemoryGraph';
import DreamEngine from './pages/DreamEngine';
import Reflections from './pages/Reflections';
import Forgetting from './pages/Forgetting';
import Analytics from './pages/Analytics';
import Conversation from './pages/Conversation';
import Settings from './pages/Settings';
import Datasets from './pages/Datasets';
import Profile from './pages/Profile';

function App() {
  const [palettteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K handler
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <BrowserRouter>
      <SidebarProvider>
        {/* Command Palette — outside router context but inside BrowserRouter for navigate() */}
        <CommandPalette open={palettteOpen} onClose={() => setPaletteOpen(false)} />

        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="memory-explorer" element={<MemoryExplorer />} />
            <Route path="memory-graph" element={<MemoryGraph />} />
            <Route path="dream-engine" element={<DreamEngine />} />
            <Route path="reflections" element={<Reflections />} />
            <Route path="forgetting" element={<Forgetting />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="conversation" element={<Conversation />} />
            <Route path="settings" element={<Settings />} />
            <Route path="datasets" element={<Datasets />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;