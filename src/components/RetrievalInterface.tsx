"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function RetrievalInterface() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load session from sessionStorage
    useEffect(() => {
        const storedSessionId = sessionStorage.getItem('rag_session_id');
        if (storedSessionId) {
            setSessionId(storedSessionId);
            // Add initial welcome message
            setMessages([{
                role: "assistant",
                content: "Pipeline architectural parameters verified. Ready for document ingestion and high-dimensional vectorization."
            }]);
        }
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !sessionId || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: inputValue
        };

        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await fetch(`http://localhost:8000/api/v1/chat/${sessionId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: userMessage.content
                })
            });

            const data = await res.json();

            if (res.ok) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: data.response || "No response from server"
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    role: "assistant",
                    content: `Error: ${data.detail || "Failed to get response"}`
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Error: Failed to connect to server"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex-1 glass-panel flex flex-col relative z-10 border-white h-full">
            <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`size-2.5 rounded-full ${sessionId ? 'bg-[var(--nvidia-green)] active-state' : 'bg-gray-400'}`}></div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--obsidian-black)]">
                        Interface.Retrieval_v4
                    </h3>
                    {sessionId && (
                        <span className="text-[10px] text-[var(--gunmetal-gray)] font-medium">
                            • Session: {sessionId.slice(0, 8)}...
                        </span>
                    )}
                </div>
                <div className="flex gap-4">
                    <span className="material-symbols-outlined text-[var(--brushed-bronze)] cursor-pointer hover:text-[var(--obsidian-black)] transition-colors">
                        settings
                    </span>
                    <span className="material-symbols-outlined text-[var(--gunmetal-gray)] cursor-pointer hover:text-[var(--obsidian-black)] transition-colors">
                        terminal
                    </span>
                </div>
            </div>

            {!sessionId ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                        <span className="material-symbols-outlined text-6xl text-[var(--gunmetal-gray)]/30">
                            error_outline
                        </span>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--obsidian-black)] mb-2">
                                No Active Session
                            </h3>
                            <p className="text-sm text-[var(--gunmetal-gray)]">
                                Please configure your RAG pipeline in the <a href="/" className="text-[var(--brushed-bronze)] hover:underline">ROOT</a> page first.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {messages.map((message, idx) => (
                            message.role === "assistant" ? (
                                <div key={idx} className="flex gap-4 max-w-[90%]">
                                    <div className="size-10 shrink-0 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[var(--nvidia-green)] text-xl">
                                            smart_toy
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                                            System Architect
                                        </div>
                                        <div className="p-5 bg-white/60 border border-white/80 rounded-3xl rounded-tl-none text-sm leading-relaxed text-[var(--obsidian-black)] shadow-sm whitespace-pre-wrap">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={idx} className="flex gap-4 max-w-[90%] ml-auto flex-row-reverse">
                                    <div className="size-10 shrink-0 bg-[var(--brushed-bronze)] rounded-2xl shadow-sm flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-xl">
                                            person
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <div className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                                            Operator Console
                                        </div>
                                        <div className="p-5 bg-[var(--obsidian-black)] text-white rounded-3xl rounded-tr-none text-sm leading-relaxed text-left shadow-xl shadow-black/10 whitespace-pre-wrap">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 max-w-[90%]">
                                <div className="size-10 shrink-0 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[var(--nvidia-green)] text-xl animate-pulse">
                                        smart_toy
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                                        System Architect
                                    </div>
                                    <div className="p-5 bg-white/60 border border-white/80 rounded-3xl rounded-tl-none text-sm">
                                        <span className="animate-pulse">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-8 bg-white/20 border-t border-white/40 rounded-b-[32px]">
                        <div className="relative">
                            <input
                                className="w-full bg-white/80 border-none rounded-2xl py-4 pl-6 pr-16 text-sm font-medium text-[var(--obsidian-black)] shadow-sm focus:ring-2 focus:ring-[var(--brushed-bronze)]/20 transition-all placeholder:text-[var(--gunmetal-gray)]/50"
                                placeholder="Ask architectural engine..."
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--champagne-gold)] text-white size-10 rounded-xl flex items-center justify-center hover:bg-[var(--brushed-bronze)] transition-all shadow-md shadow-gray-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
