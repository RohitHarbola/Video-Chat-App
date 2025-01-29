import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import VideoChat from "./pages/VideoChat";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:roomId" element={<VideoChat />} />
      </Routes>
    </Router>
  );
}

export default App;