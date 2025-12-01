import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, EventType, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowPathIcon, 
  PaperAirplaneIcon, 
  MapIcon, 
  CpuChipIcon, 
  BoltIcon, 
  GlobeAltIcon, 
  WrenchIcon
} from '@heroicons/react/24/outline';

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  inputDisabled: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  isStreaming, 
  onSendMessage,
  inputDisabled 
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case EventType.Reasoning: return <BoltIcon className="w-3 h-3" />;
      case EventType.ToolCall: return <WrenchIcon className="w-3 h-3" />;
      case EventType.MapUpdate: return <GlobeAltIcon className="w-3 h-3" />;
      default: return <CpuChipIcon className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 shadow-xl w-full relative z-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 dark:shadow-red-900/50">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M12.0002 0.825195L10.6062 6.0722L6.11075 4.10352L7.33027 9.87326L2.3457 7.79632L4.7432 12.0121L0.825195 13.9161L5.5946 16.591L5.35712 23.1746L8.52047 20.3204L10.8872 23.1746H13.1132L15.48 20.3204L18.6433 23.1746L18.4058 16.591L23.1752 13.9161L19.2572 12.0121L21.6547 7.79632L16.6702 9.87326L17.8897 4.10352L13.3942 6.0722L12.0002 0.825195Z" />
                </svg>
            </div>
            <div>
                <h1 className="text-slate-800 dark:text-white font-bold text-lg tracking-tight">North Star</h1>
                <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{isStreaming ? 'Processing Stream' : 'Ready'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gray-50 dark:bg-slate-950">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-4">
                <MapIcon className="w-16 h-16 opacity-20" />
                <p className="text-sm text-center max-w-xs">Ask about geographical data, population impact, or regional events to start the analysis.</p>
             </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === MessageRole.User ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === MessageRole.User
                    ? 'user-message bg-blue-600 text-white rounded-br-none'
                    : 'assistant-message bg-gray-100 dark:bg-slate-800 text-slate-950 dark:text-slate-200 rounded-bl-none border border-gray-200 dark:border-slate-700'
                }`}
              >
                {/* Inline Events (Muted Text) - Kept for context inside the bubble */}
                {msg.role === MessageRole.Assistant && msg.relatedEvents && msg.relatedEvents.length > 0 && (
                  <div className="mb-3 space-y-1.5 border-b border-gray-200 dark:border-slate-700/50 pb-2">
                    {msg.relatedEvents.map(evt => (
                      <div key={evt.id} className={`flex items-center space-x-2 text-xs text-slate-500 italic ${isStreaming && evt.status === 'pending' ? 'animate-pulse-fast' : ''}`}>
                        <span className={
                          evt.type === EventType.Reasoning ? 'text-purple-500 dark:text-purple-400' :
                          evt.type === EventType.MapUpdate ? 'text-emerald-500 dark:text-emerald-400' :
                          'text-amber-500 dark:text-amber-400'
                        }>
                          {getEventIcon(evt.type)}
                        </span>
                        <span>{evt.title}...</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Message Content with Markdown */}
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={inputDisabled}
            placeholder={inputDisabled ? "Agent is thinking..." : "Ask a question..."}
            className="w-full bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-gray-200 dark:border-slate-700 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || inputDisabled}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
          >
            {isStreaming ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </form>
        <div className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-600">
             Connected to ADK /run_sse backend
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;