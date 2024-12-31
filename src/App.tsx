import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KeySystem } from './components/KeySystem';
import { CheckpointVerification } from './components/CheckpointVerification';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KeySystem />} />
        <Route path="/checkpoint/:number" element={<CheckpointVerification />} />
      </Routes>
    </BrowserRouter>
  );
}