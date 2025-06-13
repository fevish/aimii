import React from 'react';
import { OverwolfTerminal } from '../OverwolfTerminal/OverwolfTerminal';

export const MyMainWindow: React.FC = () => {
  return (
    <div style={{ padding: 32 }}>
      <h1>Hello world</h1>
      <OverwolfTerminal />
    </div>
  );
};