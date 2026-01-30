import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "./atoms/Modal";

// Icon components using inline SVG
const Settings = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Globe = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const LogOut = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Users = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v12z" />
  </svg>
);

const Crown = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm2.7-2h8.6l.9-4.4L14 12l-2-4-2 4-3.2-2.4L7.7 14z"/>
  </svg>
);

const Info = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SortAsc = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const MessageCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Eye = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Bug = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0H7" />
  </svg>
);

const Code = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const Zap = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 0L11 8H4L12 16L14 8H21L13 0Z"/>
  </svg>
);

const X = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- Helper data (for mock content only) ---
const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

type Suit = typeof SUITS[number];
type Rank = typeof RANKS[number];

// --- Mock scoring helpers for meld UI ---
const RANK_POINTS: Record<Rank, number> = {
  A: 15,
  "2": 10,
  "3": 5,
  "4": 5,
  "5": 5,
  "6": 5,
  "7": 5,
  "8": 10,
  "9": 10,
  "10": 10,
  J: 10,
  Q: 10,
  K: 10,
};
const scoreSet = (set: { rank: Rank }[]) => set.reduce((sum, c) => sum + RANK_POINTS[c.rank], 0);
const scoreAll = (sets: Array<{ rank: Rank }[]>) => sets.reduce((s, set) => s + scoreSet(set), 0);

function makeCard(id: number) {
  const suit: Suit = SUITS[id % 4];
  const rank: Rank = RANKS[id % 13];
  return { id, suit, rank };
}

