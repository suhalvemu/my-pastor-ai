import React, { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

interface Message {
  role: "user" | "pastor";
  content: string;
}

const BOOK_ALIASES: Record<string, string> = {
  "genesis": "Genesis", "exodus": "Exodus", "leviticus": "Leviticus", "numbers": "Numbers",
  "deuteronomy": "Deuteronomy", "joshua": "Joshua", "judges": "Judges", "ruth": "Ruth",
  "1 samuel": "1 Samuel", "2 samuel": "2 Samuel", "1 kings": "1 Kings", "2 kings": "2 Kings",
  "1 chronicles": "1 Chronicles", "2 chronicles": "2 Chronicles", "ezra": "Ezra",
  "nehemiah": "Nehemiah", "esther": "Esther", "job": "Job", "psalms": "Psalms", "psalm": "Psalms",
  "proverbs": "Proverbs", "ecclesiastes": "Ecclesiastes", "song of solomon": "Song of Solomon",
  "isaiah": "Isaiah", "jeremiah": "Jeremiah", "lamentations": "Lamentations", "ezekiel": "Ezekiel",
  "daniel": "Daniel", "hosea": "Hosea", "joel": "Joel", "amos": "Amos", "obadiah": "Obadiah",
  "jonah": "Jonah", "micah": "Micah", "nahum": "Nahum", "habakkuk": "Habakkuk",
  "zephaniah": "Zephaniah", "haggai": "Haggai", "zechariah": "Zechariah", "malachi": "Malachi",
  "matthew": "Matthew", "mark": "Mark", "luke": "Luke", "john": "John", "acts": "Acts",
  "romans": "Romans", "1 corinthians": "1 Corinthians", "2 corinthians": "2 Corinthians",
  "galatians": "Galatians", "ephesians": "Ephesians", "philippians": "Philippians",
  "colossians": "Colossians", "1 thessalonians": "1 Thessalonians", "2 thessalonians": "2 Thessalonians",
  "1 timothy": "1 Timothy", "2 timothy": "2 Timothy", "titus": "Titus", "philemon": "Philemon",
  "hebrews": "Hebrews", "james": "James", "1 peter": "1 Peter", "2 peter": "2 Peter",
  "1 john": "1 John", "2 john": "2 John", "3 john": "3 John", "jude": "Jude", "revelation": "Revelation",
};

function extractFirstScriptureRef(text: string): { book: string; chapter: number; verse: number } | null {
  const pattern = /\b((?:\d\s)?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+):(\d+)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const bookRaw = match[1].toLowerCase().trim();
    const chapter = parseInt(match[2]);
    const verse = parseInt(match[3]);
    const book = BOOK_ALIASES[bookRaw];
    if (book) return { book, chapter, verse };
  }
  return null;
}

interface Props {
  selectedVerse: { reference: string; text: string } | null;
  onVerseClear: () => void;
  onNavigate: (ref: { book: string; chapter: number; verse: number } | null) => void;
}

export default function PastorChat({ selectedVerse, onVerseClear, onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "pastor",
      content: "Peace be with you. I'm here to help you understand Scripture and apply God's Word to your life. You can ask me anything, select a verse from the Bible reader, or share what's on your heart.",
    },
  ]);
  const [input, setInput] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedVerse) {
      setInput(`Please explain ${selectedVerse.reference}: "${selectedVerse.text}"`);
    }
  }, [selectedVerse]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "pastor" ? "model" : "user",
        content: m.content,
      }));

      const fullMessage = situation
        ? `Context about my life situation: ${situation}\n\n${userMessage}`
        : userMessage;

      const res = await fetch(`${API}/pastor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessage, conversation_history: history }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "pastor", content: data.response }]);
      const ref = extractFirstScriptureRef(data.response);
      if (ref) onNavigate(ref);
      if (selectedVerse) onVerseClear();
    } catch {
      setMessages((prev) => [...prev, { role: "pastor", content: "Sorry, I couldn't connect. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Your situation (optional)</label>
        <input
          type="text"
          placeholder="e.g. I'm facing a difficult decision at work..."
          className="w-full mt-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "pastor" && (
              <div className="w-8 h-8 rounded-full bg-stone-700 text-white flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">✝</div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-stone-700 text-white rounded-tr-sm"
                  : "bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-stone-700 text-white flex items-center justify-center text-sm mr-2">✝</div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {selectedVerse && (
        <div className="mx-5 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-stone-600">
          <span className="font-semibold text-amber-700">{selectedVerse.reference}</span> selected
          <button onClick={onVerseClear} className="ml-2 text-stone-400 hover:text-stone-600">✕</button>
        </div>
      )}

      <div className="px-5 py-4 border-t border-stone-200 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Ask your pastor anything..."
          className="flex-1 border border-stone-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-stone-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
