"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, AlertTriangle, User, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [crisisWarning, setCrisisWarning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchHistory = async () => {
    try { const res = await api.get("/chat/history"); setMessages(res.data.data); }
    catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput(""); setLoading(true); setCrisisWarning(false);
    setMessages((prev) => [...prev, { role: "USER", content: userMessage, id: "temp" }]);
    try {
      const res = await api.post("/chat", { content: userMessage });
      const aiMessage = res.data.data;
      setMessages((prev) => [...prev.filter((m) => m.id !== "temp"), { role: "USER", content: userMessage, id: Date.now() }, aiMessage]);
      if (res.data.crisisDetected) setCrisisWarning(true);
    } catch (err) { toast.error("Failed to send message"); setMessages((prev) => prev.filter((m) => m.id !== "temp")); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Brain className="text-wellness-focus" /> AI Wellness Coach</h1>
        <p className="text-muted-foreground mt-1">Talk through your thoughts. I am here to listen and support.</p>
      </div>

      <AnimatePresence>
        {crisisWarning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-4 rounded-xl bg-wellness-stress/10 border border-wellness-stress/30 flex items-start gap-3">
            <AlertTriangle className="text-wellness-stress shrink-0" size={20} />
            <div>
              <p className="font-medium text-wellness-stress text-sm">Crisis Resources</p>
              <p className="text-sm text-wellness-stress/80 mt-1">
                If you are in immediate danger, please call your local emergency number.<br />
                <strong>US:</strong> 988 Suicide & Crisis Lifeline | <strong>Text:</strong> HOME to 741741<br />
                <strong>International:</strong> iasp.info/resources/Crisis_Centres
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Brain size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-1">Share how you are feeling, ask for advice, or just vent.</p>
              <div className="grid grid-cols-2 gap-2 mt-6">
                {["I am feeling anxious today", "Help me plan my week", "I had a great day!", "Tips for better sleep"].map((suggestion) => (
                  <button key={suggestion} onClick={() => setInput(suggestion)} className="px-4 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors text-left">{suggestion}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <motion.div key={msg.id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ASSISTANT" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center shrink-0"><Brain size={16} className="text-white" /></div>}
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "USER" ? "bg-primary-500/20 text-foreground rounded-br-sm" : "bg-white/5 text-foreground rounded-bl-sm"}`}>
                {msg.role === "ASSISTANT" ? <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : <p className="text-sm">{msg.content}</p>}
              </div>
              {msg.role === "USER" && <div className="w-8 h-8 rounded-full bg-wellness-focus/20 flex items-center justify-center shrink-0"><User size={16} className="text-wellness-focus" /></div>}
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center"><Loader2 size={16} className="text-white animate-spin" /></div>
              <div className="p-4 rounded-2xl bg-white/5 rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." rows={1} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 resize-none max-h-32" />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="px-4 py-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"><Send size={18} /></button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">MindSync AI provides supportive guidance only. Not a substitute for professional medical advice.</p>
        </div>
      </div>
    </div>
  );
}
