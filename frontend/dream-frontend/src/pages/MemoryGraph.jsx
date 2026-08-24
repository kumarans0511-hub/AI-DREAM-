import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../services/api';
import MemoryInspectorDrawer from '../components/MemoryInspectorDrawer';
import { RefreshCw, Network, AlertCircle, Maximize } from 'lucide-react';

const CATEGORY_COLORS = {
  Preference:  '#111111',
  Concept:     '#333333',
  Project:     '#555555',
  Habit:       '#777777',
  Fact:        '#999999',
  General:     '#555555',
};

function catColor(cat = 'General') {
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return CATEGORY_COLORS.General;
}

export default function MemoryGraph() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  
  // Dimensions for responsive canvas
  const containerRef = useRef(null);
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllMemories();
      setMemories(data.memories || []);
    } catch {
      setError('Failed to load memories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  // Responsive resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading, error, memories.length]);

  const graphData = useMemo(() => {
    if (!memories.length) return { nodes: [], links: [] };
    
    const nodes = [];
    
    memories.forEach((mem, i) => {
      const cat = mem.category || 'General';
      nodes.push({
        id: `mem-${i}`,
        isHub: false,
        memory: mem.memory,
        category: cat,
        importance: mem.importance || 5,
        color: catColor(cat),
        val: 2 + Math.min(4, (mem.importance || 5) * 0.4),
        raw: mem
      });
    });

    return { nodes, links: [] };
  }, [memories]);

  const categories = [...new Set(memories.map(m => m.category || 'General'))];

  // Custom node drawing on Canvas
  const drawNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selected && selected.memory === node.memory;
    const size = node.val;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    
    if (node.isHub) {
      // Hub Node (Category)
      ctx.fillStyle = node.color + '15'; 
      ctx.fill();
      ctx.strokeStyle = node.color + '40';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      
      // Category Text
      const label = node.category.toUpperCase();
      const fontSize = 12 / globalScale;
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = node.color;
      ctx.fillText(label, node.x, node.y);
    } else {
      // Memory Node
      ctx.fillStyle = isSelected ? node.color : node.color + 'B3';
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + (4 / globalScale), 0, 2 * Math.PI, false);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 0.5 / globalScale;
        ctx.stroke();
      }
    }
  }, [selected]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full h-full animate-fade-in-up">

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Memory Graph</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Interactive cognitive clusters — powered by physics-based force simulation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (fgRef.current) fgRef.current.zoomToFit(400);
            }} 
            className="btn-ghost text-xs h-9 px-3"
            title="Fit to Screen"
          >
            <Maximize size={14} />
          </button>
          <button onClick={fetchMemories} className="btn-ghost text-xs h-9 px-3">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      {/* Legend */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 shrink-0">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColor(cat) }} />
              <span className="text-xs font-medium text-[var(--text-secondary)]">{cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Graph + detail */}
      <div className="flex flex-col xl:flex-row flex-1 min-h-0 gap-6">
        <div ref={containerRef} className="flex-1 surface-card relative overflow-hidden bg-white" style={{ minHeight: 500 }}>

          {/* Dotted background overlay using CSS since canvas is transparent */}
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{
            backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-surface)] z-10">
              <RefreshCw className="animate-spin text-[var(--text-primary)]" size={24} />
              <span className="text-sm text-[var(--text-secondary)]">Loading memory graph…</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-surface)] z-10">
              <AlertCircle className="text-[var(--text-secondary)]" size={32} />
              <p className="text-sm text-[var(--text-secondary)]">{error}</p>
              <button onClick={fetchMemories} className="btn-ghost text-xs">Retry</button>
            </div>
          ) : memories.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8 bg-[var(--bg-surface)] z-10">
              <Network className="text-[var(--text-muted)]" size={40} strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">No memories to visualize</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Start a conversation to create memories.
                </p>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeCanvasObject={drawNode}
              linkColor={() => '#E5E5E5'}
              linkWidth={1}
              d3VelocityDecay={0.3}
              cooldownTicks={100}
              onNodeClick={(node) => {
                if (!node.isHub) setSelected(node.raw);
                if (fgRef.current) {
                  fgRef.current.centerAt(node.x, node.y, 1000);
                  fgRef.current.zoom(4, 1000);
                }
              }}
              nodeLabel={(node) => !node.isHub ? 
                `<div style="
                  background: #FFFFFF; 
                  border: 1px solid #E5E5E5; 
                  border-radius: 6px; 
                  padding: 6px 10px; 
                  font-family: Inter, sans-serif;
                  font-size: 11px;
                  color: #111111;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                  max-width: 200px;
                  white-space: pre-wrap;
                ">${node.memory}</div>` 
                : ''}
            />
          )}

          {/* Relationship Alert */}
          {memories.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md p-3 rounded border bg-white border-yellow-200 text-yellow-800 flex items-start gap-3 z-10 shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Graph relationships not generated yet</p>
                <p className="text-[10px] mt-0.5 opacity-90 leading-relaxed">
                  The backend database currently stores memories as isolated vectors without explicit relational edges. Nodes are shown unconnected to accurately reflect the database state.
                </p>
              </div>
            </div>
          )}

          {/* Count badge */}
          {memories.length > 0 && (
            <div className="absolute top-4 right-4 mono text-[10px] px-2 py-1 rounded border font-semibold bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] z-10">
              {memories.length} nodes
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="xl:w-80 surface-card p-6 shrink-0 flex flex-col gap-4"
          style={{ minHeight: 200, maxHeight: '100%', overflowY: 'auto' }}>
          <div className="section-label text-[var(--text-secondary)]">Selected Node</div>
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColor(selected.category) }} />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {selected.category || 'General'}
                </span>
              </div>
              <p className="text-sm leading-relaxed font-medium text-[var(--text-primary)]">
                "{selected.memory}"
              </p>
              {selected.importance != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Importance</span>
                  <span className="mono text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--bg-base)] px-2 py-1 rounded border border-[var(--border)]">
                    {selected.importance}/10
                  </span>
                </div>
              )}
              <button
                onClick={() => { 
                  setSelected(null); 
                  if (fgRef.current) fgRef.current.zoomToFit(400);
                }}
                className="btn-ghost text-xs mt-auto self-start"
              >
                Deselect
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-8">
              <Network className="text-[var(--text-muted)]" size={32} strokeWidth={1.5} />
              <p className="text-xs text-[var(--text-muted)]">
                Click a node in the graph to inspect a memory.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Memory Inspector Drawer for full detail */}
      <MemoryInspectorDrawer memory={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
