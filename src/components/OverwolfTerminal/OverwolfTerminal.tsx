import React, { useEffect, useRef, useState } from 'react';
import './OverwolfTerminal.css';

export interface OverwolfTerminalProps {
  className?: string;
}

export const OverwolfTerminal: React.FC<OverwolfTerminalProps> = ({ className }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const terminalRef = useRef<HTMLTextAreaElement>(null);

  // Listen for console messages from Overwolf (via preload)
  useEffect(() => {
    // @ts-ignore
    if (window.gep && window.gep.onMessage) {
      // @ts-ignore
      window.gep.onMessage((...args: any[]) => {
        const message = args.map(String).join(' ');
        setMessages(prev => [...prev, message]);

        // Auto-detect successful initialization
        if (message.includes('overlay is registered') || message.includes('Re-initialization complete')) {
          setHasInitialized(true);
          setIsInitializing(false);
        }
      });
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    setHasInitialized(false); // Allow re-initialization after clearing
  };

  const handleStart = async () => {
    if (isInitializing || hasInitialized) return;

    setIsInitializing(true);
    try {
      // @ts-ignore
      if (window.gep && window.gep.restartInitialization) {
        // @ts-ignore
        await window.gep.restartInitialization();
      }
    } catch (error) {
      setMessages(prev => [...prev, `Start error: ${error}`]);
      setIsInitializing(false);
    }
  };

  const getStartButtonText = () => {
    if (isInitializing) return 'Starting...';
    if (hasInitialized) return 'Started ✓';
    return 'Start';
  };

  const isStartButtonDisabled = isInitializing || hasInitialized;

  return (
    <div className={`overwolf-terminal ${className || ''}`.trim()}>
      <h2>Log:</h2>
      <textarea
        ref={terminalRef}
        className="overwolf-terminal-textarea"
        value={messages.join('\n')}
        readOnly
      />
      <div className="overwolf-terminal-buttons">
        <button className="overwolf-terminal-start" onClick={handleStart} disabled={isStartButtonDisabled}>
          {getStartButtonText()}
        </button>
        <button className="overwolf-terminal-clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
};