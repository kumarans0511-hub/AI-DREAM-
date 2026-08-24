import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, Zap, Database, Send, Sparkles, Check, ArrowRight, Brain, Clock, ShieldCheck } from 'lucide-react';

function MemoryStatusTag({ mem }) {
  const status = mem.storage_status;
  let bg = 'bg-gray-100';
  let text = 'text-gray-700';
  let label = status || 'Evaluated';

  if (status === 'STORED' || status === 'RELATED_STORED') {
    bg = 'bg-emerald-100 border border-emerald-300';
    text = 'text-emerald-900';
    label = status === 'STORED' ? '✓ Stored' : '✓ Related Stored';
  } else if (status === 'UPDATED') {
    bg = 'bg-blue-100 border border-blue-300';
    text = 'text-blue-900';
    label = '⚡ Updated';
  } else if (status === 'DUPLICATE_SKIPPED') {
    bg = 'bg-amber-100 border border-amber-300';
    text = 'text-amber-900';
    label = 'Duplicate Skipped';
  } else if (status === 'NOT_IMPORTANT') {
    bg = 'bg-gray-100';
    text = 'text-gray-500';
    label = 'Low Priority (<5)';
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
}

export default function Conversation() {
  const [input, setInput]                     = useState('');
  const [messages, setMessages]               = useState([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [liveExtraction, setLiveExtraction]   = useState([]);
  const [retrievedContext, setRetrievedContext] = useState([]);
  const [latency, setLatency]                 = useState(null);
  const messagesEndRef                        = useRef(null);
  const textareaRef                           = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp }]);
    setIsLoading(true);

    const t0 = Date.now();
    try {
      const result = await api.chat(userMessage);
      const ms = Date.now() - t0;
      setLatency(ms);

      setMessages(prev => [...prev, {
        role: 'ai',
        text: result.assistant,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        newMemories: result.new_memories || [],
        retrievedCount: (result.retrieved_memories || []).length,
      }]);

      setLiveExtraction(result.new_memories || []);
      setRetrievedContext(result.retrieved_memories || []);
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        text: 'Error communicating with DREAM backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-[1500px] mx-auto w-full animate-fade-in-up">

      {/* ── Chat Panel (Main) ── */}
      <section className="flex-[2] flex flex-col surface-card bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm" style={{ minHeight: 0 }}>

        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-800 text-white font-bold">
              <Brain size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">DREAM Cognitive Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-800">AUTOMATIC MEMORY EXTRACTION ON</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latency && (
              <span className="mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-500">
                {latency}ms
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Llama 3.1 8B
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 bg-white">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-800 border border-emerald-100">
                <MessageSquare size={28} />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Start an Interactive Session
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tell DREAM about your projects, preferences, schedule, or life facts.
                  DREAM will automatically extract facts, score importance, retrieve relevant past knowledge, and persist memories into ChromaDB.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'} w-full`}>
              {msg.role === 'user' ? (
                <>
                  <div className="text-xs font-semibold mb-1 mr-1 text-gray-400">You</div>
                  <div className="px-5 py-3.5 rounded-2xl rounded-tr-none bg-gray-900 text-white max-w-[80%] shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="mono text-[10px] mt-1 mr-1 text-gray-400">{msg.timestamp}</span>
                </>
              ) : msg.role === 'ai' ? (
                <>
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <span className="text-xs font-bold text-emerald-800">DREAM</span>
                  </div>
                  <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-gray-50 border border-gray-100 shadow-sm max-w-[85%]">
                    <p className="text-sm leading-relaxed text-gray-800 font-medium">{msg.text}</p>

                    {/* Memory activity tags */}
                    {(msg.newMemories?.length > 0 || msg.retrievedCount > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-200">
                        {msg.retrievedCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            🔍 {msg.retrievedCount} memories retrieved
                          </span>
                        )}
                        {msg.newMemories?.map((m, j) => (
                          <MemoryStatusTag key={j} mem={m} />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="mono text-[10px] mt-1 ml-1 text-gray-400">{msg.timestamp}</span>
                </>
              ) : (
                <div className="text-xs font-bold px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex flex-col items-start w-full">
              <span className="text-xs font-bold text-emerald-800 mb-1 ml-1">DREAM (Evaluating Memory Pipeline…)</span>
              <div className="px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-800 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white">
          <div className="relative flex items-end gap-2 rounded-2xl px-4 py-3 bg-gray-50 border border-gray-200 shadow-sm focus-within:border-emerald-700 focus-within:bg-white transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder="Tell DREAM anything to create new memories..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-medium text-gray-900 placeholder:text-gray-400"
              style={{ minHeight: 24, maxHeight: 160, lineHeight: '1.6' }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-emerald-800 text-white disabled:opacity-40 hover:bg-emerald-900"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2 text-gray-400">
            Press Enter to send · Shift+Enter for new line · Real-time ImportanceScorer active
          </p>
        </div>
      </section>

      {/* ── Cognitive Inspection Sidebar ── */}
      <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4 h-full min-h-0 overflow-y-auto custom-scrollbar">

        {/* Live Memory Extraction */}
        <div className="surface-card p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-gray-900">
              <Zap size={14} className="text-emerald-700" /> Live Extracted Memories
            </h3>
            {liveExtraction.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {liveExtraction.length} new
              </span>
            )}
          </div>

          {liveExtraction.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              Send a message to see LLM extraction in real time.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {liveExtraction.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-900 leading-snug">
                    "{m.memory}"
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    {m.category && (
                      <span className="font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {m.category}
                      </span>
                    )}
                    {m.importance != null && (
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        ⚡ {m.importance}/10
                      </span>
                    )}
                    <MemoryStatusTag mem={m} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retrieved Context */}
        <div className="surface-card p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold mb-4 flex items-center gap-1.5 text-gray-900">
            <Database size={14} className="text-blue-700" /> Retrieved Context from ChromaDB
          </h3>
          {retrievedContext.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No prior context recalled for this turn.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {retrievedContext.map((ctx, i) => (
                <div key={i} className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col gap-1.5">
                  <p className="text-xs leading-relaxed text-gray-800 font-medium">
                    "{ctx.memory || ctx.content || JSON.stringify(ctx)}"
                  </p>
                  {ctx.distance != null && (
                    <span className="mono text-[10px] text-blue-700 font-semibold">
                      Cosine Distance: {ctx.distance.toFixed(4)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
