import React from 'react';
import { GameScreen } from './components/GameScreen';

interface AppProps {
  tiltShiftDepthOfField?: boolean;
}

export function App({ tiltShiftDepthOfField = true }: AppProps) {
  return <GameScreen depthOfField={tiltShiftDepthOfField} />;
}