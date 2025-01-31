import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://video-chat-backend-xf8g.onrender.com");

const VideoChat = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const startCall = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = event => {
        if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      };

      pc.ontrack = event => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      socket.emit("join-room", { roomId });

      socket.on("offer", async ({ sdp }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, sdp: answer });
      });

      socket.on("answer", async ({ sdp }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, sdp: offer });
    };

    startCall();
  }, [roomId]);

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
    </div>
  );
};

export default VideoChat;
