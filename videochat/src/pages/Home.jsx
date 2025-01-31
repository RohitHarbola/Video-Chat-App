import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState(""); // Changed from userId to username
  const [interests, setInterests] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const trimmedUsername = username.trim(); // Renamed to reflect "username"
    const trimmedInterests = interests.trim();

    if (!trimmedUsername || !trimmedInterests) {
      alert("⚠️ Please enter both a Username and Interests!");
      return;
    }

    try {
      // Convert interests into a unique, lowercase array
      const interestArray = [...new Set(trimmedInterests.split(",").map((interest) => interest.trim().toLowerCase()))];

      if (interestArray.length === 0) {
        alert("⚠️ Please enter at least one valid interest.");
        return;
      }

      const response = await fetch("https://video-chat-backend-xf8g.onrender.com/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, interests: interestArray }), // Send as an array with "username"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "❌ Failed to save interests");
      }

      console.log("✅ Interests saved successfully");

      // Fix the URL path for fetching match data (add a `/` before username)
      const matchResponse = await fetch(`https://video-chat-backend-xf8g.onrender.com/api/match/${trimmedUsername}`);
      console.log("matchResponse", matchResponse);

      if (!matchResponse.ok) {
        const errorData = await matchResponse.json();
        throw new Error(errorData.error || "❌ Failed to find match");
      }

      const data = await matchResponse.json();

      if (data.matchedUser) {
        console.log(`🎉 Match found: ${data.matchedUser}`);
        navigate(`/video/${data.matchedUser}`);
      } else {
        alert("⚠️ No match found. Try again later.");
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <h1 className="text-white text-3xl font-bold mb-4">Find a Video Chat Match</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <input
          className="w-full p-2 border rounded mb-2"
          placeholder="Enter Username" // Updated placeholder
          value={username} // Updated state variable
          onChange={(e) => setUsername(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Enter Interests (comma separated)"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={handleSubmit}>
          Find Match
        </button>
      </div>
    </div>
  );
};

export default Home;
