import React, { useState } from "react";
import BibleReader from "./components/BibleReader";
import PastorChat from "./components/PastorChat";

export default function App() {
  const [selectedVerse, setSelectedVerse] = useState<{ reference: string; text: string } | null>(null);
  const [navigateTo, setNavigateTo] = useState<{ book: string; chapter: number; verse: number } | null>(null);

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      <header className="bg-stone-800 text-white px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <span className="text-2xl">✝</span>
        <div>
          <h1 className="text-xl font-semibold tracking-wide">my-pastor-ai</h1>
          <p className="text-stone-400 text-xs">Your personal Bible companion</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-stone-200 overflow-y-auto">
          <BibleReader onVerseSelect={setSelectedVerse} navigateTo={navigateTo} />
        </div>
        <div className="w-1/2 flex flex-col overflow-hidden">
          <PastorChat selectedVerse={selectedVerse} onVerseClear={() => setSelectedVerse(null)} onNavigate={setNavigateTo} />
        </div>
      </div>
    </div>
  );
}
