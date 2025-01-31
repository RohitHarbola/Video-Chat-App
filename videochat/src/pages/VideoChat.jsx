import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://video-chat-backend-xf8g.onrender.com");

const VideoChat = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null); // Reference to RTCPeerConnection
  const navigate = useNavigate(); // For redirecting

  useEffect(() => {
    const startCall = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Prevent local audio from playing back
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video to avoid echo
      }

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnection.current = pc; // Store the RTCPeerConnection instance

      // Add local tracks to the peer connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      // Handle remote track
      pc.ontrack = event => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Join the room
      socket.emit("join-room", { roomId });

      // Handle receiving offer
      socket.on("offer", async ({ sdp }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, sdp: answer });
      });

      // Handle receiving answer
      socket.on("answer", async ({ sdp }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      // Handle receiving ICE candidate
      socket.on("ice-candidate", async ({ candidate }) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      // Handle "disconnect-call" event from the partner
      socket.on("disconnect-call", () => {
        disconnectCall();
      });

      // Create and send an offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, sdp: offer });
    };

    startCall();

    return () => {
      // Cleanup on component unmount
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      socket.disconnect();
    };
  }, [roomId]);

  const disconnectCall = () => {
    // Stop all local video/audio tracks
    if (localVideoRef.current?.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Close the RTCPeerConnection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Notify the server to disconnect the call
    socket.emit("disconnect-call", { roomId });

    // Redirect to the home page
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <h1 className="text-white text-2xl font-bold mb-4">Video Chat Room: {roomId}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {/* Local Video */}
        <div className="relative w-full h-64 md:h-80 bg-black rounded-lg overflow-hidden shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline className="absolute w-full h-full object-cover" />
          <p className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">You</p>
        </div>

        {/* Remote Video */}
        <div className="relative w-full h-64 md:h-80 bg-black rounded-lg overflow-hidden shadow-lg">
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute w-full h-full object-cover" />
          <p className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">Partner</p>
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnectCall}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow-lg transition-transform transform hover:scale-105"
      >
        Disconnect
      </button>
    </div>
  );
};

export default VideoChat;
