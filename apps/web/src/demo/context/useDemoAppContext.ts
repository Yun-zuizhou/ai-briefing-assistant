import { useContext } from 'react';
import { DemoAppContext } from './DemoAppContext';

export function useDemoAppContext() {
  const context = useContext(DemoAppContext);
  if (!context) {
    throw new Error('useDemoAppContext must be used within a DemoAppProvider');
  }
  return context;
}
