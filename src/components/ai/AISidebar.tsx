import { useEffect, useRef, useState } from "react";
import { X, Trash2, Zap, ArrowUp, Paperclip, ImagePlus, MessagesSquare, SquarePen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { useAIChat, type ChatAttachment } from "@/hooks/useAIChat";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SessionCreatedCard, {
  type SessionCreatedCardSession,
} from "@/components/ai/SessionCreatedCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AISidebarProps {
  open: boolean;
  onClose: () => void;
}

const STARTER_SUGGESTIONS: Array<{ label: string; action: "send" | "pick-file" }> = [
  { label: "Crée une séance full body 45 min", action: "send" },
  { label: "Analyse ma semaine d'entraînement", action: "send" },
  { label: "Génère un plan course pour une 10km", action: "send" },
  { label: "Analyse une photo de plan d'entraînement", action: "pick-file" },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function stripDataUrl(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

async function imageToCompressedBase64(file: File): Promise<{ base64: string; type: string }> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });
  image.src = originalDataUrl;
  await loaded;

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { base64: stripDataUrl(originalDataUrl), type: file.type || "image/jpeg" };
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.78)
  );
  if (!blob) return { base64: stripDataUrl(originalDataUrl), type: file.type || "image/jpeg" };
  return { base64: stripDataUrl(await readFileAsDataUrl(blob)), type: "image/jpeg" };
}

async function fileToAttachmentPayload(file: File): Promise<{ base64: string; type: string }> {
  if (file.type.startsWith("image/")) return imageToCompressedBase64(file);
  return { base64: stripDataUrl(await readFileAsDataUrl(file)), type: file.type || "application/octet-stream" };
}

interface ParsedSessionCard {
  sessions: SessionCreatedCardSession[];
  cleanedContent: string;
}

function tryParseSessionAction(content: string): ParsedSessionCard | null {
  if (!content) return null;
  // Match fenced ```json ... ``` or raw {...}
  const fenced = content.match(/```(?:json)?\s*(\{[\s\S]*?"action"\s*:\s*"sessions_created"[\s\S]*?\})\s*```/);
  const raw = !fenced
    ? content.match(/(\{[^{}]*"action"\s*:\s*"sessions_created"[\s\S]*?\})/)
    : null;
  const jsonStr = fenced?.[1] || raw?.[1];
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed?.action !== "sessions_created" || !Array.isArray(parsed.sessions)) return null;
    const sessions: SessionCreatedCardSession[] = parsed.sessions
      .filter((s: any) => s && typeof s === "object")
      .map((s: any) => ({
        name: String(s.name || "Séance"),
        date: String(s.date || ""),
        exerciseCount: typeof s.exerciseCount === "number" ? s.exerciseCount : undefined,
      }));
    if (sessions.length === 0) return null;
    const cleanedContent = content.replace(fenced?.[0] || raw?.[0] || "", "").trim();
    return { sessions, cleanedContent };
  } catch {
    return null;
  }
}

