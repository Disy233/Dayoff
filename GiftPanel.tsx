"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const GIFTS = [
  { id: 1, name: "Rose", cost: 1, emoji: "🌹" },
  { id: 2, name: "Heart", cost: 5, emoji: "❤️" },
  { id: 3, name: "Fire", cost: 10, emoji: "🔥" },
  { id: 4, name: "Galaxy", cost: 50, emoji: "🌌" },
  { id: 5, name: "Lion", cost: 100, emoji: "🦁" },
  { id: 6, name: "Rocket", cost: 500, emoji: "🚀" },
  { id: 7, name: "Crown", cost: 1000, emoji: "👑" },
];

export function GiftPanel({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState<{ id: number; emoji: string }[]>([]);
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const sendGift = async (gift: (typeof GIFTS)[0]) => {
    if (sending) return;
    setSending(true);

    // Optimistic animation
    const animId = Date.now();
    setFloating((prev) => [...prev, { id: animId, emoji: gift.emoji }]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== animId));
    }, 2000);

    try {
      // Record gift in Supabase (requires auth)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_gifts").insert({
          room_id: roomId,
          sender_id: user.id,
          gift_id: gift.id,
          coins_spent: gift.cost,
          quantity: 1,
        });
      }
      // Also publish via LiveKit data channel in production
    } catch (err) {
      console.error("Gift send error:", err);
    } finally {
      setSending(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none absolute bottom-40 right-8 z-40 flex flex-col items-end gap-2">
        {floating.map((f) => (
          <span key={f.id} className="gift-animation text-4xl">{f.emoji}</span>
        ))}
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="absolute bottom-28 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 shadow-lg"
      >
        <Gift size={22} className="text-white" />
      </button>

      {open && (
        <div className="absolute bottom-44 right-4 z-40 w-56 rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-white/60">Send a gift</p>
          <div className="grid grid-cols-4 gap-2">
            {GIFTS.map((g) => (
              <button
                key={g.id}
                onClick={() => sendGift(g)}
                disabled={sending}
                className="flex flex-col items-center rounded-lg bg-white/5 p-2 hover:bg-white/10 disabled:opacity-50"
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-[10px] text-yellow-300">{g.cost}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
