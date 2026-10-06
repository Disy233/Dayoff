"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { GiftPanel } from "@/components/gifts/GiftPanel";
import { Loader2 } from "lucide-react";

export default function LiveRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const isHost = searchParams.get("host") === "true";
  const initialToken = searchParams.get("token");

  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(!initialToken);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialToken) return;
    async function fetchToken() {
      try {
        const res = await fetch(`/api/live/${roomId}/token`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get token");
        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, [roomId, initialToken]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-pink-500" size={40} />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="mb-4 text-red-400">{error || "Unable to join live room"}</p>
        <a href="/" className="text-pink-400 underline">Back to DayOff</a>
      </div>
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  return (
    <div className="relative h-screen w-full bg-black">
      <LivePlayer token={token} serverUrl={serverUrl} isHost={isHost} roomId={roomId} />
      <LiveChat roomId={roomId} />
      {!isHost && <GiftPanel roomId={roomId} />}
    </div>
  );
}
