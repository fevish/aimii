import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Terminal.css';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args: any[];
}

interface TerminalProps {
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [logQueue, setLogQueue] = useState<LogEntry[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Intercept console methods
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    const addLog = (level: 'log' | 'info' | 'warn' | 'error', ...args: any[]) => {
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        args
      };

      setLogQueue(prev => [...prev, logEntry]);
    };

    // Override console methods
    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('log', ...args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      addLog('info', ...args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('warn', ...args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('error', ...args);
    };

    // Restore original methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);

  // Process log queue with delays
  useEffect(() => {
    if (logQueue.length === 0 || isProcessingQueue) return;

    const processNextLog = () => {
      if (logQueue.length === 0) {
        setIsProcessingQueue(false);
        return;
      }

      setIsProcessingQueue(true);
      const nextLog = logQueue[0];

      setLogQueue(prev => prev.slice(1));

      setLogs(prev => {
        const newLogs = [...prev, nextLog];
        // Keep only last 200 logs
        return newLogs.slice(-200);
      });

      // Process next log after 500ms delay
      setTimeout(() => {
        setIsProcessingQueue(false);
      }, 500);
    };

    processNextLog();
  }, [logQueue, isProcessingQueue]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isScrolledToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isScrolledToBottom]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < clientHeight * 0.05;

    setIsScrolledToBottom(isAtBottom);
  }, []);

  // Handle command input
  const handleCommandKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      try {
        // Execute the command like Chrome console
        const result = eval(commandInput);

        // Add the command to logs
        const commandLog: LogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          level: 'log',
          message: `> ${commandInput}`,
          args: []
        };

        setLogs(prev => {
          const newLogs = [...prev, commandLog];
          return newLogs.slice(-200);
        });

        // Add the result to logs if it's not undefined
        if (result !== undefined) {
          const resultLog: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            level: 'log',
            message: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
            args: [result]
          };

          setLogs(prev => {
            const newLogs = [...prev, resultLog];
            return newLogs.slice(-200);
          });
        }

        setCommandInput('');
      } catch (error) {
        // Add error to logs
        const errorLog: LogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          level: 'error',
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
          args: [error]
        };

        setLogs(prev => {
          const newLogs = [...prev, errorLog];
          return newLogs.slice(-200);
        });

        setCommandInput('');
      }
    }
  }, [commandInput]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    setLogQueue([]);
  }, []);

  // Toggle terminal visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get log level icon
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '';
      case 'warn': return '';
      case 'info': return '';
      default: return '>';
    }
  };

  // Generate log lines
  const logLines = logs.map((log) => (
    <div key={log.id} className={`terminal-line terminal-log-${log.level}`}>
      {/* <span className="terminal-timestamp">{formatTimestamp(log.timestamp)}</span>
      <span className="terminal-level">{getLogLevelIcon(log.level)}</span> */}
      <span className="terminal-message">{log.message}</span>
    </div>
  ));

  return (
    <div className={`terminal ${className}`}>
      {isVisible && (
        <div
          ref={terminalRef}
          className="terminal-content"
          onScroll={handleScroll}
        >
          {logs.length === 0 ? (
            <div className="terminal-empty">
            </div>
          ) : (
            logLines
          )}
        </div>
      )}
      <div className="terminal-footer">
        {/* {isVisible && (
          <div className="terminal-command-line">
            <span className="terminal-prompt">{'>'}</span>
            <input
              type="text"
              className="terminal-input"
              placeholder=""
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleCommandKeyDown}
              ref={commandInputRef}
            />
          </div>
        )} */}
        <div className="terminal-controls">
          {isVisible && (
            <>
              <button onClick={clearLogs} className="terminal-btn terminal-clear-btn">
                Clear
              </button>
            </>
          )}
          <button onClick={toggleVisibility} className="terminal-btn terminal-close-btn">
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  );
};