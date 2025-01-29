import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://your-server-url");

const VideoChat = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const startVideoChat = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      const pc = new RTCPeerConnection();
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      setPeerConnection(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      socket.emit("join-room", roomId);

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

      if (pc.signalingState === "stable") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, sdp: offer });
      }
    };

    startVideoChat();
  }, [roomId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Video Chat Room: {roomId}</h1>
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay playsInline className="w-1/2 border rounded" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border rounded" />
      </div>
    </div>
  );
};

export default VideoChat;
