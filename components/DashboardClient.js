"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createChatSession,
  getChatSessions,
  renameChatSession,
  deleteChatSession,
  getMessages,
  addMessage,
  updateProfilePlan,
} from "@/lib/supabase/queries";
import { getModelTags } from "@/lib/ai/modelTags";

// Resize and compress helper to avoid bloating Supabase DB and respect API payload limits
const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality compression
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
};

// Static list of Ultimate Models
const ultimateModels = [
  { key: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "openrouter", providerModelId: "google/gemini-2.5-pro", tier: "ultimate" },
  { key: "custom-cloud-gpu", label: "Custom Cloud GPU Model", provider: "mock", providerModelId: "custom-cloud-gpu", tier: "ultimate" },
  { key: "my-local-model", label: "My Local Model", provider: "mock", providerModelId: "my-local-model", tier: "ultimate" },
];

export default function DashboardClient({ initialProfile }) {
  const supabase = createClient();

  // App States
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'code', 'learning', 'research'
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  
  // Image Upload & Vision States
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFileName, setImageFileName] = useState("");
  const fileInputRef = useRef(null);
  
  // Model selector states
  const [freeModels, setFreeModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState(false);
  const [sessionModels, setSessionModels] = useState({}); // { [sessionId]: modelKey }
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  
  // Sidebar states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [openMenuSessionId, setOpenMenuSessionId] = useState(null);
  
  // Loading indicators
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // UI Alerts / Toast
  const [toast, setToast] = useState({ message: "", visible: false });

  // Remember active session per section category
  const [activeSessionBySection, setActiveSessionBySection] = useState({
    chat: null,
    code: null,
    learning: null,
    research: null,
    image: null,
  });

  // Refs for closing dropdowns/menus on click-outside
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Helper to show temporary toast messages
  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  // Auto-hide toast after timeout
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Fetch models dynamically on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) throw new Error("Failed to load models");
        const data = await res.json();
        setFreeModels(data.freeModels || []);
      } catch (err) {
        console.error("Error loading free models:", err);
        setModelsError(true);
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  const combinedModels = [...freeModels, ...ultimateModels];

  // Click outside listener for model dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside listener for session contextual dot-menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuSessionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smooth scroll message feed to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch sessions for active tab
  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const data = await getChatSessions(supabase, profile.id, activeTab);
        setSessions(data);

        // Restore active session for this tab if one exists, otherwise set null
        const restoredSession = activeSessionBySection[activeTab];
        if (restoredSession) {
          const exists = data.some((s) => s.id === restoredSession.id);
          if (exists) {
            setActiveSession(restoredSession);
          } else {
            setActiveSession(null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        console.error("Error loading chat sessions:", err);
        showToast("Error retrieving conversations.");
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [activeTab, profile.id]);

  // Load messages when selected session changes
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await getMessages(supabase, activeSession.id);
        setMessages(data);
      } catch (err) {
        console.error("Error loading messages:", err);
        showToast("Failed to fetch messages.");
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();

    // Cache the active session for the current section
    setActiveSessionBySection((prev) => ({
      ...prev,
      [activeTab]: activeSession,
    }));
  }, [activeSession]);

  // Helper: Get active model per session (dynamic defaulting to section-appropriate model)
  const getActiveModel = () => {
    const filteredFree = freeModels.filter(m => {
      const tags = m.tags || getModelTags(m.providerModelId);
      return tags.includes(activeTab);
    });
    const defaultModel = filteredFree[0] || freeModels[0] || { key: "loading", label: "Loading models...", tier: "free" };
    if (!activeSession) return defaultModel;
    const modelKey = sessionModels[activeSession.id];
    if (modelKey) {
      const match = combinedModels.find((m) => m.key === modelKey);
      if (match) return match;
    }
    return defaultModel;
  };

  // Helper: Format relative timestamp (e.g., "2h ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Helper: Generate user initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Suggestions for Empty Chat Screen
  const getSuggestions = (tab) => {
    switch (tab) {
      case "code":
        return [
          "Explain recursion in plain English",
          "Write a React custom hook for localStorage",
        ];
      case "learning":
        return [
          "Help me understand quantum physics",
          "Give me a 5-step roadmap to learn Spanish",
        ];
      case "research":
        return [
          "Outline the pros and cons of remote work",
          "Synthesize the history of generative AI",
        ];
      case "image":
        return [
          "Describe this image in vivid detail",
          "Extract all readable text from this image",
        ];
      case "chat":
      default:
        return [
          "Write a poem about a lost astronaut",
          "Suggest fun weekend activities in Paris",
        ];
    }
  };

  // Operations: Create Chat Session
  const handleCreateSession = async () => {
    try {
      const newSession = await createChatSession(supabase, profile.id, activeTab);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error("Error creating session:", err);
      showToast("Could not start a new chat.");
    }
  };

  // Operations: Create Chat Session and Send Prompt Immediately
  const handleCreateSessionWithPrompt = async (promptText) => {
    try {
      const newSession = await createChatSession(supabase, profile.id, activeTab);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMobileSidebarOpen(false);

      // Optimistic message timeline
      const filteredFree = freeModels.filter(m => {
        const tags = m.tags || getModelTags(m.providerModelId);
        return tags.includes(activeTab);
      });
      const currentModelKey = filteredFree[0]?.key || freeModels[0]?.key || "groq-llama-3.3-70b-versatile";
      const tempUserMsg = {
        id: "temp-user-" + Date.now(),
        session_id: newSession.id,
        user_id: profile.id,
        role: "user",
        content: promptText,
        created_at: new Date().toISOString(),
      };

      setMessages([tempUserMsg]);

      // Save User Message
      const savedUserMsg = await addMessage(supabase, {
        sessionId: newSession.id,
        userId: profile.id,
        role: "user",
        content: promptText,
      });

      // Optimistic AI Response Loader
      const tempAiMsg = {
        id: "temp-ai-" + Date.now(),
        session_id: newSession.id,
        user_id: profile.id,
        role: "assistant",
        content: "⏳ Thinking...",
        model_used: currentModelKey,
        created_at: new Date().toISOString(),
      };

      setMessages([savedUserMsg, tempAiMsg]);

      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSession.id,
          messageText: promptText,
          model: currentModelKey,
        }),
      });

      let aiReplyText = "";
      if (!response.ok) {
        aiReplyText = "⚠️ Failed to reach the AI model server. Please try again.";
      } else {
        const data = await response.json();
        aiReplyText = data.choices?.[0]?.message?.content || "⚠️ No response choices returned by model.";
      }

      // Save AI Message
      const savedAiMsg = await addMessage(supabase, {
        sessionId: newSession.id,
        userId: profile.id,
        role: "assistant",
        content: aiReplyText,
        modelUsed: currentModelKey,
      });

      setMessages([savedUserMsg, savedAiMsg]);
    } catch (err) {
      console.error("Error creating session with prompt:", err);
      showToast("Could not initiate conversation.");
    }
  };

  // Operations: Delete Chat Session
  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteChatSession(supabase, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null);
        setActiveSessionBySection((prev) => ({ ...prev, [activeTab]: null }));
      }
      setOpenMenuSessionId(null);
    } catch (err) {
      console.error("Error deleting session:", err);
      showToast("Failed to delete chat session.");
    }
  };

  // Operations: Rename Chat Session
  const handleRenameSession = async (sessionId, newTitle) => {
    if (!newTitle.trim()) {
      setRenamingSessionId(null);
      return;
    }
    try {
      const updated = await renameChatSession(supabase, sessionId, newTitle.trim());
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(updated);
      }
      setRenamingSessionId(null);
    } catch (err) {
      console.error("Error renaming session:", err);
      showToast("Failed to update chat title.");
    }
  };
  // Handle file input changes and compress the image
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file.");
      return;
    }

    try {
      showToast("Processing image...");
      const compressedBase64 = await resizeImage(file, 800, 800);
      setSelectedImage(compressedBase64);
      setImageFileName(file.name);
    } catch (err) {
      console.error("Error processing image:", err);
      showToast("Failed to process image.");
    }
  };

  // Operations: Send Message (Optimistic timeline updates)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !activeSession) return;

    const messageText = inputText.trim() || (selectedImage ? "Describe this image" : "");
    setInputText("");

    const stagedImage = selectedImage;
    setSelectedImage(null);
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    const activeModel = getActiveModel();
    const isMultimodal = !!stagedImage;

    const rawContent = isMultimodal
      ? JSON.stringify({ type: "multimodal", image: stagedImage, text: messageText })
      : messageText;

    // 1. Optimistic User Message
    const tempUserMsg = {
      id: "temp-user-" + Date.now(),
      session_id: activeSession.id,
      user_id: profile.id,
      role: "user",
      content: rawContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    // Push active session to top of sidebar list
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSession.id) {
          return { ...s, updated_at: new Date().toISOString() };
        }
        return s;
      });
      return [...updated].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });

    try {
      // 2. Save User Message
      const savedUserMsg = await addMessage(supabase, {
        sessionId: activeSession.id,
        userId: profile.id,
        role: "user",
        content: rawContent,
      });

      // Replace user message state with saved one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? savedUserMsg : m))
      );

      // 3. Optimistic AI Response Loader
      const tempAiMsg = {
        id: "temp-ai-" + Date.now(),
        session_id: activeSession.id,
        user_id: profile.id,
        role: "assistant",
        content: "⏳ Thinking...",
        model_used: activeModel.key,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempAiMsg]);

      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          messageText: messageText,
          image: stagedImage,
          model: activeModel.key,
        }),
      });

      let aiReplyText = "";
      if (!response.ok) {
        aiReplyText = "⚠️ Failed to reach the AI model server. Please try again.";
      } else {
        const data = await response.json();
        aiReplyText = data.choices?.[0]?.message?.content || "⚠️ No response choices returned by model.";
      }

      // Save AI Message to Database
      const savedAiMsg = await addMessage(supabase, {
        sessionId: activeSession.id,
        userId: profile.id,
        role: "assistant",
        content: aiReplyText,
        modelUsed: activeModel.key,
      });

      // Replace assistant message state with saved one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempAiMsg.id ? savedAiMsg : m))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      showToast("Message sent but not synced with database.");
    }
  };

  // Operations: Model selection gating
  const handleSelectModel = (model) => {
    if (model.tier === "ultimate" && profile.plan !== "ultimate") {
      showToast("This model is part of the Ultimate plan ✨ Upgrade to unlock it.");
      return;
    }

    setSessionModels((prev) => ({
      ...prev,
      [activeSession.id]: model.key,
    }));
    setIsModelDropdownOpen(false);
  };

  // Operations: Simulate upgrading/downgrading subscription
  const toggleMockUpgrade = async () => {
    const nextPlan = profile.plan === "free" ? "ultimate" : "free";
    try {
      const updated = await updateProfilePlan(supabase, profile.id, nextPlan);
      setProfile(updated);
      showToast(
        nextPlan === "ultimate"
          ? "🎉 Upgrade simulated successfully! All Ultimate models unlocked. ✨"
          : "ℹ️ Downgrade simulated successfully. Ultimate models are locked again."
      );
    } catch (err) {
      console.error("Error simulating plan upgrade:", err);
      showToast("Failed to simulate upgrade.");
    }
  };

  // Operations: Account Log Out
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Shared Sidebar Component (Reused on desktop & mobile drawer)
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* "+ New chat" Button */}
      {activeTab !== "video" && (
        <div className="p-4 flex-shrink-0">
          <button
            onClick={handleCreateSession}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-full shadow-md shadow-brand-primary/15 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 font-quicksand cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>
      )}

      {/* Conversations Session List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 scrollbar-thin">
        {activeTab === "video" ? (
          <div className="text-center py-8 px-4 text-brand-dark/40 dark:text-brand-dark/50 text-sm font-light leading-relaxed select-none">
            🎬 Video features are currently in development.
          </div>
        ) : loadingSessions ? (
          <div className="space-y-2 p-2">
            <div className="h-10 bg-brand-dark/5 dark:bg-brand-dark/10 rounded-2xl animate-pulse" />
            <div className="h-10 bg-brand-dark/5 dark:bg-brand-dark/10 rounded-2xl animate-pulse" />
            <div className="h-10 bg-brand-dark/5 dark:bg-brand-dark/10 rounded-2xl animate-pulse" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4 text-brand-dark/40 dark:text-brand-dark/50 text-sm font-light leading-relaxed">
            No chats in this section yet.<br />Click "+ New chat" to get started!
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSession && activeSession.id === session.id;
            const isEditing = renamingSessionId === session.id;

            return (
              <div
                key={session.id}
                className={`group relative rounded-2xl transition-all duration-150 ${
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10"
                }`}
              >
                {isEditing ? (
                  <div className="p-2 w-full">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSession(session.id, renameValue)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSession(session.id, renameValue);
                        if (e.key === "Escape") setRenamingSessionId(null);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-brand-bg text-brand-dark text-sm border border-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 pr-10">
                    <button
                      onClick={() => {
                        setActiveSession(session);
                        setMobileSidebarOpen(false);
                      }}
                      className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                    >
                      <span className="block text-sm font-bold truncate">
                        {session.title}
                      </span>
                      <span className="block text-[10px] text-brand-dark/45 dark:text-brand-dark/60 mt-0.5 font-light">
                        {getRelativeTime(session.updated_at)}
                      </span>
                    </button>

                    {/* Hover dots action button */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuSessionId(
                            openMenuSessionId === session.id ? null : session.id
                          );
                        }}
                        className="p-1.5 rounded-xl text-brand-dark/40 dark:text-brand-dark/65 hover:text-brand-dark hover:bg-brand-dark/10 dark:hover:bg-brand-dark/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 cursor-pointer"
                        aria-label="Chat actions"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {/* Rename / Delete Dropdown menu */}
                      {openMenuSessionId === session.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-7 w-32 bg-brand-card border border-brand-dark/10 dark:border-brand-dark/25 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingSessionId(session.id);
                              setRenameValue(session.title);
                              setOpenMenuSessionId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            ✏️ Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-brand-error hover:bg-brand-error/5 dark:hover:bg-brand-error/10 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Account Profile Card */}
      <div className="p-4 border-t border-brand-dark/10 dark:border-brand-dark/20 bg-brand-card/95 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-primary/15 text-brand-primary font-bold flex items-center justify-center text-sm flex-shrink-0 font-quicksand select-none border border-brand-primary/5">
            {getInitials(profile.name)}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-brand-dark truncate font-quicksand">
              {profile.name}
            </span>
            <button
              onClick={toggleMockUpgrade}
              title={profile.plan === "free" ? "Click to simulate upgrading to Ultimate plan!" : "Click to simulate downgrading to Free plan!"}
              className={`inline-flex items-center gap-0.5 text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 ${
                profile.plan === "ultimate"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30"
                  : "bg-brand-dark/10 text-brand-dark/60 dark:bg-brand-dark/20 dark:text-brand-dark/80"
              }`}
            >
              {profile.plan === "ultimate" ? "✨ Ultimate" : "Free"}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-bold text-brand-error hover:underline ml-auto flex-shrink-0 cursor-pointer p-1.5 rounded-lg hover:bg-brand-error/5 transition-all"
        >
          Log Out
        </button>
      </div>
    </div>
  );

  const currentModel = getActiveModel();

  // Filter free and ultimate models dynamically by the active tab tags (activeSection)
  const filteredFreeModels = freeModels.filter(m => {
    const tags = m.tags || getModelTags(m.providerModelId);
    return tags.includes(activeTab);
  });

  const filteredUltimateModels = ultimateModels.map(m => ({
    ...m,
    tags: getModelTags(m.providerModelId)
  })).filter(m => m.tags.includes(activeTab));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-bg text-brand-dark relative">
      {/* Toast alert system */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-brand-card/95 dark:bg-brand-card border border-brand-primary/20 dark:border-brand-primary/30 text-brand-dark px-6 py-3.5 rounded-full shadow-xl shadow-brand-dark/10 flex items-center gap-2 max-w-md text-center text-sm font-semibold">
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      {/* Top Header Tab Bar */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-brand-dark/10 dark:border-brand-dark/25 bg-brand-card/90 dark:bg-brand-card/95 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile devices */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10 rounded-xl transition-all cursor-pointer"
            aria-label="Open sidebar"
          >
            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo Brand Icon */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-md shadow-brand-primary/20">
              <span className="text-xl text-white font-bold select-none">N</span>
            </div>
            <span className="text-xl font-extrabold font-quicksand tracking-tight hidden sm:inline-block">
              NexInc
            </span>
          </div>
        </div>

        {/* Categories Tab Selectors */}
        <div className="flex-1 flex justify-center max-w-2xl px-4 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1.5 p-1 bg-brand-bg/60 dark:bg-brand-bg/40 rounded-full border border-brand-dark/5 whitespace-nowrap">
            {["chat", "code", "learning", "research", "image", "video"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4.5 py-1.5 rounded-full font-quicksand font-bold text-sm transition-all duration-200 capitalize cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-brand-dark/65 hover:text-brand-dark hover:bg-brand-dark/5 dark:hover:text-brand-dark/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Balanced spacing for right corner */}
        <div className="w-9 sm:w-16 flex justify-end" />
      </header>

      {/* Main Dashboard Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile Slide-in Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
        )}

        {/* Mobile Sidebar Overlay Drawer */}
        <aside
          className={`md:hidden fixed inset-y-0 left-0 z-40 w-80 bg-brand-card border-r border-brand-dark/10 dark:border-brand-dark/25 flex flex-col justify-between h-full shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-brand-dark/5 flex-shrink-0">
              <span className="font-bold text-lg font-quicksand text-brand-dark">Navigation</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 text-brand-dark/65 hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10 rounded-xl cursor-pointer"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </div>
        </aside>

        {/* Desktop Permanent Sidebar */}
        <aside className="hidden md:flex md:w-80 flex-shrink-0 border-r border-brand-dark/10 dark:border-brand-dark/25 bg-brand-card flex-col h-full z-10">
          {sidebarContent}
        </aside>

        {/* Main Conversation Window */}
        <main className="flex-1 flex flex-col overflow-hidden bg-brand-bg/30 relative">
          {activeTab === "video" ? (
            /* Video Tab Coming Soon Placeholder Splash Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-500 select-none">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-6 text-brand-primary text-4xl shadow-md shadow-brand-primary/5 animate-pulse">
                🎬
              </div>
              <h2 className="text-3xl font-extrabold font-quicksand text-brand-dark mb-4">
                Video generation is coming soon!
              </h2>
              <p className="text-brand-dark/70 dark:text-brand-dark/80 leading-relaxed max-w-md font-light text-sm">
                This will be part of the Ultimate plan once we wire up a video provider.
              </p>
            </div>
          ) : !activeSession ? (
            /* Empty Chat State Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-6 text-brand-primary text-4xl">
                {activeTab === "chat"
                  ? "💬"
                  : activeTab === "code"
                  ? "💻"
                  : activeTab === "learning"
                  ? "🎓"
                  : activeTab === "research"
                  ? "🔍"
                  : activeTab === "image"
                  ? "🎨"
                  : "🎬"}
              </div>

              <h2 className="text-3xl font-extrabold font-quicksand text-brand-dark mb-4">
                {activeTab === "chat"
                  ? "Friendly Conversational Chat"
                  : activeTab === "code"
                  ? "Coding Assistant"
                  : activeTab === "learning"
                  ? "Personal Tutor"
                  : activeTab === "research"
                  ? "Research Partner"
                  : activeTab === "image"
                  ? "Image Generator"
                  : "Video Generator"}
              </h2>

              <p className="text-brand-dark/70 dark:text-brand-dark/80 mb-8 leading-relaxed max-w-md font-light text-sm">
                {activeTab === "chat"
                  ? "Have a chat about anything on your mind. Ask questions, brainstorm ideas, or just write some poetry."
                  : activeTab === "code"
                  ? "Write code, debug, translate languages, or generate boilerplate code. Perfect for your developer workflow."
                  : activeTab === "learning"
                  ? "Dive into new concepts. Ask for study plans, summaries, grammar checks, or step-by-step explanations."
                  : activeTab === "research"
                  ? "Gather information, structure your research, outline documents, or analyze ideas efficiently."
                  : activeTab === "image"
                  ? "Generate beautiful artwork, illustrations, and realistic images from text prompts."
                  : "Create cinematic clips and animations dynamically from text prompts."}
              </p>

              {/* Suggestions grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md">
                {getSuggestions(activeTab).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCreateSessionWithPrompt(suggestion)}
                    className="p-4 bg-brand-card hover:bg-brand-card/75 dark:bg-brand-card dark:hover:bg-brand-card/85 border border-brand-dark/5 hover:border-brand-primary/20 text-brand-dark font-semibold text-xs rounded-2xl transition-all text-left shadow-xs hover:shadow-sm cursor-pointer leading-normal"
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Selected Session Timeline Feed */
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Active Conversation Title Header */}
              <div className="h-14 flex items-center justify-between px-6 border-b border-brand-dark/5 bg-brand-card/30 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-brand-dark truncate font-quicksand">
                    {activeSession.title}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider bg-brand-primary/10 text-brand-primary rounded-full select-none">
                    {activeTab}
                  </span>
                </div>
              </div>

              {/* Chat timeline bubbles */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-brand-dark/50">Retrieving conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <span className="text-4xl mb-3">👋</span>
                    <h3 className="font-bold text-sm text-brand-dark mb-1">New conversation started</h3>
                    <p className="text-xs text-brand-dark/50 max-w-xs leading-relaxed">
                      Type a message below to begin chatting with {currentModel.name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    
                    // Parse potential multimodal content
                    let isMultimodal = false;
                    let displayContent = msg.content;
                    let imageUrl = "";
                    
                    try {
                      const parsed = JSON.parse(msg.content);
                      if (parsed && parsed.type === "multimodal") {
                        isMultimodal = true;
                        imageUrl = parsed.image;
                        displayContent = parsed.text;
                      }
                    } catch (e) {
                      // Normal text message
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[70%] ${
                          isUser ? "ml-auto" : "mr-auto"
                        } animate-in fade-in slide-in-from-bottom-2 duration-200`}
                      >
                        {/* Bubble content */}
                        <div
                          className={`px-4.5 py-3 rounded-3xl leading-relaxed text-sm select-text shadow-xs ${
                            isUser
                              ? "bg-brand-primary text-white rounded-tr-none shadow-brand-primary/10"
                              : "bg-brand-card text-brand-dark border border-brand-dark/5 rounded-tl-none"
                          }`}
                        >
                          {isMultimodal && imageUrl && (
                            <div className="mb-2 max-w-full rounded-2xl overflow-hidden border border-brand-dark/5 dark:border-brand-dark/20 bg-brand-bg/50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt="Uploaded attachment"
                                className="max-h-64 object-contain rounded-2xl select-none"
                              />
                            </div>
                          )}
                          {displayContent && (
                            <div className="whitespace-pre-wrap">{displayContent}</div>
                          )}
                        </div>

                        {/* Bubble metadata details */}
                        <div className="flex items-center gap-1.5 mt-1 ml-1 mr-1 select-none font-light">
                          <span className="text-[10px] text-brand-dark/40">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {!isUser && msg.model_used && (
                            <>
                              <span className="text-[10px] text-brand-dark/30">•</span>
                              <span className="text-[10px] text-brand-primary font-bold bg-brand-primary/5 px-1.5 py-0.5 rounded-md">
                                🤖 {combinedModels.find((m) => m.key === msg.model_used)?.label || msg.model_used}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Message Entry & Model Selector Bar */}
              <div className="p-4 border-t border-brand-dark/10 dark:border-brand-dark/25 bg-brand-card/90 dark:bg-brand-card/95 backdrop-blur-md flex-shrink-0">
                <div className="max-w-4xl mx-auto space-y-3">
                  {/* Model Selector Trigger Dropdown */}
                  <div className="relative inline-block" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="px-4 py-2 text-xs font-semibold rounded-full border border-brand-dark/10 dark:border-brand-dark/20 bg-brand-card hover:bg-brand-bg/50 dark:hover:bg-brand-bg/35 transition-all flex items-center gap-1.5 cursor-pointer text-brand-dark"
                    >
                      <span>🤖 {currentModel.label || "Select model..."}</span>
                      {currentModel.tier === "ultimate" && <span className="text-[10px]">👑</span>}
                      <svg
                        className={`w-3.5 h-3.5 text-brand-dark/50 transition-transform duration-200 ${
                          isModelDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Selector Panel Dropdown */}
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-brand-card border border-brand-dark/10 dark:border-brand-dark/25 rounded-2xl shadow-xl py-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-96 overflow-y-auto scrollbar-thin">
                        {loadingModels ? (
                          <div className="px-4 py-3 text-xs text-brand-dark/50 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                            <span>Discovering models...</span>
                          </div>
                        ) : (
                          <>
                            {/* Groq Models */}
                            {filteredFreeModels.filter(m => m.provider === "groq").length > 0 && (
                              <>
                                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-brand-dark/45 dark:text-brand-dark/60 border-b border-brand-dark/5 pb-1">
                                  Groq
                                </div>
                                <div className="py-1">
                                  {filteredFreeModels.filter(m => m.provider === "groq").map((m) => {
                                    const isSelected = currentModel.key === m.key;
                                    return (
                                      <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => handleSelectModel(m)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10"
                                        }`}
                                      >
                                        <span>{m.label}</span>
                                        {isSelected && <span className="text-brand-primary font-bold">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            {/* OpenRouter Models */}
                            {filteredFreeModels.filter(m => m.provider === "openrouter").length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-dark/45 dark:text-brand-dark/60 border-t border-b border-brand-dark/5 pt-2 pb-1">
                                  OpenRouter
                                </div>
                                <div className="py-1">
                                  {filteredFreeModels.filter(m => m.provider === "openrouter").map((m) => {
                                    const isSelected = currentModel.key === m.key;
                                    return (
                                      <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => handleSelectModel(m)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10"
                                        }`}
                                      >
                                        <span>{m.label}</span>
                                        {isSelected && <span className="text-brand-primary font-bold">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            {/* NVIDIA Models */}
                            {filteredFreeModels.filter(m => m.provider === "nvidia").length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-dark/45 dark:text-brand-dark/60 border-t border-b border-brand-dark/5 pt-2 pb-1">
                                  NVIDIA
                                </div>
                                <div className="py-1">
                                  {filteredFreeModels.filter(m => m.provider === "nvidia").map((m) => {
                                    const isSelected = currentModel.key === m.key;
                                    return (
                                      <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => handleSelectModel(m)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10"
                                        }`}
                                      >
                                        <span>{m.label}</span>
                                        {isSelected && <span className="text-brand-primary font-bold">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            {/* Fallback empty message for filtered free models */}
                            {filteredFreeModels.length === 0 && (
                              <div className="px-4 py-3.5 text-xs font-semibold text-brand-dark/50 leading-relaxed text-center select-none">
                                No specialized models available right now — try the Chat tab for general-purpose models
                              </div>
                            )}

                            {/* Ultimate Tier Header */}
                            {filteredUltimateModels.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-dark/45 dark:text-brand-dark/60 border-t border-b border-brand-dark/5 pt-2.5 pb-1 flex items-center justify-between">
                                  <span>Ultimate Models</span>
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-extrabold tracking-wider px-2 py-0.5 rounded-full select-none">
                                    PREMIUM
                                  </span>
                                </div>
                                <div className="py-1">
                                  {filteredUltimateModels.map((m) => {
                                    const isSelected = currentModel.key === m.key;
                                    return (
                                      <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => handleSelectModel(m)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "text-brand-dark hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <span>👑 {m.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {profile.plan !== "ultimate" && (
                                            <span className="text-[10px] text-brand-dark/40" title="Locked">
                                              🔒
                                            </span>
                                          )}
                                          {isSelected && <span className="text-brand-primary font-bold">✓</span>}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        loadingModels
                          ? "Discovering active AI minds..."
                          : activeSession
                          ? `Message ${currentModel.label}...`
                          : "Select a conversation to start chatting"
                      }
                      className="flex-1 px-5 py-3.5 rounded-full bg-brand-bg/50 dark:bg-brand-bg/30 focus:bg-brand-bg focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 border border-brand-dark/5 dark:border-brand-dark/20 placeholder:text-brand-dark/30 dark:placeholder:text-brand-dark/55 text-sm"
                      disabled={loadingModels || !activeSession}
                    />
                    <button
                      type="submit"
                      disabled={loadingModels || !inputText.trim()}
                      className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-md shadow-brand-primary/20 hover:bg-brand-primary/95 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0 cursor-pointer"
                      aria-label="Send message"
                    >
                      <svg className="w-5.5 h-5.5 transform rotate-90 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
