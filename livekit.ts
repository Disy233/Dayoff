import { AccessToken } from "livekit-server-sdk";

export async function createLiveToken(roomName: string, identity: string, isHost = false) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("LiveKit API key/secret missing");

  const at = new AccessToken(apiKey, apiSecret, { identity, ttl: "6h" });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  });
  return await at.toJwt();
}

export function generateRoomName(userId: string) {
  return `dayoff-live-${userId}-${Date.now()}`;
}
