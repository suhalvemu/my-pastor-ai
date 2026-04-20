import React, { useState, useEffect, useRef } from "react";

const API = "http://localhost:8000";

interface Verse {
  verse: number;
  text: string;
}

interface Props {
  onVerseSelect: (verse: { reference: string; text: string }) => void;
  navigateTo: { book: string; chapter: number; verse: number } | null;
}

export default function BibleReader({ onVerseSelect, navigateTo }: Props) {
  const [books, setBooks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState("John");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const verseRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

  useEffect(() => {
    fetch(`${API}/bible/books`)
      .then((r) => r.json())
      .then((d) => setBooks(d.books));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/bible/chapter?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}`)
      .then((r) => r.json())
      .then((d) => {
        setVerses(d.verses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (!navigateTo) return;
    setSelectedBook(navigateTo.book);
    setSelectedChapter(navigateTo.chapter);
    setHighlightedVerse(navigateTo.verse);
  }, [navigateTo]);

  useEffect(() => {
    if (highlightedVerse && verseRefs.current[highlightedVerse]) {
      verseRefs.current[highlightedVerse]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [verses, highlightedVerse]);

  const handleVerseClick = (v: Verse) => {
    setHighlightedVerse(v.verse);
    onVerseSelect({
      reference: `${selectedBook} ${selectedChapter}:${v.verse}`,
      text: v.text,
    });
  };

  return (
    <div className="p-5">
      <div className="flex gap-3 mb-5">
        <select
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
          value={selectedBook}
          onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
        >
          {books.map((b) => <option key={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white hover:bg-stone-100 disabled:opacity-40"
            onClick={() => setSelectedChapter((c) => Math.max(1, c - 1))}
            disabled={selectedChapter === 1}
          >←</button>
          <span className="text-sm font-medium text-stone-600 w-20 text-center">Chapter {selectedChapter}</span>
          <button
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white hover:bg-stone-100"
            onClick={() => setSelectedChapter((c) => c + 1)}
          >→</button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-stone-700 mb-4">{selectedBook} {selectedChapter}</h2>

      {loading ? (
        <div className="text-center text-stone-400 py-10">Loading...</div>
      ) : (
        <div className="space-y-2">
          {verses.map((v) => (
            <p
              key={v.verse}
              ref={(el) => { verseRefs.current[v.verse] = el; }}
              onClick={() => handleVerseClick(v)}
              className={`text-stone-700 leading-relaxed cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                highlightedVerse === v.verse
                  ? "bg-amber-100 border-l-4 border-amber-400"
                  : "hover:bg-stone-100"
              }`}
            >
              <sup className="text-amber-600 font-bold mr-1">{v.verse}</sup>
              {v.text}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-400 mt-6 text-center">Tap a verse to ask your AI Pastor about it</p>
    </div>
  );
}
