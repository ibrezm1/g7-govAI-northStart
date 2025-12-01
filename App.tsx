import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatPanel from './components/ChatPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import { ChatMessage, AgentEvent, MapData, MessageRole, EventType, StreamChunk } from './types';
import { DEFAULT_MAP_CENTER, DEMO_PROMPT, DEMO_PROMPT_2, DEMO_PROMPT_3 } from './constants';
import { mockAdkStream } from './utils/mockStream';
import { Cog6ToothIcon, CommandLineIcon } from '@heroicons/react/24/outline';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Backend Configuration
const API_BASE_URL = 'http://localhost:8000';
const APP_NAME = 'basic_search_agent';
const USER_ID = 'u_123';

function App() {
  // Generate a random session ID for this browser session
  const [sessionId] = useState(() => `s_${generateId()}`);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [mapData, setMapData] = useState<MapData>({ center: DEFAULT_MAP_CENTER });
  const [isStreaming, setIsStreaming] = useState(false);
  const [useMock, setUseMock] = useState(true); // Default to mock for demo stability
  
  // Panel State
  const [activePanel, setActivePanel] = useState<'settings' | 'logs' | null>(null);
  
  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default to 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);

  // Resize Handlers
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  
  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        // Limits: Min 300px, Max 800px
        if (newWidth >= 300 && newWidth <= 800) {
            setSidebarWidth(newWidth);
        }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Load Canada Provinces GeoJSON on Mount
  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson');
        if (res.ok) {
          const data = await res.json();
          setMapData(prev => ({ ...prev, geoJsonData: data }));
          console.log("Loaded Canada province boundaries");
        }
      } catch (err) {
        console.warn("Could not load default map boundaries:", err);
      }
    };
    fetchBoundaries();
  }, []);

  // Initialize Session on Mount
  useEffect(() => {
    const initSession = async () => {
        try {
            // Only attempt to connect if we might use the real backend, 
            // though for this specific requirement we do it on load.
            await fetch(`${API_BASE_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    key1: "init", 
                    ts: Date.now() 
                })
            });
            console.log(`Session ${sessionId} initialized for user ${USER_ID}`);
        } catch (e) {
            // Silent fail if backend is down, as user might be using mock
            console.warn("Failed to initialize backend session:", e);
        }
    };

    initSession();
  }, [sessionId]);

  const handleSendMessage = useCallback(async (text: string) => {
    // 1. Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: MessageRole.User,
      content: text
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // 2. Prepare assistant placeholder
    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: MessageRole.Assistant,
      content: '',
      relatedEvents: [] 
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      if (useMock) {
        const streamSource = mockAdkStream(text);
        for await (const chunk of streamSource) {
            handleMockChunk(chunk, assistantId);
        }
      } else {
        // Real implementation for /run_sse with standard SSE parsing
        const response = await fetch(`${API_BASE_URL}/run_sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                appName: APP_NAME,
                userId: USER_ID,
                sessionId: sessionId,
                newMessage: {
                    role: "user",
                    parts: [{
                        text: text
                    }]
                },
                streaming: true
            })
        });
        
        if (!response.body) throw new Error("No response body");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Split by newlines (standard SSE delimiter)
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                // Standard SSE messages start with "data: "
                if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    if (jsonStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(jsonStr);
                        handleRealBackendData(data, assistantId);
                    } catch (e) {
                        console.warn("Failed to parse SSE JSON:", jsonStr);
                    }
                }
            }
        }
      }

    } catch (err) {
      console.error("Stream error:", err);
      const errorEvent: AgentEvent = {
        id: generateId(),
        type: EventType.Error,
        title: 'Connection Error',
        description: 'Failed to connect to ADK backend.',
        timestamp: Date.now(),
        status: 'failed'
      };
      setEvents(prev => [...prev, errorEvent]);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, content: msg.content + "\n[System Error: Could not complete response]" }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [useMock, sessionId]);

  // Helper to process Mock chunks (from local simulation)
  const handleMockChunk = (chunk: StreamChunk, assistantId: string) => {
    if (chunk.type === 'content') {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, content: msg.content + chunk.data }
            : msg
        ));
      } 
      else if (chunk.type === 'event') {
        const newEvent: AgentEvent = {
          id: generateId(),
          timestamp: Date.now(),
          ...chunk.data
        };
        
        setEvents(prev => [...prev, newEvent]);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, relatedEvents: [...(msg.relatedEvents || []), newEvent] }
            : msg
        ));
      }
      else if (chunk.type === 'map') {
          const update = chunk.data as Partial<MapData>;
          setMapData(prev => ({
            center: update.center || prev.center,
            // Keep geoJsonData (provinces) but replace active elements
            geoJsonData: prev.geoJsonData,
            polygons: update.polygons ? update.polygons : prev.polygons,
            markers: update.markers ? update.markers : prev.markers
          }));
      }
  };

  // Helper to process Real Backend Data
  const handleRealBackendData = (data: any, assistantId: string) => {
      const parts = data.content?.parts || data.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
          if (part.text) {
              setMessages(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, content: msg.content + part.text }
                    : msg
              ));
          }
          
          if (part.functionCall) {
              const { name, args } = part.functionCall;
              const isMapEvent = name.toLowerCase().includes('map') || name.toLowerCase().includes('geo');
              
              const newEvent: AgentEvent = {
                  id: generateId(),
                  type: isMapEvent ? EventType.MapUpdate : EventType.ToolCall,
                  title: `Tool: ${name}`,
                  description: JSON.stringify(args),
                  timestamp: Date.now(),
                  status: 'completed'
              };

              setEvents(prev => [...prev, newEvent]);
              setMessages(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, relatedEvents: [...(msg.relatedEvents || []), newEvent] }
                    : msg
              ));

              if (isMapEvent) {
                   const newMapData: Partial<MapData> = {};
                   if (args.lat && args.lng) {
                       newMapData.center = { lat: args.lat, lng: args.lng, zoom: args.zoom || 10 };
                   }
                   if (Array.isArray(args.markers)) {
                       newMapData.markers = args.markers.map((m: any) => ({
                           position: m.position || [m.lat, m.lng],
                           title: m.title || 'Marker'
                       }));
                   }
                   if (Array.isArray(args.polygons)) {
                        newMapData.polygons = args.polygons.map((p: any) => ({
                            coordinates: p.coordinates,
                            color: p.color,
                            label: p.label
                        }));
                   }

                   if (Object.keys(newMapData).length > 0) {
                        setMapData(prev => ({
                            center: newMapData.center || prev.center,
                            geoJsonData: prev.geoJsonData, // Preserve boundaries
                            polygons: newMapData.polygons ? newMapData.polygons : prev.polygons,
                            markers: newMapData.markers ? newMapData.markers : prev.markers
                        }));
                   }
              }
          }
      }
  };

  const handleRunDemo = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className={`${theme} h-screen w-screen overflow-hidden`}>
      <div className={`flex h-full w-full bg-gray-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        
        {/* Sidebar / Chat */}
        <div 
          className="flex-shrink-0 h-full relative z-20 shadow-xl"
          style={{ width: sidebarWidth }}
        >
           <ChatPanel 
              messages={messages} 
              isStreaming={isStreaming} 
              onSendMessage={handleSendMessage}
              inputDisabled={isStreaming}
           />
        </div>
  
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-30 flex-shrink-0 flex items-center justify-center border-l border-r border-gray-200 dark:border-slate-800 ${isResizing ? 'bg-blue-600' : 'bg-gray-100 dark:bg-slate-800'}`}
        >
           <div className="h-8 w-0.5 bg-gray-400 dark:bg-slate-600 rounded-full pointer-events-none opacity-50" />
        </div>
  
        {/* Main Map Area */}
        <div className="flex-1 h-full relative z-0">
          <MapPanel mapData={mapData} theme={theme} />
          
          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2">
              {/* Settings Toggle */}
              <button
                  onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                  className={`p-2 rounded-full border shadow-lg backdrop-blur transition-all ${
                      activePanel === 'settings'
                      ? 'bg-blue-600 text-white border-blue-500' 
                      : 'bg-white/80 dark:bg-slate-900/80 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-gray-200 dark:border-slate-700'
                  }`}
                  title="Settings"
              >
                  <Cog6ToothIcon className="w-6 h-6" />
              </button>

              {/* System Logs Toggle */}
              <button
                  onClick={() => setActivePanel(activePanel === 'logs' ? null : 'logs')}
                  className={`p-2 rounded-full border shadow-lg backdrop-blur transition-all ${
                      activePanel === 'logs'
                      ? 'bg-blue-600 text-white border-blue-500' 
                      : 'bg-white/80 dark:bg-slate-900/80 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-gray-200 dark:border-slate-700'
                  }`}
                  title="System Logs"
              >
                  <CommandLineIcon className="w-6 h-6" />
              </button>
          </div>
        </div>
        
        {/* Right Panel (Collapsible) */}
        <RightPanel 
            activeTab={activePanel}
            onClose={() => setActivePanel(null)}
            events={events}
            theme={theme}
            setTheme={setTheme}
            useMock={useMock}
            setUseMock={setUseMock}
            sessionId={sessionId}
            onRunDemo={handleRunDemo}
            isStreaming={isStreaming}
        />

      </div>
    </div>
  );
}

export default App;