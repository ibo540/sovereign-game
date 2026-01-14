import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Host from './pages/Host';
import Player from './pages/Player';
import Background3D from './components/Background3D';
import CustomCursor from './components/CustomCursor';
import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Background3D />
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<Host />} />
        <Route path="/join" element={<Player />} />
        {/* Fallback for legacy links or direct player access if needed */}
        <Route path="/player" element={<Player />} />
      </Routes>
    </Router>
  );
}

export default App;
