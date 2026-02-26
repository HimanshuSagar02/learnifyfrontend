/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaDesktop, FaComments, FaTimes, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { serverUrl } from "../App";

function RemoteVideoTrack({ track, id, className }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!track || !element) return;

    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return <video ref={videoRef} id={id} autoPlay playsInline className={className} />;
}

function LiveKitPlayer({ liveClassId, onClose, isEducator = false }) {
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participantDetails, setParticipantDetails] = useState({});
  const [showParticipants, setShowParticipants] = useState(isEducator); // Show by default for educators

  const localVideoRef = useRef(null);

  const fetchParticipantDetails = useCallback(async (identity) => {
    try {
      // Try to fetch user details from backend using identity (email or userId)
      try {
        const response = await axios.get(
          `${serverUrl}/api/user/participant/${encodeURIComponent(identity)}`,
          { withCredentials: true }
        );
        if (response.data) {
          setParticipantDetails(prev => ({
            ...prev,
            [identity]: {
              name: response.data.name || identity.split('@')[0] || identity,
              email: response.data.email || (identity.includes('@') ? identity : ""),
              role: response.data.role || "student",
              photoUrl: response.data.photoUrl || "",
              class: response.data.class || "",
              subject: response.data.subject || ""
            }
          }));
          return;
        }
      } catch {
        console.log(`[LiveKit] Could not fetch details for ${identity}, using fallback`);
      }
      
      // Fallback: use identity as name
      setParticipantDetails(prev => ({
        ...prev,
        [identity]: {
          name: identity.split('@')[0] || identity,
          email: identity.includes('@') ? identity : "",
          role: "student",
          photoUrl: ""
        }
      }));
    } catch (error) {
      console.warn("Could not fetch participant details:", error);
    }
  }, []);

  const updateParticipants = useCallback((activeRoom = room) => {
    if (!activeRoom) return;

    const allParticipants = [
      activeRoom.localParticipant,
      ...Array.from(activeRoom.remoteParticipants.values()),
    ].filter(Boolean);

    setParticipants(allParticipants);

    // Fetch details for new participants if educator
    if (isEducator) {
      allParticipants.forEach((participant) => {
        if (
          participant !== activeRoom.localParticipant &&
          !participantDetails[participant.identity]
        ) {
          fetchParticipantDetails(participant.identity);
        }
      });
    }
  }, [room, isEducator, participantDetails, fetchParticipantDetails]);

  useEffect(() => {
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support video/audio. Please use a modern browser like Chrome, Firefox, or Edge.");
      toast.error("Browser not supported for video/audio");
      return;
    }

    // Check HTTPS requirement (except localhost)
    if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
      console.warn("LiveKit requires HTTPS for camera/microphone access (except localhost)");
    }

    if (liveClassId) {
      connectToRoom();
    }
    return () => {
      disconnectFromRoom();
    };
  }, [liveClassId]);

  const connectToRoom = useCallback(async () => {
    try {
      setError(null);
      setIsConnected(false);
      setIsConnecting(true);
      
      // Get LiveKit token from backend
      const response = await axios.get(
        `${serverUrl}/api/liveclass/${liveClassId}/livekit-token`,
        { withCredentials: true }
      );

      const { token, url, roomName, success } = response.data;

      if (!token || !url || !roomName) {
        console.error("Invalid response:", response.data);
        throw new Error("Invalid token response from server");
      }

      // Validate token format (JWT should have 3 parts)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Invalid token format - expected JWT with 3 parts, got:", tokenParts.length);
        throw new Error("Invalid token format received from server");
      }

      // Ensure URL is WebSocket format (wss://)
      const wsUrl = url.startsWith("wss://") || url.startsWith("ws://") ? url : `wss://${url.replace(/^https?:\/\//, "")}`;

      console.log("Token received from server:");
      console.log("  - Token length:", token.length);
      console.log("  - Token parts:", tokenParts.length);
      console.log("  - URL:", wsUrl);
      console.log("  - Room:", roomName);
      console.log("  - Success:", success);
      console.log("  - Token preview:", token.substring(0, 50) + "...");

      // Create and connect to room
      const newRoom = new Room({
        // Configure room options
        adaptiveStream: true,
        dynacast: true,
      });
      
      newRoom.on(RoomEvent.Connected, () => {
        console.log("Connected to LiveKit room");
        setIsConnected(true);
        toast.success("Connected to live class!");
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        console.log("Disconnected from LiveKit room:", reason);
        setIsConnected(false);
        if (reason) {
          toast.warning(`Disconnected: ${reason}`);
        } else {
          toast.info("Disconnected from live class");
        }
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        console.log("Reconnecting to LiveKit room...");
        toast.info("Reconnecting...");
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        console.log("Reconnected to LiveKit room");
        toast.success("Reconnected!");
      });

      newRoom.on(RoomEvent.ParticipantConnected, async (participant) => {
        console.log("Participant connected:", participant.identity);
        // Fetch participant details if educator
        if (isEducator) {
          await fetchParticipantDetails(participant.identity);
        }
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("Participant disconnected:", participant.identity);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("Track subscribed:", track.kind, participant.identity);
        if (track.kind === Track.Kind.Audio) {
          // Auto-play audio tracks
          if (track.attach) {
            const audioElement = new Audio();
            audioElement.autoplay = true;
            track.attach(audioElement);
          }
        }
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, participant) => {
        console.log("Track unsubscribed:", track.kind, participant.identity);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log("Track published:", publication.kind, participant.identity);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnpublished, (publication, participant) => {
        console.log("Track unpublished:", publication.kind, participant.identity);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
        console.log("Local track published:", publication.kind);
        if (publication.track && publication.kind === Track.Kind.Video) {
          setTimeout(() => {
            if (localVideoRef.current && publication.track) {
              publication.track.attach(localVideoRef.current);
            }
          }, 100);
        }
      });

      newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          if (payload instanceof Uint8Array) {
            const message = JSON.parse(new TextDecoder().decode(payload));
            if (message.type === "chat") {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  sender: participant?.name || participant?.identity || "Unknown",
                  message: message.text,
                  timestamp: new Date(),
                },
              ]);
            }
          }
        } catch (error) {
          console.error("Error parsing data message:", error);
        }
      });

      newRoom.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log("Connection quality changed:", quality, participant?.identity);
      });

      newRoom.on(RoomEvent.MediaDevicesChanged, () => {
        console.log("Media devices changed");
        updateParticipants(newRoom);
      });

      // Additional token validation
      if (!token || typeof token !== 'string' || token.length < 10) {
        console.error("Token validation failed:", { 
          hasToken: !!token, 
          type: typeof token, 
          length: token?.length 
        });
        throw new Error("Invalid token received from server");
      }

      // Connect to room first (without requiring camera/mic)
      try {
        console.log("Attempting to connect to LiveKit:");
        console.log("  - URL:", wsUrl);
        console.log("  - Room:", roomName);
        console.log("  - Token length:", token.length);
        console.log("  - Token preview:", token.substring(0, 50) + "...");
        
        await newRoom.connect(wsUrl, token, {
          autoSubscribe: true,
        });
        setRoom(newRoom);
        setIsConnecting(false);
        console.log("✅ Room connected successfully to:", roomName);
      } catch (connectError) {
        console.error("LiveKit connection error:", connectError);
        setIsConnecting(false);
        
        // Provide specific error messages
        if (connectError.message && connectError.message.includes("authorization")) {
          throw new Error("Invalid authorization token. Please check your LiveKit API credentials.");
        } else if (connectError.message && connectError.message.includes("network")) {
          throw new Error("Network error. Please check your internet connection and LiveKit server URL.");
        } else {
          throw new Error(`Connection failed: ${connectError.message || "Unknown error"}`);
        }
      }

      // Enable camera and microphone for ALL participants (educators and students)
      // This ensures everyone can see and be seen
      // Request permissions first, then enable
      try {
        // Request camera permission
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach(track => track.stop()); // Stop test stream
        
        await newRoom.localParticipant.setCameraEnabled(true);
        setIsVideoEnabled(true);
        console.log("✅ Camera enabled for", isEducator ? "educator" : "student");
      } catch (camError) {
        console.warn("Failed to enable camera:", camError);
        if (camError.name === "NotAllowedError" || camError.name === "PermissionDeniedError") {
          toast.warning("Camera permission denied. Please allow camera access.");
        } else {
          toast.warning("Camera access denied or unavailable. You can still participate.");
        }
        setIsVideoEnabled(false);
      }

      try {
        // Request microphone permission
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop()); // Stop test stream
        
        await newRoom.localParticipant.setMicrophoneEnabled(true);
        setIsAudioEnabled(true);
        console.log("✅ Microphone enabled for", isEducator ? "educator" : "student");
      } catch (micError) {
        console.warn("Failed to enable microphone:", micError);
        if (micError.name === "NotAllowedError" || micError.name === "PermissionDeniedError") {
          toast.warning("Microphone permission denied. Please allow microphone access.");
        } else {
          toast.warning("Microphone access denied or unavailable. You can still participate.");
        }
        setIsAudioEnabled(false);
      }

      updateParticipants(newRoom);
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
      setIsConnecting(false);
      
      let errorMessage = error.response?.data?.message || error.message || "Failed to connect to live class";
      
      // Check for specific LiveKit errors
      if (errorMessage.includes("authorization") || errorMessage.includes("invalid") && errorMessage.includes("token")) {
        errorMessage = "Invalid authorization token. The LiveKit API credentials may be incorrect. Please contact the administrator.";
        console.error("[LiveKit] Authorization error - This usually means:");
        console.error("  1. LIVEKIT_API_KEY and LIVEKIT_API_SECRET don't match");
        console.error("  2. The API credentials are incorrect");
        console.error("  3. The token format is invalid");
      } else if (errorMessage.includes("LIVEKIT_API_SECRET")) {
        errorMessage = "Server configuration error: LiveKit API secret is missing. Please contact administrator.";
      } else if (errorMessage.includes("not currently active")) {
        errorMessage = "The live class has not started yet. Please wait for the educator to start it.";
      } else if (errorMessage.includes("enrolled")) {
        errorMessage = "You must be enrolled in the course to join this live class.";
      } else if (errorMessage.includes("Network") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to LiveKit server. Please check your internet connection and try again.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [liveClassId, isEducator, fetchParticipantDetails, updateParticipants]);

  const enableCamera = async () => {
    if (!room) return;
    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      await room.localParticipant.setCameraEnabled(true);
      setIsVideoEnabled(true);
      toast.success("Camera enabled");
    } catch (error) {
      console.error("Failed to enable camera:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No camera found on your device.");
      } else {
        toast.error("Failed to enable camera: " + error.message);
      }
      setIsVideoEnabled(false);
    }
  };

  const disableCamera = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(false);
      setIsVideoEnabled(false);
    } catch (error) {
      console.error("Failed to disable camera:", error);
    }
  };

  const enableMicrophone = async () => {
    if (!room) return;
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsAudioEnabled(true);
      toast.success("Microphone enabled");
    } catch (error) {
      console.error("Failed to enable microphone:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No microphone found on your device.");
      } else {
        toast.error("Failed to enable microphone: " + error.message);
      }
      setIsAudioEnabled(false);
    }
  };

  const disableMicrophone = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(false);
      setIsAudioEnabled(false);
    } catch (error) {
      console.error("Failed to disable microphone:", error);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      if (isScreenSharing) {
        await room.localParticipant.setScreenShareEnabled(false);
        setIsScreenSharing(false);
        toast.info("Screen sharing stopped");
      } else {
        // Request screen share permission
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        await room.localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
        
        // Handle when user stops sharing from browser
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          room.localParticipant.setScreenShareEnabled(false);
          setIsScreenSharing(false);
        });
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Screen share permission denied.");
      } else {
        toast.error("Failed to toggle screen share: " + error.message);
      }
      setIsScreenSharing(false);
    }
  };

  const sendChatMessage = () => {
    if (!room || !chatInput.trim()) return;
    
    try {
      const message = {
        type: "chat",
        text: chatInput.trim(),
      };
      const data = new TextEncoder().encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "You",
          message: chatInput.trim(),
          timestamp: new Date(),
        },
      ]);
      setChatInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const disconnectFromRoom = useCallback(async () => {
    if (room) {
      room.localParticipant.tracks.forEach((publication) => {
        publication.track?.stop();
      });
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
    }
  }, [room]);

  const handleClose = () => {
    disconnectFromRoom();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-3 sm:p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h2 className="text-base sm:text-xl font-bold">Live Class</h2>
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm">{isConnected ? "Connected" : "Connecting..."}</span>
          </div>
          <span className="text-xs sm:text-sm text-gray-400">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </span>
          {isEducator && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Show participants list"
            >
              <FaUsers className="w-4 h-4" />
              <span className="text-sm">Participants</span>
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-2 sm:p-4 overflow-auto">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <p className="text-xl mb-2">Connection Error</p>
                <p className="text-gray-400">{error}</p>
                <button
                  onClick={connectToRoom}
                  className="mt-4 px-6 py-2 bg-[#3B82F6] text-black rounded-lg font-semibold hover:bg-[#2563EB]"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-xl">Connecting to live class...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              {/* Local Video */}
              {room?.localParticipant && (
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                  <video
                    ref={localVideoRef}
                    id="local-video"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
                    You {isVideoEnabled ? "" : "(Camera Off)"}
                  </div>
                </div>
              )}

              {/* Remote Participants */}
              {participants
                .filter((p) => p !== room?.localParticipant)
                .map((participant) => {
                  const screenTrack = Array.from(participant.trackPublications.values())
                    .find((pub) => pub.source === Track.Source.ScreenShare && pub.isSubscribed && pub.track)?.track;
                  const videoTrack = Array.from(participant.videoTrackPublications.values())
                    .find((pub) => pub.isSubscribed && pub.track)?.track;

                  return (
                    <div key={participant.identity} className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                      {screenTrack ? (
                        <RemoteVideoTrack
                          track={screenTrack}
                          id={`screen-${participant.identity}`}
                          className="w-full h-full object-contain"
                        />
                      ) : videoTrack ? (
                        <RemoteVideoTrack
                          track={videoTrack}
                          id={`video-${participant.identity}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <div className="text-center text-white">
                            <FaUsers className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{participant.name || participant.identity}</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
                        {participant.name || participant.identity}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Participants Sidebar (Educator only) */}
        {showParticipants && isEducator && (
          <div className="hidden lg:flex w-80 bg-gray-900 border-l border-gray-700 flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {participants.map((participant) => {
                const details = participantDetails[participant.identity] || {};
                const isLocal = participant === room?.localParticipant;
                const hasVideo = Array.from(participant.videoTrackPublications.values()).some(pub => pub.track);
                const hasAudio = Array.from(participant.audioTrackPublications.values()).some(pub => pub.track);
                
                return (
                  <div key={participant.identity} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {details.photoUrl ? (
                        <img 
                          src={details.photoUrl} 
                          alt={details.name || participant.identity}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                          {(details.name || participant.identity || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {details.name || participant.name || participant.identity}
                          {isLocal && " (You)"}
                        </p>
                        {details.email && (
                          <p className="text-gray-400 text-xs truncate">{details.email}</p>
                        )}
                        {details.role && (
                          <p className="text-gray-500 text-xs capitalize">{details.role}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hasVideo ? (
                            <FaVideo className="w-3 h-3 text-green-400" title="Camera on" />
                          ) : (
                            <FaVideoSlash className="w-3 h-3 text-gray-500" title="Camera off" />
                          )}
                          {hasAudio ? (
                            <FaMicrophone className="w-3 h-3 text-green-400" title="Microphone on" />
                          ) : (
                            <FaMicrophoneSlash className="w-3 h-3 text-gray-500" title="Microphone off" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <div className="hidden md:flex w-80 bg-gray-900 border-l border-gray-700 flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-semibold text-[#3B82F6]">{msg.sender}:</span>
                  <span className="text-gray-300 ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                disabled={!isConnected}
              />
              <button
                onClick={sendChatMessage}
                disabled={!isConnected || !chatInput.trim()}
                className="px-4 py-2 bg-[#3B82F6] text-black rounded-lg font-semibold hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isConnected && (
        <div className="bg-black border-t border-gray-700 p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {/* Camera control - available for all participants */}
          <button
            onClick={isVideoEnabled ? disableCamera : enableCamera}
            className={`p-3 rounded-lg transition-colors ${
              isVideoEnabled ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-700"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <FaVideo className="w-5 h-5" /> : <FaVideoSlash className="w-5 h-5" />}
          </button>
          
          {/* Microphone control - available for all participants */}
          <button
            onClick={isAudioEnabled ? disableMicrophone : enableMicrophone}
            className={`p-3 rounded-lg transition-colors ${
              isAudioEnabled ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-700"
            }`}
            title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
          >
            {isAudioEnabled ? <FaMicrophone className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
          </button>
          {isEducator && (
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-lg transition-colors ${
                isScreenSharing ? "bg-[#3B82F6] text-black hover:bg-[#2563EB]" : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
              title="Share screen"
            >
              <FaDesktop className="w-5 h-5" />
            </button>
          )}
          {!showChat && (
            <button
              onClick={() => setShowChat(true)}
              className="p-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              title="Show chat"
            >
              <FaComments className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveKitPlayer;

