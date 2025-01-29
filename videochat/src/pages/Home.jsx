import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [interest, setInterest] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (interest.trim()) {
      navigate(`/chat/${interest}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Enter Your Interest</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          placeholder="Enter your interest"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Find Match
        </button>
      </form>
    </div>
  );
};

export default Home;