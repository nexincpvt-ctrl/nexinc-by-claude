"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  createChatSession,
  getChatSessions,
  renameChatSession,
  deleteChatSession,
  getMessages,
  addMessage,
  updateProfilePlan,
} from "@/lib/supabase/queries";
import { getModelTags, isVisionCapable } from "@/lib/ai/modelTags";
import ReactMarkdown from "react-markdown";
import "@/app/dashboard/dashboard.css";

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
  });
};

// Welcome screen static suggestions
const welcomeSuggestions = [
  {
    icon: "💬",
    title: "Brainstorm ideas",
    desc: "Creative thinking and general chatting",
    prompt: "Give me 5 creative ideas for a startup in the green tech space.",
    section: "chat"
  },
  {
    icon: "💻",
    title: "Sort a linked list",
    desc: "Write optimized Python code for linked list sorting",
    prompt: "Write optimized Python code to sort a singly linked list with explanations.",
    section: "code"
  },
  {
    icon: "🔍",
    title: "Compare REST vs GraphQL",
    desc: "Understand API architecture differences with examples",
    prompt: "Compare REST and GraphQL APIs, detailing pros, cons, and when to use each with examples.",
    section: "research"
  },
  {
    icon: "🔒",
    title: "Personal daily planner",
    desc: "Plan your tasks and goals in a private session",
    prompt: "Help me structure a productive daily routine combining work, learning, and exercise.",
    section: "learning"
  }
];

