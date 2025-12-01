import React from 'react';
import { AgentEvent, EventType } from '../types';
import { 
  XMarkIcon, 
  SunIcon, 
  MoonIcon, 
  AdjustmentsHorizontalIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { DEMO_PROMPT, DEMO_PROMPT_2, DEMO_PROMPT_3 } from '../constants';

interface RightPanelProps {
  activeTab: 'settings' | 'logs' | null;
  onClose: () => void;
  events: AgentEvent[];
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  useMock: boolean;
  setUseMock: (use: boolean) => void;
  sessionId: string;
  onRunDemo: (prompt: string) => void;
  isStreaming: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({
  activeTab,
  onClose,
  events,
  theme,
  setTheme,
  useMock,
  setUseMock,
  sessionId,
  onRunDemo,
  isStreaming
}) => {
  if (!activeTab) return null;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-30 transition-all duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center">
          {activeTab === 'settings' ? (
            <>
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Settings
            </>
          ) : (
            <>
              <CommandLineIcon className="w-4 h-4 mr-2" />
              System Logs
            </>
          )}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* CONTENT FOR SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            
            {/* Session ID */}
            <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase">Session ID</label>
                <div className="bg-gray-100 dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-400 select-all truncate">
                    {sessionId}
                </div>
            </div>

            {/* Mock Toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Mock Backend</label>
                <input 
                    type="checkbox" 
                    checked={useMock} 
                    onChange={(e) => setUseMock(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800" 
                />
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Theme</label>
                <div className="flex bg-gray-200 dark:bg-slate-950 rounded p-0.5">
                    <button 
                        onClick={() => setTheme('light')}
                        className={`p-1 rounded transition-all ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <SunIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => setTheme('dark')}
                        className={`p-1 rounded transition-all ${theme === 'dark' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <MoonIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Demo Buttons */}
            <div className="space-y-2 pt-2">
                <label className="text-[10px] font-medium text-slate-400 uppercase">Scenarios</label>
                <button 
                    onClick={() => onRunDemo(DEMO_PROMPT)}
                    disabled={isStreaming}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-xs font-semibold rounded text-white transition-colors text-left"
                >
                    1. Population Impact
                </button>
                <button 
                    onClick={() => onRunDemo(DEMO_PROMPT_2)}
                    disabled={isStreaming}
                    className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded border border-gray-200 dark:border-slate-700 transition-colors text-left"
                >
                    2. Healthcare Locations
                </button>
                <button 
                    onClick={() => onRunDemo(DEMO_PROMPT_3)}
                    disabled={isStreaming}
                    className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded border border-gray-200 dark:border-slate-700 transition-colors text-left"
                >
                    3. Projected Population
                </button>
            </div>
          </div>
        )}

        {/* CONTENT FOR LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">
                    Event Stream
                </h3>
                <span className="bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    {events.length}
                </span>
             </div>

             <div className="space-y-2">
                {events.length === 0 && (
                    <div className="text-xs text-slate-400 dark:text-slate-600 italic text-center py-4">
                        No events logged yet.
                    </div>
                )}
                {events.map((evt) => (
                    <div key={evt.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-slate-800 py-1">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
                            evt.type === EventType.Reasoning ? 'bg-purple-500' :
                            evt.type === EventType.ToolCall ? 'bg-amber-500' :
                            evt.type === EventType.MapUpdate ? 'bg-emerald-500' :
                            'bg-red-500'
                        }`}></div>

                        <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className={`text-xs font-semibold ${
                                evt.type === EventType.Reasoning ? 'text-purple-600 dark:text-purple-400' :
                                evt.type === EventType.ToolCall ? 'text-amber-600 dark:text-amber-400' :
                                evt.type === EventType.MapUpdate ? 'text-emerald-600 dark:text-emerald-400' :
                                'text-red-500'
                            }`}>{evt.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{formatTime(evt.timestamp)}</span>
                        </div>
                        
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                            {evt.description}
                        </p>
                    </div>
                ))}
             </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 text-[10px] text-center text-slate-400 dark:text-slate-600">
        ADK Geo-Agent v1.3
      </div>
    </div>
  );
};

export default RightPanel;