const AISidebar = ({ open, onClose }: AISidebarProps) => {
  const { t } = useTranslation(["ai_chat", "common"]);
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    isEnabled,
    initialLoaded,
    sendMessage,
    loadConversations,
    conversations,
    activeConversationId,
    newConversation,
    selectConversation,
    deleteConversation,
  } = useAIChat({
    onMessageSent: () =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
  });

  useEffect(() => {
    if (open && !initialLoaded) loadConversations();
  }, [open, initialLoaded, loadConversations]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !attachment) || isLoading) return;
    sendMessage(text, attachment || undefined);
    setInput("");
    setAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSuggestion = (s: string) => {
    if (isLoading) return;
    sendMessage(s);
  };

  const handleStarter = (item: { label: string; action: "send" | "pick-file" }) => {
    if (isLoading) return;
    if (item.action === "pick-file") {
      fileInputRef.current?.click();
      return;
    }
    sendMessage(item.label);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const maxBytes = file.type.startsWith("image/") ? MAX_IMAGE_SOURCE_BYTES : MAX_FILE_BYTES;
    if (file.size > maxBytes) {
      toast.error(`Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo).`);
      return;
    }
    try {
      const { base64, type } = await fileToAttachmentPayload(file);
      setAttachment({
        name: file.name,
        type,
        base64,
      });
    } catch (err) {
      console.error("File read error:", err);
      toast.error("Impossible de lire le fichier.");
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";

  const lastAssistantSuggestions =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    !isLoading
      ? messages[messages.length - 1].suggestions || []
      : [];

  // Compute consecutive-assistant grouping: only show avatar on the LAST of a run
  const showAvatarAt = (i: number) => {
    if (messages[i].role !== "assistant") return false;
    const next = messages[i + 1];
    return !next || next.role !== "assistant";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("ai_chat:title")}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[380px] z-50 flex flex-col bg-background sm:border-l border-border shadow-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-bold text-base">VOLT</h2>
            <span
              className="w-2 h-2 rounded-full bg-emerald-500"
              aria-label="online"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => setShowConversations(true)}
              aria-label="Conversations"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <MessagesSquare className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => newConversation()}
              aria-label="Nouvelle conversation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <SquarePen className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={onClose}
              aria-label={t("common:close", "Close")}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Conversations panel */}
        {showConversations && (
          <div className="absolute inset-0 top-[57px] z-10 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold">Conversations</span>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setShowConversations(false)} aria-label="Fermer">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>
            <button
              onClick={async () => { await newConversation(); setShowConversations(false); }}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary border-b border-border hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouvelle conversation
            </button>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8 px-4">
                  Aucune conversation
                </div>
              )}
              {conversations.map(c => {
                const d = new Date(c.updated_at);
                const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                return (
                  <div key={c.id} className={`flex items-center gap-2 px-4 py-3 border-b border-border ${c.id === activeConversationId ? "bg-secondary" : ""}`}>
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={async () => { await selectConversation(c.id); setShowConversations(false); }}
                    >
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{dateStr}</p>
                    </button>
                    <button
                      onClick={() => setConvToDelete(c.id)}
                      aria-label="Supprimer"
                      className="shrink-0 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <AlertDialog open={convToDelete !== null} onOpenChange={(o) => !o && setConvToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tous les messages seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    if (convToDelete) {
                      await deleteConversation(convToDelete);
                      setConvToDelete(null);
                    }
                  }}>
                    {t("common:confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center text-center py-8 px-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-lg">
                Bonjour {firstName || "👋"} — que puis-je faire pour toi ?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Je suis VOLT, ton coach IA.
              </p>
              <div className="flex flex-col gap-2 mt-6 w-full">
                {STARTER_SUGGESTIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleStarter(item)}
                    disabled={isLoading || !isEnabled}
                    className="text-xs px-3 py-2 rounded-full border border-border bg-secondary hover:bg-card text-foreground font-medium transition-colors cursor-pointer disabled:opacity-50 text-left flex items-center gap-2"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {item.action === "pick-file" && (
                      <ImagePlus className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2} />
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            if (isUser) {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              );
            }
            const withAvatar = showAvatarAt(i);
            const parsedCard = tryParseSessionAction(msg.content);
            return (
              <div key={i} className="flex justify-start items-end gap-2">
                {withAvatar ? (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap
                      className="w-3.5 h-3.5 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 shrink-0" />
                )}
                {parsedCard ? (
                  <div className="max-w-[85%] space-y-2 flex-1">
                    {parsedCard.cleanedContent && (
                      <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px] leading-relaxed break-words">
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                          <ReactMarkdown>{parsedCard.cleanedContent}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <SessionCreatedCard sessions={parsedCard.sessions} />
                  </div>
                ) : (
                  <div className="max-w-[80%] bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px] leading-relaxed break-words">
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Suggestion chips under last assistant message */}
          {lastAssistantSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-9">
              {lastAssistantSuggestions.map((s, si) => (
                <button
                  key={si}
                  onClick={() => handleSuggestion(s)}
                  disabled={isLoading}
                  className="min-h-[44px] flex items-center border border-primary/30 bg-primary/5 text-primary rounded-full px-4 py-2 text-sm font-medium active:bg-primary/15 transition-colors disabled:opacity-50"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap
                  className="w-3.5 h-3.5 text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                <span className="flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="border-t border-border shrink-0 px-3 py-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          {!isEnabled ? (
            <p className="text-xs text-center text-muted-foreground py-2">
              {t("ai_chat:plan_required")}
            </p>
          ) : (
            <div className="space-y-2">
              {attachment && (
                <div className="flex items-center gap-2 text-xs bg-secondary border border-border rounded-full px-3 py-1.5 w-fit max-w-full">
                  <Paperclip className="w-3 h-3 shrink-0" strokeWidth={2} />
                  <span className="truncate font-medium">{attachment.name}</span>
                  <button
                    onClick={() => setAttachment(null)}
                    aria-label="Retirer le fichier"
                    className="shrink-0 hover:text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.fit,.pdf,.txt"
                onChange={handleFilePick}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Joindre un fichier"
                className="w-11 h-11 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center shrink-0 disabled:opacity-40 active:opacity-80 transition-opacity"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <Paperclip className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message VOLT..."
                rows={1}
                disabled={isLoading}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-2xl border border-border bg-secondary px-4 py-3 text-[16px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachment)}
                aria-label="Send"
                className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 active:opacity-80 transition-opacity"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2} />
              </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default AISidebar;
