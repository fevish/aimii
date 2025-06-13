import React, { useEffect, useRef, useState } from 'react';
import './OverwolfTerminal.css';

export interface OverwolfTerminalProps {
  className?: string;
}

export const OverwolfTerminal: React.FC<OverwolfTerminalProps> = ({ className }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const terminalRef = useRef<HTMLTextAreaElement>(null);

  // Listen for console messages from Overwolf (via preload)
  useEffect(() => {
    // @ts-ignore
    if (window.gep && window.gep.onMessage) {
      // @ts-ignore
      window.gep.onMessage((...args: any[]) => {
        setMessages(prev => [...prev, args.map(String).join(' ')]);
      });
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClear = () => setMessages([]);

  return (
    <div className={`overwolf-terminal ${className || ''}`.trim()}>
      <h2>Log:</h2>
      <textarea
        ref={terminalRef}
        className="overwolf-terminal-textarea"
        value={messages.join('\n')}
        readOnly
      />
      <button className="overwolf-terminal-clear" onClick={handleClear}>
        Clear
      </button>
    </div>
  );
};