function Card({ suit, rank, small = false, faceDown = false, showCorners = true }: { suit: Suit; rank: Rank; small?: boolean; faceDown?: boolean; showCorners?: boolean }) {
  const isRed = suit === "♥" || suit === "♦";
  const base = small ? "w-10 h-14" : "w-14 h-20 md:w-16 md:h-24";
  return (
    <div
      className={[
        "rounded-xl shadow-sm border flex items-center justify-center select-none",
        faceDown ? "bg-slate-400 border-slate-500" : "bg-white border-slate-300",
        base,
      ].join(" ")}
    >
      {faceDown ? (
        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#cbd5e1_0,#cbd5e1_8px,#94a3b8_8px,#94a3b8_16px)] rounded-xl" />
      ) : (
        <div className={"text-center w-full h-full p-1 flex flex-col justify-between"}>
          {showCorners && (
            <div className={["text-xs md:text-sm", isRed ? "text-red-600" : "text-slate-800"].join(" ")}>{rank}</div>
          )}
          <div className={["text-lg md:text-2xl font-semibold", isRed ? "text-red-600" : "text-slate-800"].join(" ")}>{suit}</div>
          {showCorners && (
            <div className={["text-xs md:text-sm self-end", isRed ? "text-red-600" : "text-slate-800"].join(" ")}>{rank}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StackPile({ label, count, topCard, faceDown = false, onClick }: { label: string; count: number; topCard?: { suit: Suit; rank: Rank }; faceDown?: boolean; onClick?: () => void }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={onClick}>
      <div className="relative">
        {/* stack illusion */}
        <div className="absolute -top-1 -left-1 rotate-[-3deg]">
          <Card suit={"♠"} rank={"A"} faceDown small />
        </div>
        <div className="absolute -top-0.5 -left-0.5 rotate-[2deg]">
          <Card suit={"♠"} rank={"A"} faceDown small />
        </div>
        <div className="relative">
          {topCard ? (
            <Card suit={topCard.suit} rank={topCard.rank} small={false} faceDown={faceDown} />
          ) : (
            <Card suit={"♠"} rank={"A"} faceDown={faceDown} />
          )}
        </div>
      </div>
      <div className="text-xs md:text-sm text-slate-300 flex items-center gap-1">
        {label} · {count}
        {onClick && <Eye className="w-3 h-3" />}
      </div>
    </div>
  );
}

function PlayerBadge({ name, active = false, team = 1, cardCount = 11, vertical = false }: { name: string; active?: boolean; team?: 1 | 2; cardCount?: number; vertical?: boolean }) {
  const color = team === 1 ? "bg-emerald-600" : "bg-indigo-600";

  if (vertical) {
    return (
      <div
        className={[
          // wider vertical card with better readability
          "relative shrink-0 w-12 md:w-14 min-h-32 md:min-h-40",
          "flex flex-col items-center justify-between rounded-lg text-white border border-white/20",
          "px-2 py-3 gap-1",
          color,
          active ? "ring-2 ring-yellow-400 shadow-lg" : "shadow-md",
        ].join(" ")}
      >
        {/* Player icon at the top */}
        <Users className="w-4 h-4 flex-shrink-0" />
        
        {/* Name - horizontal text in a small box */}
        <div className="bg-black/30 px-1.5 py-1 rounded text-[10px] md:text-xs font-medium text-center leading-tight border border-white/20 w-full">
          {name.length > 4 ? name.slice(0, 4) : name}
        </div>
        
        {/* Card count with icon */}
        <div className="bg-black/40 px-1.5 py-1 rounded-md text-[11px] md:text-xs font-bold text-center leading-none border border-white/30 w-full flex items-center justify-center gap-1">
          <span className="text-yellow-300">🂠</span>
          <span>{cardCount}</span>
        </div>
        
        {/* Active indicator */}
        {active && (
          <div className="absolute -top-1 -right-1">
            <Crown className="w-3 h-3 text-yellow-400 bg-yellow-400/20 rounded-full p-0.5" />
          </div>
        )}
      </div>
    );
  }

  // default horizontal chip for top/bottom players
  return (
    <div className={["px-2 py-1 rounded-xl text-xs md:text-sm flex items-center gap-1 text-white border border-slate-700", color, active ? "ring-2 ring-yellow-400" : ""].join(" ")}>
      <Users className="w-3 h-3" />
      <span className="font-medium">{name}</span>
      <span className="ml-1 bg-black/20 px-1.5 py-0.5 rounded-md">🂠 {cardCount}</span>
      {active && <Crown className="w-3 h-3" />}
    </div>
  );
}

function MeldStrip({ title, cards }: { title: string; cards: Array<{ suit: Suit; rank: Rank }[]> }) {
  const total = scoreAll(cards);
  return (
    <div className="w-full rounded-2xl bg-emerald-900/30 border border-emerald-800/40 p-2 md:p-3 flex flex-col gap-2">
      <div className="text-xs md:text-sm text-emerald-50/90 font-medium flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2"><Info className="w-3 h-3" /> {title}</div>
        <div className="text-[11px] md:text-xs px-2 py-0.5 rounded-lg border border-emerald-700 bg-emerald-950/50">Total: {total}</div>
      </div>
      <div className="flex flex-col md:flex-row md:flex-wrap gap-2">
        {cards.map((set, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              {set.map((c, j) => (
                <Card key={`${i}-${j}`} suit={c.suit} rank={c.rank} small showCorners={false} />
              ))}
            </div>
            <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900/60">{scoreSet(set)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamScoreboard({ team1 = 620, team2 = 540 }: { team1?: number; team2?: number }) {
  return (
    <div className="mx-auto max-w-md w-full">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border border-emerald-700 bg-emerald-900/50 p-2">
          <div className="text-[10px] md:text-xs uppercase tracking-wide text-emerald-200/80">Team 1</div>
          <div className="text-xl md:text-2xl font-semibold">{team1}</div>
        </div>
        <div className="rounded-2xl border border-indigo-700 bg-indigo-900/50 p-2">
          <div className="text-[10px] md:text-xs uppercase tracking-wide text-indigo-200/80">Team 2</div>
          <div className="text-xl md:text-2xl font-semibold">{team2}</div>
        </div>
      </div>
    </div>
  );
}

export default function BuracoMockup() {
  const [lang, setLang] = useState("EN");
  const [adminOpen, setAdminOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [discardPickerOpen, setDiscardPickerOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [cheatMenuOpen, setCheatMenuOpen] = useState(false);
  const [cheatsEnabled, setCheatsEnabled] = useState({
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
    allowViewAllHands: false
  });
  const [keySequence, setKeySequence] = useState('');

  const myHand = useMemo(() => Array.from({ length: 11 }, (_, i) => makeCard(i + 10)), []);
  const discardTop = makeCard(37);
  
  // Mock discard pile cards
  const discardPile = useMemo(() => Array.from({ length: 8 }, (_, i) => makeCard(i + 30)), []);

  const meldsTeam1 = [
    [makeCard(0), makeCard(4), makeCard(8), makeCard(12)],
    [makeCard(1), makeCard(2), makeCard(3), makeCard(4)],
  ];
  const meldsTeam2 = [[makeCard(20), makeCard(24), makeCard(28)]];

  // Keyboard cheat code handler
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't trigger in input fields
      
      const newSequence = keySequence + e.key.toLowerCase();
      setKeySequence(newSequence);

      // Check for cheat codes
      if (newSequence.includes('iddqd')) {
        setCheatsEnabled({
          allowPlayAllCards: true,
          allowMultipleDiscard: true,
          allowDiscardDrawnCards: true,
          allowViewAllHands: true
        });
        setCheatMenuOpen(true);
        alert('🎮 IDDQD: God mode activated! All cheats enabled.');
        setKeySequence('');
      } else if (newSequence.includes('cardy')) {
        setCheatsEnabled(prev => ({...prev, allowViewAllHands: !prev.allowViewAllHands}));
        alert('👁️ CARDY: View all hands toggled!');
        setKeySequence('');
      } else if (newSequence.includes('winme')) {
        alert('🏆 WINME: Auto-win activated! (Demo only)');
        setKeySequence('');
      } else if (newSequence.includes('speedx')) {
        alert('⚡ SPEEDX: Fast animations activated! (Demo only)');
        setKeySequence('');
      } else if (newSequence.includes('reset')) {
        setCheatsEnabled({
          allowPlayAllCards: false,
          allowMultipleDiscard: false,
          allowDiscardDrawnCards: false,
          allowViewAllHands: false
        });
        alert('🔄 RESET: All cheats disabled!');
        setKeySequence('');
      } else if (newSequence.length > 10) {
        setKeySequence(''); // Reset if sequence gets too long
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 flex items-center gap-2 md:gap-4">
          <div className="text-lg md:text-xl font-semibold tracking-wide">Buraco Online</div>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button onClick={() => setLang(lang === "EN" ? "PT" : "EN")} className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800">
                <Globe className="w-4 h-4" />
                <span className="text-xs">{lang === "EN" ? "English" : "Português"}</span>
              </button>
            </div>

            <button onClick={() => setChatOpen(!chatOpen)} className="px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Chat</span>
            </button>

            <button onClick={() => setCheatMenuOpen(!cheatMenuOpen)} className={`px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1 ${cheatMenuOpen ? 'bg-yellow-600/20 border-yellow-500' : ''}`}>
              <Zap className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Cheat</span>
            </button>

            <button onClick={() => setDebugOpen(!debugOpen)} className={`px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1 ${debugOpen ? 'bg-blue-600/20 border-blue-500' : ''}`}>
              <Bug className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Debug</span>
            </button>

            <button onClick={() => setAdminOpen((v) => !v)} className="px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Admin</span>
            </button>

            <button onClick={() => window.location.href = '/'} className="px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1">
              <LogOut className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin drawer */}
      {adminOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Admin Panel</div>
            <button onClick={() => setAdminOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Game Settings */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase">Game Settings</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>Allow spectators</span><input type="checkbox" defaultChecked className="accent-emerald-500"/></div>
                <div className="flex items-center justify-between"><span>Allow undo last discard</span><input type="checkbox" className="accent-emerald-500"/></div>
                <div className="flex items-center justify-between"><span>Turn timer (sec)</span><input type="number" defaultValue={45} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 w-20"/></div>
                <div className="flex items-center justify-between"><span>Target score</span><input type="number" defaultValue={2000} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 w-24"/></div>
              </div>
            </div>
            
            {/* User Management */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase">User Management</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                  <span>You 👑</span>
                  <span className="text-emerald-400">Admin</span>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                  <span>Liam</span>
                  <button className="text-blue-400 hover:text-blue-300">Make Admin</button>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                  <span>Ava</span>
                  <button className="text-blue-400 hover:text-blue-300">Make Admin</button>
                </div>
              </div>
            </div>
            
            {/* Game Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase">Game Actions</h4>
              <div className="space-y-1">
                <button className="w-full bg-red-600/20 border border-red-500 text-red-400 py-2 px-3 rounded text-xs hover:bg-red-600/30">
                  End Game
                </button>
                <button className="w-full bg-yellow-600/20 border border-yellow-500 text-yellow-400 py-2 px-3 rounded text-xs hover:bg-yellow-600/30">
                  Reset Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {debugOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-blue-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-blue-400">Debug Panel</div>
            <button onClick={() => setDebugOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="text-blue-300 font-medium">Connection Info</div>
              <div className="bg-slate-800/50 p-2 rounded font-mono">
                <div>URL: {window.location.href}</div>
                <div>Host: {window.location.hostname}</div>
                <div>Protocol: {window.location.protocol}</div>
                <div>Status: Connected</div>
                <div>Mobile: {/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'YES' : 'NO'}</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-blue-300 font-medium">Game State</div>
              <div className="bg-slate-800/50 p-2 rounded font-mono">
                <div>Players: 4/4</div>
                <div>Turn: Liam</div>
                <div>Round: 1</div>
                <div>Deck: 46 cards</div>
                <div>Discard: 12 cards</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-blue-300 font-medium">Performance</div>
              <div className="bg-slate-800/50 p-2 rounded font-mono">
                <div>FPS: 60</div>
                <div>Memory: 23.4 MB</div>
                <div>Load Time: 95ms</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cheat Menu */}
      {cheatMenuOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-yellow-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-yellow-400">Cheat Menu</div>
            <button onClick={() => setCheatMenuOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Cheat Codes */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-yellow-300 uppercase">Cheat Codes</h4>
              <div className="space-y-1">
                <button className="w-full bg-yellow-600/20 border border-yellow-500 text-yellow-400 py-2 px-3 rounded text-xs hover:bg-yellow-600/30">
                  iddqd - God Mode
                </button>
                <button className="w-full bg-yellow-600/20 border border-yellow-500 text-yellow-400 py-2 px-3 rounded text-xs hover:bg-yellow-600/30">
                  cardy - View All Hands
                </button>
                <button className="w-full bg-yellow-600/20 border border-yellow-500 text-yellow-400 py-2 px-3 rounded text-xs hover:bg-yellow-600/30">
                  winme - Auto Win
                </button>
                <button className="w-full bg-yellow-600/20 border border-yellow-500 text-yellow-400 py-2 px-3 rounded text-xs hover:bg-yellow-600/30">
                  speedx - Fast Animations
                </button>
              </div>
            </div>
            
            {/* Cheat Toggles */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-yellow-300 uppercase">Game Cheats</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Allow play all cards</span>
                  <input 
                    type="checkbox" 
                    checked={cheatsEnabled.allowPlayAllCards}
                    onChange={(e) => setCheatsEnabled(prev => ({...prev, allowPlayAllCards: e.target.checked}))}
                    className="accent-yellow-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Allow multiple discard</span>
                  <input 
                    type="checkbox" 
                    checked={cheatsEnabled.allowMultipleDiscard}
                    onChange={(e) => setCheatsEnabled(prev => ({...prev, allowMultipleDiscard: e.target.checked}))}
                    className="accent-yellow-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Allow discard drawn cards</span>
                  <input 
                    type="checkbox" 
                    checked={cheatsEnabled.allowDiscardDrawnCards}
                    onChange={(e) => setCheatsEnabled(prev => ({...prev, allowDiscardDrawnCards: e.target.checked}))}
                    className="accent-yellow-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>View all hands</span>
                  <input 
                    type="checkbox" 
                    checked={cheatsEnabled.allowViewAllHands}
                    onChange={(e) => setCheatsEnabled(prev => ({...prev, allowViewAllHands: e.target.checked}))}
                    className="accent-yellow-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table area */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 grid grid-rows-[auto,1fr,auto] gap-3 md:gap-4">
        {/* Opponents row */}
        <div className="flex items-center justify-between">
          <div className="invisible md:visible md:opacity-100 opacity-0"></div>
          <div className="flex flex-col items-center gap-2">
            <PlayerBadge name="Liam" team={2} cardCount={11} />
          </div>
          <div></div>
        </div>

        {/* Center table */}
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {/* Left side player */}
          <div className="col-span-2 hidden md:flex flex-col justify-center items-center gap-2">
            <PlayerBadge name="Ava" team={1} cardCount={11} vertical />
          </div>

          {/* Center felt */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative rounded-[2rem] p-4 md:p-6 border border-emerald-900 bg-gradient-to-b from-emerald-900/70 to-emerald-950/80 shadow-inner">
              <div className="py-2 md:py-3">
                <TeamScoreboard team1={620} team2={540} />
              </div>

              <div className="flex items-center justify-center gap-10 md:gap-16 py-2 md:py-4">
                <StackPile label="Discard" count={12} topCard={discardTop} onClick={() => setDiscardPickerOpen(true)} />
                <StackPile label="Deck" count={46} faceDown />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
                <MeldStrip title="Team 1 Melds" cards={meldsTeam1} />
                <MeldStrip title="Team 2 Melds" cards={meldsTeam2} />
              </div>
            </div>
          </div>

          {/* Right side player */}
          <div className="col-span-2 hidden md:flex flex-col justify-center items-center gap-2">
            <PlayerBadge name="Zoé" team={2} cardCount={11} vertical />
          </div>
        </div>

        {/* My hand */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 md:p-3">
          <div className="flex items-center justify-center mb-2 gap-4">
            <PlayerBadge name="You" active team={1} cardCount={myHand.length} />
            <button className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs"><SortAsc className="w-3 h-3"/> Sort</button>
          </div>
          <motion.div layout className="flex gap-2 md:gap-3 flex-wrap justify-center">
            {myHand.map((c) => (
              <motion.div key={c.id} layout whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                <Card suit={c.suit} rank={c.rank} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 pb-6">
        <div className="text-[11px] md:text-sm text-slate-400 flex flex-wrap items-center gap-3">
          <span>Mockup only · No game logic</span>
          <span>•</span>
          <span>Responsive design: adjusts to resolutions</span>
          <span>•</span>
          <span>Based on existing Canastra architecture</span>
          {Object.values(cheatsEnabled).some(Boolean) && (
            <>
              <span>•</span>
              <span className="text-yellow-400 animate-pulse">⚡ Cheats Active</span>
            </>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <span className="font-medium">Game Chat</span>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-200">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-2 text-sm">
              <div className="text-emerald-400">Ava: Good luck everyone!</div>
              <div className="text-indigo-400">Liam: Let's have a great game</div>
              <div className="text-indigo-400">Zoé: 🃏 Ready to play!</div>
              <div className="text-slate-400 text-xs">[System] Game started</div>
            </div>
          </div>
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white placeholder-slate-400"
              />
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Picker Modal */}
      <Modal
        open={discardPickerOpen}
        onOpenChange={setDiscardPickerOpen}
        title="Choose Cards from Discard Pile"
        description="Select which cards to LEAVE in the discard pile. You will take the rest."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {discardPile.map((card, index) => (
              <motion.div
                key={`discard-${card.id}`}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <Card suit={card.suit} rank={card.rank} />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm text-slate-600">
            <span>Select cards to LEAVE behind</span>
            <span>Taking: 8 cards</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setDiscardPickerOpen(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={() => setDiscardPickerOpen(false)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded"
            >
              Take Cards
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}