// Static list of Ultimate Models
const ultimateModels = [
  { key: "mistral-large", label: "Mistral Large (Mistral AI)", provider: "mistral", providerModelId: "mistral-large", tier: "ultimate" },
  { key: "mistral-large-3", label: "Mistral Large 3 (Mistral AI)", provider: "mistral", providerModelId: "mistral-large-3", tier: "ultimate" },
  { key: "mistral-medium-3.5", label: "Mistral Medium 3.5 (Mistral AI)", provider: "mistral", providerModelId: "mistral-medium-3.5", tier: "ultimate" },
  { key: "mistral-small-4", label: "Mistral Small 4 (Mistral AI)", provider: "mistral", providerModelId: "mistral-small-4", tier: "ultimate" },
  { key: "gpt-5.5", label: "GPT-5.5 (OpenAI)", provider: "openai", providerModelId: "gpt-5.5", tier: "ultimate" },
  { key: "gpt-5.5-pro", label: "GPT-5.5 Pro (OpenAI)", provider: "openai", providerModelId: "gpt-5.5-pro", tier: "ultimate" },
  { key: "gpt-5.4", label: "GPT-5.4 (OpenAI)", provider: "openai", providerModelId: "gpt-5.4", tier: "ultimate" },
  { key: "gpt-5.4-pro", label: "GPT-5.4 Pro (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-pro", tier: "ultimate" },
  { key: "gpt-5.4-mini", label: "GPT-5.4 Mini (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-mini", tier: "ultimate" },
  { key: "gpt-5.4-nano", label: "GPT-5.4 Nano (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-nano", tier: "ultimate" },
  { key: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Google)", provider: "gemini", providerModelId: "gemini-2.5-pro", tier: "ultimate" },
  { key: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash", tier: "ultimate" },
  { key: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash-lite", tier: "ultimate" },
  { key: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Google)", provider: "gemini", providerModelId: "gemini-3.5-flash", tier: "ultimate" },
  { key: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Google)", provider: "gemini", providerModelId: "gemini-3.1-flash-lite", tier: "ultimate" },
  { key: "gemini-3.1-flash-live-preview", label: "Gemini 3.1 Flash Live Preview (Google)", provider: "gemini", providerModelId: "gemini-3.1-flash-live-preview", tier: "ultimate" },
  { key: "gemini-live-2.5-flash-native-audio", label: "Gemini Live 2.5 Flash Native Audio (Google)", provider: "gemini", providerModelId: "gemini-live-2.5-flash-native-audio", tier: "ultimate" },
  { key: "gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash-tts", tier: "ultimate" },
  { key: "gemini-2.5-pro-tts", label: "Gemini 2.5 Pro TTS (Google)", provider: "gemini", providerModelId: "gemini-2.5-pro-tts", tier: "ultimate" },
  { key: "gpt-4o", label: "GPT-4o (OpenAI / ChatGPT)", provider: "openai", providerModelId: "gpt-4o", tier: "ultimate" },
  { key: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Anthropic)", provider: "anthropic", providerModelId: "claude-3-5-sonnet-latest", tier: "ultimate" },
  { key: "perplexity-sonar", label: "Sonar Large (Perplexity)", provider: "perplexity", providerModelId: "sonar", tier: "ultimate" },
  { key: "deepseek-r1", label: "DeepSeek R1 (DeepSeek)", provider: "deepseek", providerModelId: "deepseek-reasoner", tier: "ultimate" },
  { key: "custom-cloud-gpu", label: "Custom Cloud GPU Model", provider: "mock", providerModelId: "custom-cloud-gpu", tier: "ultimate" },
  { key: "my-local-model", label: "My Local Model", provider: "mock", providerModelId: "my-local-model", tier: "ultimate" },
];

export default function DashboardClient({ initialProfile }) {
  const supabase = createClient();
  const router = useRouter();

  // App States
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState("default"); // 'default', 'code', 'research', 'private'
  const [modalType, setModalType] = useState(null); // 'settings' or null
  const [currentTheme, setCurrentTheme] = useState("default");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [activeModelOverride, setActiveModelOverride] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Image Upload & Vision States
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imageFileName, setImageFileName] = useState("");
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Model selector states
  const [freeModels, setFreeModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState(false);
  const [sessionModels, setSessionModels] = useState({}); // { [sessionId]: modelKey }
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [shakingCardId, setShakingCardId] = useState(null);
  
  // Sidebar states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [openMenuSessionId, setOpenMenuSessionId] = useState(null);

  // Specialized Workspaces states
  // 1. Research Workspace
  const [researchQuery, setResearchQuery] = useState("Latest trends in solid-state batteries");
  const [researchStatus, setResearchStatus] = useState(false);
  const [researchStep, setResearchStep] = useState(-1);
  const [researchDone, setResearchDone] = useState(false);

  // 2. Private Workspace
  const [privateStarted, setPrivateStarted] = useState(false);
  const [privateInputText, setPrivateInputText] = useState("");
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateTyping, setPrivateTyping] = useState(false);

  // 3. Codeinc Workspace
  const [activeFile, setActiveFile] = useState("scraper.py");
  const [codeConsoleOpen, setCodeConsoleOpen] = useState(false);
  const [runStatusText, setRunStatusText] = useState("Sandbox idle");
  const [consoleLines, setConsoleLines] = useState(["$ python scraper.py"]);
  
  // Loading indicators
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // UI Alerts / Toast
  const [toast, setToast] = useState({ message: "", visible: false });

  // Refs for closing menus on click-outside
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const privateEndRef = useRef(null);

  // Helper to show temporary toast messages
  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  // Auto-hide toast after timeout
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Fetch models dynamically on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "default";
    setCurrentTheme(savedTheme);

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

  useEffect(() => {
    privateEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages]);

  // Fetch unified sessions for the active user
  useEffect(() => {
    async function loadSessions() {
      if (!profile?.id) return;
      setLoadingSessions(true);
      try {
        const data = await getChatSessions(supabase, profile.id);
        setSessions(data);
      } catch (err) {
        console.error("Error loading chat sessions:", err);
        showToast("Error retrieving conversations.");
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [profile?.id]);

  // Load messages when selected session changes
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }

    if (activeSession.section) {
      setActiveTab(getDisplaySection(activeSession.section));
    }

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await getMessages(supabase, activeSession.id);
        setMessages(data);
      } catch (err) {
        console.error("Error loading messages:", err);
        showToast("Failed to retrieve chat messages.");
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [activeSession]);

  // Helper: Get active model per session (dynamic defaulting to section-appropriate model)
  const getActiveModel = () => {
    if (activeSession) {
      const modelKey = sessionModels[activeSession.id];
      if (modelKey) {
        const match = combinedModels.find((m) => m.key === modelKey);
        if (match) {
          return {
            ...match,
            vision: match.vision ?? isVisionCapable(match.providerModelId)
          };
        }
      }
    }
    
    if (activeModelOverride) {
      return {
        ...activeModelOverride,
        vision: activeModelOverride.vision ?? isVisionCapable(activeModelOverride.providerModelId)
      };
    }

    const firstModel = combinedModels.find(m => m.key.includes("gpt-5") || m.key.includes("gemini-3.5-flash")) || combinedModels[0] || { key: "loading", label: "Loading models...", tier: "free" };
    return {
      ...firstModel,
      vision: firstModel.providerModelId ? isVisionCapable(firstModel.providerModelId) : false
    };
  };

  const currentModel = getActiveModel();

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

  // Operations: Create Chat Session
  const handleCreateSession = async (forcedSection = null) => {
    try {
      const activeModel = getActiveModel();
      let section = forcedSection;
      if (!section) {
        if (activeTab === "code") section = "code";
        else if (activeTab === "research") section = "research";
        else if (activeTab === "private") section = "learning";
        else if (activeTab === "default") section = "chat";
        else section = getSectionFromModel(activeModel);
      }
      const dbSection = (section === "chat" || section === "default") 
        ? "chat" 
        : (section === "private" || section === "learning") 
          ? "learning" 
          : section;
      const dbTitle = section === "image" ? "🖼️ New image chat" : section === "video" ? "🎬 New video chat" : section === "premium" ? "💎 New premium chat" : section === "code" ? "💻 New code chat" : section === "research" ? "🔍 New research chat" : section === "private" || section === "learning" ? "🔒 New private chat" : "New chat";
      const newSession = await createChatSession(supabase, profile.id, dbSection, dbTitle);
      
      if (activeModel?.key) {
        setSessionModels((prev) => ({
          ...prev,
          [newSession.id]: activeModel.key
        }));
      }

      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error("Error creating session:", err);
      showToast("Could not start a new chat.");
    }
  };

  // Operations: Create Chat Session and Send Prompt Immediately
  const handleCreateSessionWithPrompt = async (promptText, forcedSection = null) => {
    try {
      const activeModel = getActiveModel();
      let section = forcedSection;
      if (!section) {
        if (activeTab === "code") section = "code";
        else if (activeTab === "research") section = "research";
        else if (activeTab === "private") section = "learning";
        else if (activeTab === "default") section = "chat";
        else section = getSectionFromModel(activeModel);
      }
      const dbSection = (section === "chat" || section === "default") 
        ? "chat" 
        : (section === "private" || section === "learning") 
          ? "learning" 
          : section;
      const dbTitle = section === "image" ? "🖼️ New image chat" : section === "video" ? "🎬 New video chat" : section === "premium" ? "💎 New premium chat" : section === "code" ? "💻 New code chat" : section === "research" ? "🔍 New research chat" : section === "private" || section === "learning" ? "🔒 New private chat" : "New chat";
      const newSession = await createChatSession(supabase, profile.id, dbSection, dbTitle);
      
      const currentModelKey = activeModel?.key || "groq-llama-3.3-70b-versatile";
      setSessionModels((prev) => ({
        ...prev,
        [newSession.id]: currentModelKey
      }));

      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMobileSidebarOpen(false);

      // Optimistic message timeline
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
      let formattedTitle = newTitle.trim();
      const updated = await renameChatSession(supabase, sessionId, formattedTitle);
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
      setSelectedImageFile(file);
      setImageFileName(file.name);
    } catch (err) {
      console.error("Error processing image:", err);
      showToast("Failed to process image.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!currentModel.vision || !activeSession) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!currentModel.vision || !activeSession) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file.");
      return;
    }

    try {
      showToast("Processing image...");
      const compressedBase64 = await resizeImage(file, 800, 800);
      setSelectedImage(compressedBase64);
      setSelectedImageFile(file);
      setImageFileName(file.name);
    } catch (err) {
      console.error("Error processing dropped image:", err);
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
    const stagedImageFile = selectedImageFile;
    setSelectedImage(null);
    setSelectedImageFile(null);
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    const activeModel = getActiveModel();

    // 1. Optimistic User Message
    const tempUserMsg = {
      id: "temp-user-" + Date.now(),
      session_id: activeSession.id,
      user_id: profile.id,
      role: "user",
      content: messageText,
      message_type: stagedImage ? "image" : undefined,
      image_url: stagedImage ? stagedImage : undefined,
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

    // Upload to Supabase Storage if an image is attached
    let imagePublicUrl = "";
    if (stagedImageFile) {
      try {
        const cleanFileName = imageFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `${profile.id}/${activeSession.id}/${Date.now()}-${cleanFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-uploads")
          .upload(storagePath, stagedImageFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("chat-uploads")
          .getPublicUrl(storagePath);
          
        imagePublicUrl = urlData.publicUrl;
      } catch (err) {
        console.error("Storage upload error:", err);
        showToast("Failed to upload image. Please try again.");
        setSelectedImage(stagedImage);
        setSelectedImageFile(stagedImageFile);
        setImageFileName(imageFileName);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return;
      }
    }

    try {
      // 2. Save User Message
      const savedUserMsg = await addMessage(supabase, {
        sessionId: activeSession.id,
        userId: profile.id,
        role: "user",
        content: messageText,
        message_type: stagedImage ? "image" : undefined,
        image_url: stagedImage ? imagePublicUrl : undefined,
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
          imageUrl: stagedImage ? imagePublicUrl : undefined,
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

  // Operations: Model selection modal handler
  const handleSelectModel = (model) => {
    if (model.tier === "ultimate" && profile.plan !== "ultimate") {
      setShakingCardId(model.key);
      setTimeout(() => setShakingCardId(null), 400);
      showToast("Upgrade to Ultimate to unlock premium models.");
      return;
    }

    if (activeSession) {
      setSessionModels((prev) => ({
        ...prev,
        [activeSession.id]: model.key,
      }));
    } else {
      setActiveModelOverride(model);
    }
    
    // Close modal with a slight delay for aesthetics
    setTimeout(() => {
      setIsModelModalOpen(false);
    }, 220);
  };

  // Operations: Real Stripe checkout and portal redirects for settings
  const handleUpgradeFromSettings = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle: "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to initiate Stripe Checkout.");
      }
    } catch (err) {
      console.error("Stripe Checkout Error:", err);
      showToast("Something went wrong initiating checkout.");
    }
  };

  const handleDowngradeOrPortalFromSettings = async () => {
    if (!profile.stripe_customer_id) {
      try {
        const updated = await updateProfilePlan(supabase, profile.id, "free");
        setProfile(updated);
        showToast("ℹ️ Downgraded to Free plan successfully.");
      } catch (err) {
        console.error("Downgrade error:", err);
        showToast("Failed to downgrade plan.");
      }
      return;
    }

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to open Billing Portal.");
      }
    } catch (err) {
      console.error("Billing Portal Error:", err);
      showToast("Something went wrong opening billing portal.");
    }
  };

  // Operations: Account Log Out
  const handleLogout = async () => {
    try {
      await supabase.signOut();
      window.location.href = "/";
    } catch (err) {
      try {
        await supabase.auth.signOut();
        window.location.href = "/";
      } catch (e) {
        window.location.href = "/";
      }
    }
  };

  const getDisplaySection = (sessionSection) => {
    const s = (sessionSection || "").toLowerCase();
    if (s === "code") return "code";
    if (s === "research") return "research";
    if (s === "learning") return "private";
    return "default";
  };

  const getSectionFromModel = (model) => {
    if (!model) return "chat";
    const tags = model.tags || getModelTags(model.providerModelId || model.key);
    if (tags.includes("code")) return "code";
    if (tags.includes("research")) return "research";
    if (tags.includes("learning")) return "research";
    if (tags.includes("image")) return "chat";
    return "chat";
  };

  // Switch tabs & sync views
  const switchWorkspaceTab = (tab) => {
    setActiveTab(tab);
    if (activeSession && getDisplaySection(activeSession.section) !== tab) {
      setActiveSession(null);
    }
  };

  // Interactive workspaces simulation handlers
  // 1. Research Workspace runner
  const handleStartResearch = () => {
    setResearchFindings(false);
    setResearchStatus(true);
    setResearchStep(0);
  };

  useEffect(() => {
    if (researchStatus && researchStep >= 0 && researchStep < 4) {
      const timer = setTimeout(() => {
        setResearchStep((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (researchStep === 4) {
      setResearchStatus(false);
      setResearchDone(true);
    }
  }, [researchStatus, researchStep]);

  // 2. Private Workspace timeline
  const handlePrivateSend = (e) => {
    e.preventDefault();
    const text = privateInputText.trim();
    if (!text) return;

    const userMsg = {
      id: "priv-u-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setPrivateMessages((prev) => [...prev, userMsg]);
    setPrivateInputText("");
    setPrivateTyping(true);

    setTimeout(() => {
      const assistantMsg = {
        id: "priv-a-" + Date.now(),
        role: "assistant",
        content: "Got it — this stays in your private, encrypted thread.",
        created_at: new Date().toISOString(),
      };
      setPrivateMessages((prev) => [...prev, assistantMsg]);
      setPrivateTyping(false);
    }, 1000);
  };

  // 3. Codeinc Workspace runner
  const handleRunCode = () => {
    setRunStatusText("Running…");
    setCodeConsoleOpen(true);
    setConsoleLines(["$ python " + activeFile]);
    
    setTimeout(() => {
      if (activeFile === "scraper.py") {
        setConsoleLines((prev) => [...prev, "Fetching https://example-news.com …"]);
      } else if (activeFile === "utils.py") {
        setConsoleLines((prev) => [...prev, "Cleaning inputs ...", "Regex compilation completed."]);
      } else {
        setConsoleLines((prev) => [...prev, "Installing dependencies ...", "Checking package registry."]);
      }
    }, 450);

    setTimeout(() => {
      if (activeFile === "scraper.py") {
        setConsoleLines((prev) => [...prev, "✓ 12 headlines extracted"]);
      } else if (activeFile === "utils.py") {
        setConsoleLines((prev) => [...prev, "✓ Test strings cleaned successfully"]);
      } else {
        setConsoleLines((prev) => [...prev, "✓ requirements met (0.01s)"]);
      }
      setRunStatusText("Finished in 0.8s");
    }, 1100);
  };

  // Code editor file mocks
  const fileContents = {
    "scraper.py": (
      <>
        <span className="ln">1</span><span className="kw">import</span> requests<br />
        <span className="ln">2</span><span className="kw">from</span> bs4 <span className="kw">import</span> BeautifulSoup<br />
        <span className="ln">3</span><br />
        <span className="ln">4</span><span className="kw">def</span> <span className="fn">fetch_headlines</span>(url):<br />
        <span className="ln">5</span>    res = requests.get(url, timeout=<span className="num">10</span>)<br />
        <span className="ln">6</span>    soup = BeautifulSoup(res.text, <span className="str">"html.parser"</span>)<br />
        <span className="ln">7</span>    <span className="kw">return</span> [h.get_text() <span className="kw">for</span> h <span className="kw">in</span> soup.select(<span className="str">"h2.headline"</span>)]<br />
        <span className="ln">8</span><br />
        <span className="ln">9</span><span className="com"># quick test run</span><br />
        <span className="ln">10</span><span className="kw">if</span> __name__ == <span className="str">"__main__"</span>:<br />
        <span className="ln">11</span>    <span className="kw">for</span> title <span className="kw">in</span> fetch_headlines(<span className="str">"https://example-news.com"</span>):<br />
        <span className="ln">12</span>        <span className="fn">print</span>(title)
      </>
    ),
    "utils.py": (
      <>
        <span className="ln">1</span><span className="kw">import</span> re<br />
        <span className="ln">2</span><br />
        <span className="ln">3</span><span className="kw">def</span> <span className="fn">clean_text</span>(text):<br />
        <span className="ln">4</span>    <span className="com"># Remove extra whitespaces</span><br />
        <span className="ln">5</span>    <span className="kw">return</span> re.sub(<span className="str">r'\s+'</span>, <span className="str">' '</span>, text).strip()<br />
        <span className="ln">6</span><br />
        <span className="ln">7</span><span className="kw">if</span> __name__ == <span className="str">"__main__"</span>:<br />
        <span className="ln">8</span>    sample = <span className="str">"  Too   many    spaces  "</span><br />
        <span className="ln">9</span>    <span className="fn">print</span>(clean_text(sample))
      </>
    ),
    "requirements.txt": (
      <>
        <span className="ln">1</span>requests&gt;=<span className="num">2.31.0</span><br />
        <span className="ln">2</span>beautifulsoup4&gt;=<span className="num">4.12.0</span>
      </>
    )
  };

  // Helper to map model key to cards styles
  const getModelTagsAndDesc = (m) => {
    let icon = "G";
    let colorClass = "mc-gemini";
    let desc = "High-performance AI model.";
    let tags = ["General"];

    const nameLower = m.label.toLowerCase();
    const providerLower = (m.provider || "").toLowerCase();
    
    if (providerLower.includes("gemini") || nameLower.includes("gemini")) {
      icon = "G";
      colorClass = "mc-gemini";
      desc = "Google's flagship multimodal reasoning model, strong at long-context and code.";
      tags = ["Vision", "1M ctx", "Code"];
    } else if (providerLower.includes("openai") || nameLower.includes("gpt")) {
      icon = "O";
      colorClass = "mc-gpt";
      desc = "OpenAI's high-intelligence general-purpose model.";
      tags = ["Vision", "Tools", "Fast"];
    } else if (providerLower.includes("anthropic") || nameLower.includes("claude")) {
      icon = "C";
      colorClass = "mc-claude";
      desc = "Anthropic's state-of-the-art model for complex reasoning and writing.";
      tags = ["Reasoning", "Writing", "200k ctx"];
    } else if (providerLower.includes("perplexity") || nameLower.includes("sonar")) {
      icon = "P";
      colorClass = "mc-llama";
      desc = "Perplexity's search-grounded model for fast answers.";
      tags = ["Search", "Fast"];
    } else if (providerLower.includes("deepseek") || nameLower.includes("deepseek")) {
      icon = "D";
      colorClass = "mc-grok";
      desc = "DeepSeek's advanced reasoning model with deep search capabilities.";
      tags = ["Reasoning", "Math", "Search"];
    } else if (providerLower.includes("mistral") || nameLower.includes("mistral")) {
      icon = "M";
      colorClass = "mc-mistral";
      desc = "Efficient European model, strong multilingual support.";
      tags = ["Multilingual", "Fast"];
    } else if (providerLower.includes("groq") || nameLower.includes("llama")) {
      icon = "L";
      colorClass = "mc-llama";
      desc = "Meta's open-weight model, optimized for speed.";
      tags = ["Open", "Fast", "Code"];
    }
    
    if (m.vision) {
      if (!tags.includes("Vision")) tags.unshift("Vision");
    }

    return { icon, colorClass, desc, tags };
  };

  // Filter sessions according to current workspace active tab
  const filteredSessions = sessions.filter((s) => {
    const displaySection = getDisplaySection(s.section);
    const searchMatch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return displaySection === activeTab && searchMatch;
  });

  // Render session list item in sidebar
  const renderSessionRow = (session) => {
    const isActive = activeSession && activeSession.id === session.id;
    const isEditing = renamingSessionId === session.id;

    return (
      <div
        key={session.id}
        className={`chat-item relative ${isActive ? "active" : ""}`}
      >
        {isEditing ? (
          <div className="w-full px-2 py-1">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRenameSession(session.id, renameValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSession(session.id, renameValue);
                if (e.key === "Escape") setRenamingSessionId(null);
              }}
              className="w-full px-2 py-1 bg-brand-bg text-brand-text text-xs border border-[#5EE0A8]/30 focus:outline-none font-mono"
              autoFocus
            />
          </div>
        ) : (
          <>
            <svg className="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <button
              onClick={() => {
                setActiveSession(session);
                setMobileSidebarOpen(false);
              }}
              className="ci-title text-left truncate cursor-pointer bg-transparent border-none outline-none font-sans"
            >
              {session.title}
            </button>

            {/* Hover Dot action menu */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuSessionId(
                    openMenuSessionId === session.id ? null : session.id
                  );
                }}
                className="p-1 rounded text-brand-subtext/50 hover:text-brand-text opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
                aria-label="Chat actions"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Rename/Delete menu */}
              {openMenuSessionId === session.id && (
                <div ref={menuRef} className="absolute right-0 top-6 bg-brand-panel-2 border border-brand-border rounded shadow-xl py-1 z-30 w-28 bg-[#181C22]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(session.title);
                      setRenamingSessionId(session.id);
                      setOpenMenuSessionId(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-brand-text hover:bg-brand-bg cursor-pointer bg-transparent border-none font-mono"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#FF6B5C] hover:bg-brand-bg cursor-pointer bg-transparent border-none font-mono"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Group and sort models by provider for easier browsing
  const groupedModels = {};
  combinedModels.forEach((m) => {
    const prov = (m.provider || "other").toLowerCase();
    if (!groupedModels[prov]) {
      groupedModels[prov] = [];
    }
    groupedModels[prov].push(m);
  });

  const providerNames = {
    gemini: "Google Gemini",
    openai: "OpenAI",
    anthropic: "Anthropic Claude",
    deepseek: "DeepSeek",
    mistral: "Mistral AI",
    groq: "Meta Llama (Groq)",
    nvidia: "NVIDIA Nemotron",
    perplexity: "Perplexity AI",
    openrouter: "OpenRouter",
    mock: "Custom & Local"
  };

  const providerOrder = [
    "gemini",
    "openai",
    "anthropic",
    "deepseek",
    "mistral",
    "groq",
    "perplexity",
    "nvidia",
    "openrouter",
    "mock",
    "other"
  ];

  const sortedProviderKeys = Object.keys(groupedModels).sort((a, b) => {
    let indexA = providerOrder.indexOf(a);
    let indexB = providerOrder.indexOf(b);
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    return indexA - indexB;
  });

  return (
    <div className={`dashboard-page-body flex h-screen overflow-hidden relative theme-${currentTheme}`}>
      {/* Toast notifications */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in duration-300">
          <div className="bg-[#13161B] border border-[#5EE0A8]/20 text-[#E9EBEE] px-6 py-2.5 rounded shadow-2xl text-xs font-mono">
            {toast.message}
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        />
      )}

      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="icon-btn md:hidden"
              aria-label="Toggle sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
            <div className="brand-mini">
              <div className="brand-mark-sm"></div>
              <div className="brand-name-sm">NEXINC</div>
            </div>
          </div>

          <div className="topbar-right">
            <button onClick={() => setIsModelModalOpen(true)} className="model-trigger">
              <div className="model-dot"></div>
              <span id="modelLabel">{currentModel?.label || "Gemini 2.5 Pro"}</span>
              <svg className="expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            </button>
            <button onClick={() => setModalType("settings")} className="icon-btn" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33a1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
            <div onClick={() => setModalType("settings")} className="avatar-btn">
              {getInitials(profile.name)}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} id="sidebar">
          <div className="sidebar-top">
            <button onClick={() => handleCreateSession(activeTab === "default" ? "chat" : activeTab)} className="new-chat-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Chat
            </button>
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search chats…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Section tiles */}
          <div className="section-tiles">
            <div
              onClick={() => switchWorkspaceTab("research")}
              className={`section-tile tile-research ${activeTab === "research" ? "active" : ""}`}
            >
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="tile-text">
                <div className="tile-name">RESEARCH</div>
                <div className="tile-sub">Live sources & citations</div>
              </div>
              <svg className="tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            
            <div
              onClick={() => switchWorkspaceTab("private")}
              className={`section-tile tile-private ${activeTab === "private" ? "active" : ""}`}
            >
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div className="tile-text">
                <div className="tile-name">PRIVATE</div>
                <div className="tile-sub">Encrypted, no training</div>
              </div>
              <svg className="tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div
              onClick={() => switchWorkspaceTab("code")}
              className={`section-tile tile-code ${activeTab === "code" ? "active" : ""}`}
            >
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div className="tile-text">
                <div className="tile-name">CODEINC</div>
                <div className="tile-sub">Editor, run & inspect</div>
              </div>
              <svg className="tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          {/* User conversations list */}
          <div className="sidebar-scroll">
            <div className="section-label">
              {activeTab === "default" ? "Chat History" : activeTab + " History"}
            </div>
            
            {loadingSessions ? (
              <div className="text-[11px] font-mono text-[#565D68] px-2 py-3">
                Loading history...
              </div>
            ) : filteredSessions.length > 0 ? (
              filteredSessions.map(renderSessionRow)
            ) : (
              <div
                onClick={() => handleCreateSession(activeTab === "default" ? "chat" : activeTab)}
                className="chat-item"
              >
                <span className="ci-title italic text-[11.5px]">No chats here. Click to start one!</span>
              </div>
            )}
          </div>

          <div className="sidebar-bottom">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{profile.plan === "ultimate" ? "Unlimited msgs" : "34 / 100 msgs"}</span>
              <span>{profile.plan === "ultimate" ? "Ultimate" : "Free"}</span>
            </div>
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: profile.plan === "ultimate" ? "100%" : "34%" }}></div>
            </div>
          </div>
        </div>

        {/* WORKSPACE (swappable views) */}
        <div className="workspace" id="workspace">

          {/* ===== DEFAULT CHAT VIEW ===== */}
          <div className={`view ${activeTab === "default" ? "active" : ""}`} id="viewChat">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="chat-scroll"
              id="chatScroll"
            >
              {isDragging && (
                <div className="absolute inset-0 bg-[#5EE0A8]/10 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center border-2 border-dashed border-[#5EE0A8]">
                  <p className="font-mono text-sm">Drop image to attach</p>
                </div>
              )}

              {!activeSession ? (
                /* Welcome Screen */
                <div className="empty-state" id="emptyState">
                  <div className="empty-node">
                    <div className="ecube">
                      <div className="ef et"></div>
                      <div className="ef es"></div>
                      <div className="ef eb"></div>
                    </div>
                  </div>
                  <h2>What are we building today?</h2>
                  <p>Ask anything — or open Research, Private, or Codeinc from the sidebar for a dedicated workspace.</p>
                  <div className="suggest-row">
                    {welcomeSuggestions.map((card, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCreateSessionWithPrompt(card.prompt, card.section)}
                        className="suggest-chip"
                      >
                        {card.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Conversation Timeline */
                <div className="chat-inner">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-2">
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                      <span className="text-xs font-mono text-brand-subtext">Retrieving...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <span className="text-2xl mb-2">🚀</span>
                      <h3 className="text-xs font-mono">Chat started</h3>
                      <p className="text-[11px] text-[#8A919C] mt-1">
                        Send a message to begin chatting with {currentModel.label}.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.role === "user";
                      let isImage = msg.message_type === "image";
                      let imgUrl = msg.image_url || "";
                      let contentText = msg.content;

                      if (!isImage && msg.content) {
                        try {
                          const parsed = JSON.parse(msg.content);
                          if (parsed && (parsed.type === "multimodal" || parsed.message_type === "image")) {
                            isImage = true;
                            imgUrl = parsed.image || parsed.image_url;
                            contentText = parsed.text || parsed.content;
                          }
                        } catch (e) {}
                      }

                      return (
                        <div key={msg.id} className={`msg ${isUser ? "user" : "assistant"}`}>
                          <div className="msg-avatar">
                            {isUser ? getInitials(profile.name) : ""}
                          </div>
                          <div className="msg-body">
                            <div className="msg-name">
                              {isUser ? "You" : (
                                <span>
                                  🤖 {combinedModels.find((m) => m.key === msg.model_used)?.label || msg.model_used || "NexInc"}
                                </span>
                              )}
                            </div>
                            <div className="msg-text">
                              {isImage && imgUrl && (
                                <div className="mb-2 max-w-sm rounded overflow-hidden border border-[#262B33] bg-[#0D1014]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imgUrl} alt="Staged upload" className="max-h-60 object-contain" />
                                </div>
                              )}
                              <div className="markdown-content">
                                <ReactMarkdown>{contentText}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Default Composer Entry */}
            {activeSession && (
              <div className="composer-wrap">
                {selectedImage && (
                  <div className="max-w-[720px] mx-auto p-3 mb-2 rounded bg-[#181C22] border border-[#262B33] flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedImage} alt="Attachment thumbnail" className="w-10 h-10 object-cover rounded border border-[#262B33]" />
                      <span className="text-xs font-mono text-brand-text truncate max-w-xs">{imageFileName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedImageFile(null);
                        setImageFileName("");
                      }}
                      className="p-1 hover:bg-[#13161B] rounded text-brand-subtext cursor-pointer bg-transparent border-none"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="composer" id="composer">
                  <textarea
                    id="composerInput"
                    placeholder={`Message ${currentModel?.label || "Nexinc"}…`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    rows={1}
                  />
                  <div className="composer-toolbar">
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!currentModel?.vision}
                        className="icon-mini"
                        title={!currentModel?.vision ? "Choose vision-capable model" : "Attach image"}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>
                    </div>
                    <button type="submit" className="send-btn" id="sendBtn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </form>
                <div className="composer-hint">Nexinc can make mistakes. Verify important information.</div>
              </div>
            )}
          </div>

          {/* ===== RESEARCH WORKSPACE ===== */}
          <div className={`view ${activeTab === "research" ? "active" : ""}`} id="viewResearch">
            <div className="ws-header">
              <div className="ws-header-left">
                <div className="ws-icon-big">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <div className="ws-title">Research</div>
                  <div className="ws-subtitle">Searches the live web and grounds answers in sources</div>
                </div>
              </div>
              <button onClick={() => switchWorkspaceTab("default")} className="ws-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to chat
              </button>
            </div>
            <div className="research-body">
              <div className="research-main">
                <div className="research-input-row">
                  <input
                    type="text"
                    id="researchQuery"
                    placeholder="What do you want researched?"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                  />
                  <button onClick={handleStartResearch} className="research-go" id="researchGo">
                    Research
                  </button>
                </div>

                {researchStatus && (
                  <div className="research-status" id="researchStatus">
                    <div className="rdot"></div> Researching — scanning sources across the web
                  </div>
                )}
                
                {researchStep >= 0 && (
                  <div className="research-steps" id="researchSteps">
                    <div className={`research-step ${researchStep > 0 ? "done" : researchStep === 0 ? "active" : ""}`}>
                      <div className="step-check">
                        {researchStep > 0 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      Parsing query intent
                    </div>
                    <div className={`research-step ${researchStep > 1 ? "done" : researchStep === 1 ? "active" : ""}`}>
                      <div className="step-check">
                        {researchStep > 1 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      Searching 24 sources
                    </div>
                    <div className={`research-step ${researchStep > 2 ? "done" : researchStep === 2 ? "active" : ""}`}>
                      <div className="step-check">
                        {researchStep > 2 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      Cross-checking claims
                    </div>
                    <div className={`research-step ${researchStep > 3 ? "done" : researchStep === 3 ? "active" : ""}`}>
                      <div className="step-check">
                        {researchStep > 3 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      Drafting grounded answer
                    </div>
                  </div>
                )}

                {researchDone && (
                  <div className="research-findings" id="researchFindings">
                    <h3>Summary Findings</h3>
                    <p>
                      Three throughlines stand out across recent coverage: rising energy density from new cathode chemistries <span className="cite-chip">1</span>, a shift toward sulfide-based solid electrolytes for better safety <span className="cite-chip">2</span>, and early but real progress on manufacturing scale-up <span className="cite-chip">3</span>.
                    </p>
                    <p>
                      Most analysts still peg mass-market EV adoption several years out, with current deployment concentrated in premium vehicle tiers and consumer electronics pilots <span className="cite-chip">4</span>.
                    </p>
                  </div>
                )}
              </div>
              <div className="research-sidebar">
                <h4>Sources Found</h4>
                <div id="sourceCards">
                  <div className="source-card">
                    <div className="sc-domain">reuters.com</div>
                    <div className="sc-title">Battery makers race to scale solid-state production</div>
                    <div className="sc-snippet">Coverage of manufacturing pilots moving from lab to limited production lines.</div>
                  </div>
                  <div className="source-card">
                    <div className="sc-domain">nature.com</div>
                    <div className="sc-title">Sulfide electrolytes show improved thermal stability</div>
                    <div className="sc-snippet">Peer-reviewed comparison of electrolyte chemistries and safety margins.</div>
                  </div>
                  <div className="source-card">
                    <div className="sc-domain">techcrunch.com</div>
                    <div className="sc-title">Why solid-state batteries keep missing deadlines</div>
                    <div className="sc-snippet">Analysis of the gap between lab breakthroughs and shippable products.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== PRIVATE WORKSPACE ===== */}
          <div className={`view ${activeTab === "private" ? "active" : ""}`} id="viewPrivate">
            <div className="ws-header">
              <div className="ws-header-left">
                <div className="ws-icon-big">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <div className="ws-title">Private</div>
                  <div className="ws-subtitle">Encrypted client-side · excluded from training</div>
                </div>
              </div>
              <button onClick={() => switchWorkspaceTab("default")} className="ws-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to chat
              </button>
            </div>

            {!privateStarted ? (
              <div className="private-body" id="privateIntro">
                <div className="private-shield">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h2>Start a private conversation</h2>
                <p>Private chats are encrypted on your device, never used for model training, and only ever appear in this Private section — not in your regular history.</p>
                <div className="private-feature-list">
                  <div className="priv-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    No training, no retention beyond this session
                  </div>
                  <div className="priv-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Doesn't sync to other devices automatically
                  </div>
                  <div className="priv-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Stored separately from your regular chat history
                  </div>
                </div>
                <button onClick={() => setPrivateStarted(true)} className="private-cta" id="startPrivateBtn">
                  Start private chat
                </button>
              </div>
            ) : (
              <div className="private-active-chat show" id="privateActiveChat">
                <div className="private-chat-scroll">
                  <div className="private-banner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    This conversation is private and encrypted
                  </div>
                  
                  <div id="privateChatInner" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                    {privateMessages.map((msg) => (
                      <div key={msg.id} className={`msg ${msg.role === "user" ? "user" : "assistant"}`}>
                        <div className="msg-avatar">
                          {msg.role === "user" ? getInitials(profile.name) : ""}
                        </div>
                        <div className="msg-body">
                          <div className="msg-name">
                            {msg.role === "user" ? "You" : "Nexinc"}
                          </div>
                          <div className="msg-text">
                            <div className="markdown-content">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {privateTyping && (
                      <div className="msg assistant">
                        <div className="msg-avatar"></div>
                        <div className="msg-body">
                          <div className="msg-name">Nexinc</div>
                          <div className="typing-dots">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={privateEndRef} />
                  </div>
                </div>
                
                <div className="composer-wrap">
                  <form onSubmit={handlePrivateSend} className="composer">
                    <textarea
                      id="privateInput"
                      placeholder="Message privately…"
                      value={privateInputText}
                      onChange={(e) => setPrivateInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePrivateSend(e);
                        }
                      }}
                      rows={1}
                    />
                    <div className="composer-toolbar">
                      <div></div>
                      <button type="submit" className="send-btn" id="privateSendBtn" style={{ background: "var(--private)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </form>
                  <div className="composer-hint">Encrypted · not used for training</div>
                </div>
              </div>
            )}
          </div>

          {/* ===== CODEINC WORKSPACE ===== */}
          <div className={`view ${activeTab === "code" ? "active" : ""}`} id="viewCode">
            <div className="ws-header">
              <div className="ws-header-left">
                <div className="ws-icon-big">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <div className="ws-title">Codeinc</div>
                  <div className="ws-subtitle">Generate, edit, and run code in a sandbox</div>
                </div>
              </div>
              <button onClick={() => switchWorkspaceTab("default")} className="ws-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to chat
              </button>
            </div>
            <div className="code-body">
              <div className="file-tree">
                <h4>Workspace</h4>
                {["scraper.py", "utils.py", "requirements.txt"].map((file) => (
                  <div
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`file-row ${activeFile === file ? "active" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    {file}
                  </div>
                ))}
              </div>
              
              <div className="code-main">
                <div className="code-tabs">
                  <div className="code-tab active">{activeFile}</div>
                </div>
                <div className="code-editor">
                  {fileContents[activeFile]}
                </div>
                
                <div className="code-run-row">
                  <button onClick={handleRunCode} className="run-btn" id="runBtn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run
                  </button>
                  <span className="run-status" id="runStatus">
                    {runStatusText}
                  </span>
                </div>
                
                <div className={`code-console ${codeConsoleOpen ? "open" : ""}`} id="codeConsole">
                  {consoleLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`out-line ${line.startsWith("✓") ? "out-ok" : ""}`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODEL PICKER BLURRED BACKDROP MODAL */}
      {isModelModalOpen && (
        <div className="modal-backdrop show" id="modelBackdrop">
          <div className="model-modal">
            <div className="mm-head">
              <button onClick={() => setIsModelModalOpen(false)} className="mm-close" id="closeModelModal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h2>Choose a model</h2>
              <p>Switch anytime — your conversation carries over.</p>
            </div>
            
            <div className="mm-body">
              {sortedProviderKeys.map((prov) => {
                const provModels = groupedModels[prov];
                const providerLabel = providerNames[prov] || (prov.charAt(0).toUpperCase() + prov.slice(1));
                return (
                  <div key={prov} className="provider-section">
                    <div className="provider-title">{providerLabel}</div>
                    <div className="mm-grid">
                      {provModels.map((m) => {
                        const isSelected = currentModel?.key === m.key;
                        const isLocked = m.tier === "ultimate" && profile.plan !== "ultimate";
                        const isShaking = shakingCardId === m.key;
                        const { icon, colorClass, desc, tags } = getModelTagsAndDesc(m);

                        return (
                          <div
                            key={m.key}
                            onClick={() => handleSelectModel(m)}
                            className={`model-card ${colorClass} ${isSelected ? "selected" : ""} ${isLocked ? "locked" : ""} ${isShaking ? "shake-sm" : ""}`}
                          >
                            {isSelected && (
                              <div className="mc-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                            <div className="mc-top">
                              <div className="mc-icon">{icon}</div>
                              <span className={`mc-badge ${isLocked ? "soon" : "live"}`}>
                                {isLocked ? "Premium" : "Live"}
                              </span>
                            </div>
                            <div className="mc-name">{m.label}</div>
                            <div className="mc-desc">{desc}</div>
                            <div className="mc-tags">
                              {tags.map((tag) => (
                                <span key={tag} className="mc-tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL DIALOG OVERLAY */}
      {modalType === "settings" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setModalType(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
          />
          <div className="bg-[#13161B] w-full max-w-md rounded border border-[#262B33] p-6 shadow-2xl relative z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded border border-[#262B33] bg-[#0B0D10] hover:bg-[#FF6B5C] hover:text-white flex items-center justify-center font-black cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-px text-brand-text"
              aria-label="Close settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Title */}
            <div>
              <h2 className="text-xl font-bold font-quicksand text-brand-text flex items-center gap-2">
                <span>⚙️</span> Settings
              </h2>
              <p className="text-brand-subtext text-xs font-light mt-0.5">
                Customize your NexInc workspace and subscription plan.
              </p>
            </div>

            {/* Profile Card Summary */}
            <div className="p-3 bg-[#0B0D10] rounded border border-[#262B33] space-y-1 shadow-inner">
              <span className="block text-[9px] uppercase font-black tracking-wider text-brand-subtext">Active User</span>
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-brand-text">{profile.name}</span>
                <span className="font-bold text-brand-subtext">{profile.email || "user@nexinc.ai"}</span>
              </div>
            </div>

            {/* Theme Selector Option */}
            <div className="space-y-3">
              <span className="block text-[9px] uppercase font-black tracking-wider text-brand-subtext">Interface Theme</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "default", label: "NexInc Dark", desc: "Default space" },
                  { id: "midnight", label: "Midnight Blue", desc: "Deep space blue" },
                  { id: "oled", label: "OLED Black", desc: "Pitch black OLED" },
                  { id: "cyberpunk", label: "Cyberpunk", desc: "Matrix green style" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTheme(t.id);
                      localStorage.setItem("theme", t.id);
                    }}
                    className={`flex flex-col items-start p-3 rounded border text-left cursor-pointer transition-all ${
                      currentTheme === t.id
                        ? "bg-[#181C22] border-[#5EE0A8]"
                        : "bg-[#0B0D10] border-[#262B33] hover:border-[#8A919C]/50"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#E9EBEE]">{t.label}</span>
                    <span className="text-[10px] text-[#8A919C] mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Subscription selector */}
            <div className="space-y-3">
              <span className="block text-[9px] uppercase font-black tracking-wider text-brand-subtext">Membership Plan</span>
              <div className="flex justify-between items-center bg-[#0B0D10] p-4 rounded border border-[#262B33]">
                <div>
                  <span className="block text-xs font-bold text-brand-text">
                    Plan: <span className="text-[#5EE0A8] uppercase">{profile.plan}</span>
                  </span>
                  <span className="block text-[10px] text-brand-subtext mt-0.5">
                    {profile.plan === "ultimate"
                      ? "All premium intelligence models unlocked."
                      : "Upgrade to unlock Claude 3.5 Sonnet, GPT-5, and custom GPUs."}
                  </span>
                </div>
                <div>
                  {profile.plan === "ultimate" ? (
                    <button
                      onClick={handleDowngradeOrPortalFromSettings}
                      className="px-3.5 py-1.5 bg-[#181C22] border border-[#262B33] text-brand-text font-bold text-xs rounded hover:bg-brand-bg transition-all cursor-pointer font-mono"
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      onClick={handleUpgradeFromSettings}
                      className="px-3.5 py-1.5 bg-[#5EE0A8] text-black font-bold text-xs rounded hover:bg-[#5EE0A8]/85 hover:shadow transition-all cursor-pointer font-mono"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#262B33]">
              <button
                onClick={handleLogout}
                className="w-full py-2 border border-[#FF6B5C]/30 text-[#FF6B5C] font-bold text-xs rounded hover:bg-[#FF6B5C]/10 transition-all cursor-pointer font-mono"
              >
                Sign Out Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
