"use client";

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  token: string;
  serverUrl: string;
  isHost: boolean;
  roomId: string;
}

function LiveContent({ isHost }: { isHost: boolean }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const room = useRoomContext();
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    if (!room) return;
    const update = () => setViewerCount(room.numParticipants);
    room.on("participantConnected", update);
    room.on("participantDisconnected", update);
    update();
    return () => {
      room.off("participantConnected", update);
      room.off("participantDisconnected", update);
    };
  }, [room]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        {tracks.map((track) => (
          <VideoTrack
            key={track.participant.identity + track.source}
            trackRef={track}
            className="h-full w-full object-cover"
          />
        ))}
        {tracks.length === 0 && (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <p className="text-white/50">Waiting for host on DayOff...</p>
          </div>
        )}
      </div>
      <RoomAudioRenderer />
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold">LIVE</span>
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-sm">
            <Users size={14} />
            <span>{viewerCount}</span>
          </div>
        </div>
        <Link href="/" className="rounded-full bg-black/40 p-2"><X size={20} /></Link>
      </div>
      {isHost && (
        <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2">
          <p className="rounded-full bg-black/50 px-4 py-2 text-sm">You are live on DayOff</p>
        </div>
      )}
    </div>
  );
}

export function LivePlayer({ token, serverUrl, isHost }: Props) {
  if (!serverUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 text-white/50">
        Add NEXT_PUBLIC_LIVEKIT_URL to .env.local
      </div>
    );
  }
  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect={true} video={isHost} audio={isHost} className="h-full w-full">
      <LiveContent isHost={isHost} />
    </LiveKitRoom>
  );
}
