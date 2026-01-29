
"use client";

import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import { fetcher } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DBMessage } from "@/db/schema";
import { toast } from "sonner";
import { MicIcon, SquareIcon, Volume2Icon } from "lucide-react";

// We need to fetch Message type from schema or define it locally if not exported correctly as 'Message'
type MessageType = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    translatedContent: string | null;
    englishContent: string | null;
    targetLang: string | null;
    createdAt: string;
};

const INDIC_LANGUAGES = [
    { code: "hi", name: "Hindi" },
    { code: "bn", name: "Bengali" },
    { code: "te", name: "Telugu" },
    { code: "mr", name: "Marathi" },
    { code: "ta", name: "Tamil" },
    { code: "gu", name: "Gujarati" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "pa", name: "Punjabi" },
];

export default function DMPage() {
    const { id } = useParams(); // Target User ID
    const { user } = useUser();
    const [input, setInput] = useState("");
    const [targetLang, setTargetLang] = useState("hi");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const { data: targetUser } = useSWR<{ id: string; email: string; lastSeen: string }>(
        id ? `/api/users/${id}` : null,
        fetcher
    );

    const { data: messages, mutate } = useSWR<MessageType[]>(
        user && id ? `/api/messages?targetId=${id}` : null,
        fetcher,
        { refreshInterval: 3000 }
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !user || !id) return;

        const optimisticMsg: MessageType = {
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: id as string,
            content: input,
            translatedContent: "Translating...",
            englishContent: null,
            targetLang: targetLang,
            createdAt: new Date().toISOString(),
        };

        mutate([...(messages || []), optimisticMsg], false);
        setInput("");

        try {
            await fetch("/api/messages", {
                method: "POST",
                body: JSON.stringify({
                    content: optimisticMsg.content,
                    receiverId: id,
                    targetLang: targetLang,
                }),
            });
            mutate();
        } catch (error) {
            console.error("Failed to send message");
            toast.error("Failed to send message");
        }
    };

    // Voice Handlers
    const handleStartRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Microphone not supported in this browser or insecure context (HTTP). Please using HTTPS.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', blob, 'recording.webm');

                setIsRecording(false);
                toast.info("Transcribing audio...");

                try {
                    const res = await fetch('/api/speech/stt', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.text) {
                        setInput(prev => prev + " " + data.text);
                    } else {
                        toast.error("Failed to transcribe audio");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("Error transcribing audio");
                }

                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
            toast.error("Microphone access denied. Check permissions.");
        }
    };

    const handleStopRecording = () => {
        mediaRecorderRef.current?.stop();
    };

    const playTTS = async (text: string, lang: string) => {
        try {
            toast.info("Generating audio...");
            const res = await fetch('/api/speech/tts', {
                method: 'POST',
                body: JSON.stringify({ text, lang }),
            });
            const data = await res.json();
            if (data.audioUrl) {
                const audio = new Audio(data.audioUrl);
                audio.play();
            } else {
                toast.error("Failed to generate speech");
            }
        } catch (e) {
            console.error(e);
            toast.error("TTS Error");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-6rem)] mt-20 w-full max-w-4xl mx-auto border bg-background shadow-md rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex flex-row items-center justify-between bg-muted/30 gap-4">
                <div className="flex flex-col min-w-0">
                    <div className="font-semibold text-lg truncate">{targetUser?.email || "Loading..."}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Direct Message</div>
                </div>

                <div className="flex flex-row items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground hidden sm:block">Translate to:</span>
                    {/* Fallback Native Select for robustness */}
                    <div className="relative">
                        <select
                            className="w-[140px] h-9 text-sm border-2 border-zinc-200 dark:border-zinc-700 rounded-md px-2 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                        >
                            {INDIC_LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {!messages?.length && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                        No messages yet. Say hello!
                    </div>
                )}

                {messages?.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={msg.id} className={cx("flex flex-row gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium">
                                    {isMe ? "ME" : targetUser?.email?.charAt(0).toUpperCase() || "U"}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 min-w-0">
                                <div className={cx(
                                    "p-3 rounded-2xl text-sm break-words relative group",
                                    isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-tl-none"
                                )}>
                                    <div>{msg.content}</div>
                                    <button
                                        onClick={() => playTTS(msg.content, 'en')}
                                        className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                                        title="Play Original"
                                    >
                                        <Volume2Icon size={14} />
                                    </button>
                                </div>

                                {/* Translations */}
                                {(msg.translatedContent || msg.englishContent) && (
                                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 border rounded-xl w-full group relative">
                                        {/* Show Translated if it exists and is different from content, OR if it is the loading state "Translating..." */}
                                        {(msg.translatedContent === "Translating..." || (msg.translatedContent && msg.translatedContent !== msg.content)) && (
                                            <div className="mb-1">
                                                <span className="font-semibold uppercase text-[10px] opacity-70">{msg.targetLang || "Translation"}: </span>
                                                <span className={msg.translatedContent === "Translating..." ? "animate-pulse" : ""}>
                                                    {msg.translatedContent}
                                                </span>
                                                <button
                                                    onClick={() => playTTS(msg.translatedContent!, msg.targetLang || 'en')}
                                                    className="ml-2 inline-block opacity-50 hover:opacity-100 p-0.5"
                                                    title="Play Translation"
                                                >
                                                    <Volume2Icon size={10} />
                                                </button>
                                            </div>
                                        )}

                                        {msg.englishContent && msg.englishContent !== msg.content && (
                                            <div>
                                                <span className="font-semibold uppercase text-[10px] opacity-70">Original (EN): </span>
                                                {msg.englishContent}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className={cx("text-[10px] text-muted-foreground px-1", isMe ? "text-right" : "text-left")}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex flex-row gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Type in any language (will translate to ${INDIC_LANGUAGES.find(l => l.code === targetLang)?.name})...`}
                        className="flex-1"
                    />

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={cx("transition-all", isRecording && "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse")}
                    >
                        {isRecording ? <SquareIcon size={16} fill="currentColor" /> : <MicIcon size={18} />}
                    </Button>

                    <Button type="submit" disabled={!input.trim()}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
}
