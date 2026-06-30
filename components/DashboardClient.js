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

const modeRailX = { text: '0%', visual: '100%', codeinc: '200%', nexstudy: '300%' };
const modeColorVar = {
  text: ['var(--signal)', 'var(--signal-glow)'],
  visual: ['var(--visual)', 'var(--visual-glow)'],
  codeinc: ['var(--code-accent)', 'var(--code-glow)'],
  nexstudy: ['var(--study-accent, #a78bfa)', 'var(--study-glow, rgba(167,139,250,0.35))']
};

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
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState(null);

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
  const [activeFile, setActiveFile] = useState("index.html");
  const [codeConsoleOpen, setCodeConsoleOpen] = useState(false);
  const [runStatusText, setRunStatusText] = useState("Sandbox idle");
  const [consoleLines, setConsoleLines] = useState(["$ python scraper.py"]);
  
  // 3-section design & Mode Switcher states
  const [mode, setMode] = useState("text"); // 'text', 'visual', 'codeinc'
  
  // Visual Workspace states
  const [visualType, setVisualType] = useState("image"); // 'image', 'video'
  const [visualPrompt, setVisualPrompt] = useState("Isometric 3D node cube, charcoal background, signal-green glow, studio lighting");
  const [visualStyle, setVisualStyle] = useState("Photoreal");
  const [visualAspect, setVisualAspect] = useState("1:1");
  const [visualDuration, setVisualDuration] = useState("8s");
  const [visualStatusText, setVisualStatusText] = useState("");
  const [visualGenerating, setVisualGenerating] = useState(false);
  const [visualTiles, setVisualTiles] = useState([]); // Array of generated tiles { style, aspect, isVideo }
  const [visualHistory, setVisualHistory] = useState([
    { id: 1, title: "Node cube, teal glow", style: "Isometric", aspect: "1:1", isVideo: false, thumbClass: "vhist-thumb-1" },
    { id: 2, title: "Console UI mockup", style: "Photoreal", aspect: "16:9", isVideo: false, thumbClass: "vhist-thumb-2" }
  ]);
  
  // Codeinc Workspace states
  const [codePrompt, setCodePrompt] = useState("");
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [codeGenStatus, setCodeGenStatus] = useState("Awaiting prompt · HTML/CSS/JS");
  const [nvidiaModel, setNvidiaModel] = useState("meta/llama-3.3-70b-instruct");
  const [managerModel, setManagerModel] = useState("groq/llama-3.3-70b-versatile");
  const [copilotStep, setCopilotStep] = useState("idle"); // 'idle', 'analyzing', 'options_ready', 'planning', 'plan_ready', 'coding', 'qa', 'finished', 'error'
  const [copilotLogs, setCopilotLogs] = useState([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [suggestedDesign, setSuggestedDesign] = useState("");
  const [followUpOptions, setFollowUpOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [customReplyText, setCustomReplyText] = useState("");
  const [copilotPlan, setCopilotPlan] = useState("");
  const [hiddenPrompt, setHiddenPrompt] = useState("");
  const [qaCritiqueLog, setQaCritiqueLog] = useState("");
  const [copilotPanelOpen, setCopilotPanelOpen] = useState(true);

  const [codeProjects, setCodeProjects] = useState([
    {
      id: "project-default",
      name: "web-project",
      files: {
        "index.html": ``,
        "style.css": ``,
        "script.js": ``
      }
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState("project-default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("codeinc_projects");
      const savedActive = localStorage.getItem("codeinc_active_project");
      const savedCoding = localStorage.getItem("codeinc_coding_model");
      const savedManager = localStorage.getItem("codeinc_manager_model");
      if (savedCoding) setNvidiaModel(savedCoding);
      if (savedManager) setManagerModel(savedManager);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setCodeProjects(parsed);
            const activeId = savedActive || parsed[0].id;
            setActiveProjectId(activeId);
            const activeProj = parsed.find(p => p.id === activeId);
            if (activeProj) {
              setEditorFilesHtml(activeProj.files);
              const files = Object.keys(activeProj.files);
              setActiveFile(files[0] || "");
            }
          }
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("codeinc_coding_model", nvidiaModel);
  }, [nvidiaModel]);

  useEffect(() => {
    localStorage.setItem("codeinc_manager_model", managerModel);
  }, [managerModel]);

  const [currentPreviewFile, setCurrentPreviewFile] = useState("index.html");
  const [previewHistory, setPreviewHistory] = useState(["index.html"]);
  const [previewHistoryIndex, setPreviewHistoryIndex] = useState(0);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  const navigatePreviewTo = (file) => {
    const newHistory = previewHistory.slice(0, previewHistoryIndex + 1);
    newHistory.push(file);
    setPreviewHistory(newHistory);
    setPreviewHistoryIndex(newHistory.length - 1);
    setCurrentPreviewFile(file);
  };

  const handlePreviewBack = () => {
    if (previewHistoryIndex > 0) {
      setPreviewHistoryIndex(previewHistoryIndex - 1);
      setCurrentPreviewFile(previewHistory[previewHistoryIndex - 1]);
    }
  };

  const handlePreviewForward = () => {
    if (previewHistoryIndex < previewHistory.length - 1) {
      setPreviewHistoryIndex(previewHistoryIndex + 1);
      setCurrentPreviewFile(previewHistory[previewHistoryIndex + 1]);
    }
  };

  useEffect(() => {
    const handlePreviewNavigate = (event) => {
      if (event.data && event.data.type === "preview-navigate") {
        const targetFile = event.data.file;
        navigatePreviewTo(targetFile);
      }
    };
    window.addEventListener("message", handlePreviewNavigate);
    return () => window.removeEventListener("message", handlePreviewNavigate);
  }, [previewHistory, previewHistoryIndex]);
  
  // Loading indicators
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // UI Alerts / Toast
  const [toast, setToast] = useState({ message: "", visible: false });
  const [customModal, setCustomModal] = useState(null);
  const [customModalInputVal, setCustomModalInputVal] = useState("");
  const [createResourceModalOpen, setCreateResourceModalOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("html"); // 'html', 'jsx', 'js', 'css', 'folder', 'custom'
  const [selectedParentFolder, setSelectedParentFolder] = useState("/");
  const [collapsedFolders, setCollapsedFolders] = useState({});

  const buildFileTree = (files) => {
    const root = { name: "Root", type: "folder", children: {}, path: "" };
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        const isLast = i === parts.length - 1;
        const currentPath = current.path ? `${current.path}/${part}` : part;
        
        if (!current.children) {
          current.children = {};
          current.type = "folder";
        }
        
        if (isLast) {
          if (part === ".keep") {
            current.type = "folder";
          } else {
            current.children[part] = {
              name: part,
              type: "file",
              path: currentPath
            };
          }
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              type: "folder",
              children: {},
              path: currentPath
            };
          }
          current = current.children[part];
        }
      }
    });
    return root;
  };

  const toggleFolder = (folderPath, e) => {
    if (e) e.stopPropagation();
    setCollapsedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const renderSidebarTree = (node, depth = 0) => {
    if (node.path === "") {
      return (
        <div className="space-y-1">
          {Object.keys(node.children)
            .sort()
            .map(key => renderSidebarTree(node.children[key], depth))}
        </div>
      );
    }

    const isFolder = node.type === "folder";
    const isCollapsed = collapsedFolders[node.path];
    const isFileActive = activeFile === node.path;
    const paddingLeft = `${depth * 12 + 6}px`;

    if (isFolder) {
      return (
        <div key={node.path} className="folder-node-wrapper">
          <div
            onClick={(e) => toggleFolder(node.path, e)}
            className="chat-item folder-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              paddingLeft: paddingLeft,
              paddingTop: "4px",
              paddingBottom: "4px",
              minHeight: "28px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "10px", height: "10px" }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    width: "8px",
                    height: "8px",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.15s ease",
                    color: "var(--text-dim)"
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
              <span className="ci-title font-sans font-semibold text-xs text-[#8A919C] hover:text-white transition-colors" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {node.name}/
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParentFolder(node.path);
                  setNewResourceType("html");
                  setNewResourceName("");
                  setCreateResourceModalOpen(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#5EE0A8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
                title={`Create file/folder inside ${node.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showCustomConfirm("Delete Folder", `Are you sure you want to delete folder ${node.name}? This will delete all files inside it.`, () => {
                    setEditorFilesHtml(prev => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(key => {
                        if (key === node.path || key.startsWith(node.path + "/")) {
                          delete updated[key];
                        }
                      });
                      return updated;
                    });
                    showToast(`Folder ${node.name} deleted!`);
                  });
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
                title={`Delete ${node.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#FF5240" strokeWidth="2.5" style={{ width: "11px", height: "11px" }}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>
          {!isCollapsed && (
            <div className="folder-children">
              {Object.keys(node.children)
                .sort()
                .map(key => renderSidebarTree(node.children[key], depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const ext = node.name.split('.').pop() || '';
      let icon = (
        <span className="text-[9px] font-bold px-1 rounded bg-[#8A919C]/15 text-[#8A919C] border border-[#8A919C]/25" style={{ flexShrink: 0, fontFamily: "var(--mono)" }}>txt</span>
      );
      if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
        icon = (
          <span className="text-[9px] font-bold px-1 rounded bg-[#F7DF1E]/10 text-[#F7DF1E] border border-[#F7DF1E]/20" style={{ flexShrink: 0, fontFamily: "var(--mono)" }}>js</span>
        );
      } else if (ext === 'html') {
        icon = (
          <span className="text-[9px] font-bold px-1.5 rounded bg-[#E34F26]/10 text-[#E34F26] border border-[#E34F26]/20" style={{ flexShrink: 0, fontFamily: "var(--mono)" }}>html</span>
        );
      } else if (ext === 'css') {
        icon = (
          <span className="text-[9px] font-bold px-1 rounded bg-[#1572B6]/10 text-[#1572B6] border border-[#1572B6]/20" style={{ flexShrink: 0, fontFamily: "var(--mono)" }}>css</span>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => setActiveFile(node.path)}
          className={`chat-item ${isFileActive ? "active" : ""}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            paddingLeft: paddingLeft,
            paddingTop: "4px",
            paddingBottom: "4px",
            minHeight: "28px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
            {icon}
            <span className="ci-title font-sans text-xs" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {node.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                showCustomPrompt("Rename File", `Rename ${node.name} to:`, node.name, node.name, (newName) => {
                  if (newName && newName.trim() && newName.trim() !== node.name) {
                    const trimmed = newName.trim();
                    const newPath = node.path.substring(0, node.path.lastIndexOf('/') + 1) + trimmed;
                    setEditorFilesHtml(prev => {
                      const updated = { ...prev };
                      updated[newPath] = updated[node.path];
                      delete updated[node.path];
                      return updated;
                    });
                    if (activeFile === node.path) {
                      setActiveFile(newPath);
                    }
                    showToast(`Renamed to ${trimmed}`);
                  }
                });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              title={`Rename ${node.name}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "11px", height: "11px" }}>
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                showCustomConfirm("Delete File", `Are you sure you want to delete ${node.name}?`, () => {
                  setEditorFilesHtml(prev => {
                    const updated = { ...prev };
                    delete updated[node.path];
                    return updated;
                  });
                  if (activeFile === node.path) {
                    const remaining = Object.keys(editorFilesHtml).filter(f => f !== node.path);
                    setActiveFile(remaining[0] || "");
                  }
                  showToast(`${node.name} deleted!`);
                });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              title={`Delete ${node.name}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#FF5240" strokeWidth="2.5" style={{ width: "11px", height: "11px" }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>
      );
    }
  };

  const getExistingFolders = () => {
    const folders = new Set();
    if (editorFilesHtml) {
      Object.keys(editorFilesHtml).forEach(path => {
        const parts = path.split('/');
        if (parts.length > 1) {
          let currentPath = "";
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            folders.add(currentPath);
          }
        }
      });
    }
    return Array.from(folders).sort();
  };

  useEffect(() => {
    if (activeFile && activeFile !== "Preview") {
      if (activeFile.endsWith('/.keep')) {
        setSelectedParentFolder(activeFile.slice(0, -6));
      } else {
        const parts = activeFile.split('/');
        if (parts.length > 1) {
          setSelectedParentFolder(parts.slice(0, -1).join('/'));
        } else {
          setSelectedParentFolder("/");
        }
      }
    } else {
      setSelectedParentFolder("/");
    }
  }, [activeFile]);

  // Refs for closing menus on click-outside
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const privateEndRef = useRef(null);

  // Streaming/Rendering abort controller ref
  const activeAbortControllerRef = useRef(null);
  const copilotAbortControllerRef = useRef(null);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (codeGenerating) {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [codeGenerating]);

  const stopCopilotWorkflow = () => {
    if (copilotAbortControllerRef.current) {
      copilotAbortControllerRef.current.abort();
      copilotAbortControllerRef.current = null;
    }
    setCopilotStep("idle");
    setCodeGenerating(false);
    setCodeGenStatus("Workflow cancelled by user");
    setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "⚠️ Workflow cancelled / reset by user." }]);
  };

  const handleResetEntireWorkspace = () => {
    showCustomConfirm(
      "Reset Entire Workspace", 
      "Are you sure you want to completely restart Codeinc? This will delete all files in the current project, reset all memory, and clear the Copilot logs.", 
      () => {
        if (copilotAbortControllerRef.current) {
          try { copilotAbortControllerRef.current.abort(); } catch (e) {}
          copilotAbortControllerRef.current = null;
        }
        
        setEditorFilesHtml({
          "index.html": ""
        });
        
        setActiveFile("index.html");
        setCopilotStep("idle");
        setCopilotLogs([]);
        setFollowUpQuestion("");
        setSuggestedDesign("");
        setFollowUpOptions([]);
        setCopilotPlan("");
        setHiddenPrompt("");
        setCodePrompt("");
        setCodeGenerating(false);
        setCodeGenStatus("Awaiting prompt · HTML/CSS/JS");
        
        showToast("Codeinc session and files completely reset!");
      }
    );
  };

  // Helper to show temporary toast messages
  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const showCustomConfirm = (title, message, onConfirm) => {
    setCustomModal({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setCustomModal(null);
      },
      onCancel: () => setCustomModal(null)
    });
  };

  const showCustomPrompt = (title, message, placeholder, defaultValue, onConfirm) => {
    setCustomModalInputVal(defaultValue || "");
    setCustomModal({
      type: 'prompt',
      title,
      message,
      placeholder,
      defaultValue,
      onConfirm: (val) => {
        onConfirm(val);
        setCustomModal(null);
      },
      onCancel: () => setCustomModal(null)
    });
  };

  const handleCreateResource = () => {
    if (!newResourceName.trim()) {
      showToast("Please enter a name.");
      return;
    }

    let name = newResourceName.trim();
    
    // Auto-append extensions if not already present
    if (newResourceType === "html" && !name.toLowerCase().endsWith(".html")) {
      name += ".html";
    } else if (newResourceType === "jsx" && !name.toLowerCase().endsWith(".jsx")) {
      name += ".jsx";
    } else if (newResourceType === "js" && !name.toLowerCase().endsWith(".js")) {
      name += ".js";
    } else if (newResourceType === "css" && !name.toLowerCase().endsWith(".css")) {
      name += ".css";
    }

    const fullPath = selectedParentFolder === "/" ? name : `${selectedParentFolder}/${name}`;

    if (newResourceType === "folder") {
      const placeholder = fullPath + "/.keep";
      setEditorFilesHtml(prev => ({ ...prev, [placeholder]: "/* folder placeholder */" }));
      setActiveFile(placeholder);
      showToast(`Created folder ${fullPath}`);
    } else {
      setEditorFilesHtml(prev => ({ ...prev, [fullPath]: "" }));
      setActiveFile(fullPath);
      showToast(`Created file ${fullPath}`);
    }

    setNewResourceName("");
    setCreateResourceModalOpen(false);
  };

  // Handle parsing of SSE response stream from backend
  const handleAiResponseStream = async (response, tempAiMsg, sessionId, modelKey, savedUserMsg) => {
    let aiReplyText = "";
    
    // Create new abort controller for this streaming request
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      if (!response.ok) {
        aiReplyText = "⚠️ Failed to reach the AI model server. Please try again.";
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/event-stream")) {
          // Initialize empty message content for assistant in state
          setMessages((prev) => {
            const hasTempAi = prev.some((m) => m.id === tempAiMsg.id);
            if (hasTempAi) {
              return prev.map((m) => (m.id === tempAiMsg.id ? { ...tempAiMsg, content: "" } : m));
            } else {
              return [...prev, { ...tempAiMsg, content: "" }];
            }
          });

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            // Check if aborted
            if (abortController.signal.aborted) {
              reader.releaseLock();
              break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    aiReplyText += delta;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === tempAiMsg.id ? { ...m, content: aiReplyText } : m))
                    );
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } else {
          // Fallback to JSON
          const data = await response.json();
          aiReplyText = data.choices?.[0]?.message?.content || "⚠️ No response choices returned by model.";
        }
      }
    } catch (streamErr) {
      if (streamErr.name === "AbortError") {
        console.log("Stream aborted by user action.");
        return; // Don't save to DB if aborted
      }
      console.error("Stream reading error:", streamErr);
      aiReplyText = aiReplyText || "⚠️ Connection interrupted while receiving response.";
    } finally {
      if (activeAbortControllerRef.current === abortController) {
        activeAbortControllerRef.current = null;
      }
    }

    // Save AI Message to Database
    try {
      const savedAiMsg = await addMessage(supabase, {
        sessionId: sessionId,
        userId: profile.id,
        role: "assistant",
        content: aiReplyText,
        modelUsed: modelKey,
      });

      // Replace assistant message state with saved one
      setMessages((prev) => {
        const updated = prev.map((m) => (m.id === tempAiMsg.id ? savedAiMsg : m));
        if (savedUserMsg) {
          return updated.map((m) => (m.id === savedUserMsg.id ? savedUserMsg : m));
        }
        return updated;
      });
    } catch (saveErr) {
      console.error("Error saving AI response to database:", saveErr);
      // Fallback: keep the local state response but mark it with its final state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAiMsg.id ? { ...tempAiMsg, content: aiReplyText } : m
        )
      );
    }
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
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

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

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

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

      await handleAiResponseStream(response, tempAiMsg, newSession.id, currentModelKey, savedUserMsg);
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

  // Operations: Clear Messages in Session
  const handleClearMessages = async (sessionId) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("session_id", sessionId);

      if (error) throw error;

      if (activeSession && activeSession.id === sessionId) {
        setMessages([]);
      }
      setOpenMenuSessionId(null);
      showToast("Conversation cleared.");
    } catch (err) {
      console.error("Error clearing messages:", err);
      showToast("Failed to clear messages.");
    }
  };

  // Operations: Export Session to Markdown
  const handleExportSession = async (session) => {
    try {
      const sessionMessages = await getMessages(supabase, session.id);
      if (sessionMessages.length === 0) {
        showToast("Cannot export an empty chat.");
        setOpenMenuSessionId(null);
        return;
      }
      const text = sessionMessages
        .map((m) => `### ${m.role === "user" ? "User" : "Assistant"}\n\n${m.content}\n\n---`)
        .join("\n\n");
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOpenMenuSessionId(null);
      showToast("Chat exported successfully!");
    } catch (err) {
      console.error("Error exporting session:", err);
      showToast("Failed to export chat.");
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

      await handleAiResponseStream(response, tempAiMsg, activeSession.id, activeModel.key);
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
      window.location.href = "/pricing?from=settings";
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
        window.location.href = "/pricing?from=settings";
      }
    } catch (err) {
      console.error("Billing Portal Error:", err);
      window.location.href = "/pricing?from=settings";
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
    if (tab === "code") {
      setMode("codeinc");
    } else if (tab === "research" || tab === "private" || tab === "default") {
      setMode("text");
    }
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

  // 3-section design mode change handler
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "text") {
      setActiveTab("default");
      if (activeSession && getDisplaySection(activeSession.section) !== "default") {
        setActiveSession(null);
      }
    } else if (newMode === "codeinc") {
      setActiveTab("code");
      if (activeSession && getDisplaySection(activeSession.section) !== "code") {
        setActiveSession(null);
      }
    } else if (newMode === "visual") {
      // Visual mode has no active Tab in text history, activeTab stays or goes to default
    } else if (newMode === "nexstudy") {
      // NexStudy – dedicated study workspace
      setActiveTab("default");
    }
    setMobileSidebarOpen(false);
  };

  const [editorFilesHtml, setEditorFilesHtml] = useState({
    "index.html": ``,
    "style.css": ``,
    "script.js": ``
  });

  useEffect(() => {
    if (activeProjectId && editorFilesHtml) {
      setCodeProjects(prev => {
        const updated = prev.map(p => {
          if (p.id === activeProjectId) {
            return { ...p, files: editorFilesHtml };
          }
          return p;
        });
        localStorage.setItem("codeinc_projects", JSON.stringify(updated));
        localStorage.setItem("codeinc_active_project", activeProjectId);
        return updated;
      });
    }
  }, [editorFilesHtml, activeProjectId]);

  const formatCodeForEditor = (code) => {
    if (!code) return "";
    const lines = code.split("\n");
    return lines.map((line, idx) => {
      let escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      
      const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/|&lt;!--[\s\S]*?--&gt;)|("[^"]*"|'[^']*'|`[^`]*`)|(\b(?:const|let|var|function|return|import|export|if|else|for|while|class|from|document|window)\b)/g;
      escaped = escaped.replace(tokenRegex, (match, comment, string, keyword) => {
        if (comment) return `<span class="com">${comment}</span>`;
        if (string) return `<span class="str">${string}</span>`;
        if (keyword) return `<span class="kw">${keyword}</span>`;
        return match;
      });
        
      return `<span class="ln">${idx + 1}</span>${escaped}`;
    }).join("\n");
  };

  const cleanSyntaxHighlightedHtml = (content) => {
    if (!content) return "";
    const cleanHtml = content.replace(/<span class="ln">\d+<\/span>/g, '');
    if (typeof window !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cleanHtml;
      return tempDiv.textContent || tempDiv.innerText || "";
    }
    return cleanHtml
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  const downloadFile = (fileName, content) => {
    if (!content) return;
    const plainText = cleanSyntaxHighlightedHtml(content);
    
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${fileName} downloaded successfully!`);
  };

  const parseWorkspaceFiles = (accumulatedText) => {
    const files = {};
    const blockRegex = /```([a-zA-Z0-9+#-]+)?\n([\s\S]*?)(?:```|$)/g;
    let match;
    
    while ((match = blockRegex.exec(accumulatedText)) !== null) {
      const lang = (match[1] || "").toLowerCase();
      const body = match[2];
      const lines = body.split("\n");
      let fileName = "";
      
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        const line = lines[i].trim();
        const fileMatch = line.match(/(?:<!--|\/\*|\/\/|#)\s*([a-zA-Z0-9._/:-]+)\s*(?:-->|\*\/)?/);
        if (fileMatch) {
          fileName = fileMatch[1].trim();
          break;
        }
      }
      
      if (!fileName) {
        if (lang === "html") fileName = "index.html";
        else if (lang === "css") fileName = "style.css";
        else if (lang === "javascript" || lang === "js") fileName = "script.js";
        else if (lang === "python" || lang === "py") fileName = "main.py";
        else fileName = `code_${lang || "text"}.txt`;
      }
      
      if (fileName.endsWith("/")) {
        fileName = fileName.slice(0, -1) + "/.keep";
      }
      
      const bodyTrimmed = body.trim();
      const isDelete = bodyTrimmed === "delete" || 
                       bodyTrimmed.toLowerCase().includes("delete file") || 
                       bodyTrimmed === "// DELETE" || 
                       bodyTrimmed === "/* DELETE */" || 
                       bodyTrimmed === "# DELETE" ||
                       bodyTrimmed === "<!-- DELETE -->";
                       
      let renameTo = null;
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        const line = lines[i].trim();
        const renameMatch = line.match(/(?:rename to|RENAME TO)\s*([a-zA-Z0-9._/:-]+)/);
        if (renameMatch) {
          renameTo = renameMatch[1].trim();
          break;
        }
      }
      
      if (isDelete) {
        files[fileName] = { action: "delete" };
      } else if (renameTo) {
        files[fileName] = { action: "rename", to: renameTo, content: body };
      } else {
        const fileContent = fileName.endsWith("/.keep") && !body.trim() ? "/* folder placeholder */" : body;
        files[fileName] = { action: "write", content: fileContent };
      }
    }
    
    return files;
  };

  const getPreviewSrcDoc = (fileName = "index.html") => {
    const extractRawText = cleanSyntaxHighlightedHtml;

    let htmlContent = extractRawText(editorFilesHtml[fileName]);
    if (!htmlContent) {
      if (fileName === "index.html") {
        return "<html><body><h1>index.html not found</h1></body></html>";
      } else {
        return `<html><body><h1>404: ${fileName} not found</h1></body></html>`;
      }
    }

    // 1. Inject Stylesheets inline
    const linkRegex = /<link\s+[^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi;
    htmlContent = htmlContent.replace(linkRegex, (match, href) => {
      const cssFileName = href.split('?')[0].split('/').pop();
      const cssContent = extractRawText(editorFilesHtml[cssFileName] || editorFilesHtml[href]);
      if (cssContent) {
        return `<style data-inlined-from="${cssFileName}">${cssContent}</style>`;
      }
      return match;
    });

    // 2. Inject Javascript scripts inline
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>\s*<\/script>/gi;
    htmlContent = htmlContent.replace(scriptRegex, (match, src) => {
      const jsFileName = src.split('?')[0].split('/').pop();
      const jsContent = extractRawText(editorFilesHtml[jsFileName] || editorFilesHtml[src]);
      if (jsContent) {
        let typeAttr = "";
        const typeMatch = match.match(/type=["']([^"']+)["']/i);
        if (typeMatch) {
          typeAttr = ` type="${typeMatch[1]}"`;
        }
        return `<script${typeAttr} data-inlined-from="${jsFileName}">${jsContent}</script>`;
      }
      return match;
    });

    // 3. Inject Navigation script to capture relative links click
    const navigationScript = `
      <script>
        document.addEventListener('click', function(e) {
          const target = e.target.closest('a');
          if (target && target.getAttribute('href')) {
            const href = target.getAttribute('href');
            if (!href.startsWith('http') && !href.startsWith('https') && !href.startsWith('#') && !href.startsWith('javascript:')) {
              e.preventDefault();
              const cleanHref = href.split('/').pop();
              window.parent.postMessage({ type: 'preview-navigate', file: cleanHref }, '*');
            }
          }
        });
      </script>
    `;

    if (htmlContent.includes("</head>")) {
      htmlContent = htmlContent.replace("</head>", `${navigationScript}</head>`);
    } else if (htmlContent.includes("<body>")) {
      htmlContent = htmlContent.replace("<body>", `<body>${navigationScript}`);
    } else {
      htmlContent = navigationScript + htmlContent;
    }

    return htmlContent;
  };

  const renderBrowserSimulator = () => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#1e1e1e",
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        {/* Browser Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "#2d2d2d",
          borderBottom: "1px solid #1a1a1a",
          padding: "8px 16px",
          userSelect: "none"
        }}>
          {/* Window Dots */}
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FF5F56", display: "inline-block" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#27C93F", display: "inline-block" }}></span>
          </div>
          
          {/* Navigation Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePreviewBack}
              disabled={previewHistoryIndex === 0}
              style={{
                background: "transparent",
                border: "none",
                color: previewHistoryIndex === 0 ? "#555" : "#ccc",
                cursor: previewHistoryIndex === 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "14px", height: "14px" }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button
              onClick={handlePreviewForward}
              disabled={previewHistoryIndex === previewHistory.length - 1}
              style={{
                background: "transparent",
                border: "none",
                color: previewHistoryIndex === previewHistory.length - 1 ? "#555" : "#ccc",
                cursor: previewHistoryIndex === previewHistory.length - 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "14px", height: "14px" }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button
              onClick={() => setPreviewRefreshKey(p => p + 1)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ccc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "14px", height: "14px" }}>
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>

          {/* Address Bar */}
          <div style={{
            flex: 1,
            background: "#1e1e1e",
            border: "1px solid #3c3c3c",
            borderRadius: "4px",
            color: "#8e8e8e",
            padding: "4px 12px",
            fontSize: "11px",
            fontFamily: "var(--mono)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span style={{ color: "#555" }}>http://</span>
            <span style={{ color: "#ccc" }}>localhost:3000/{currentPreviewFile}</span>
          </div>

          {/* Window Action Controls */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setPreviewFullscreen(!previewFullscreen)}
              style={{
                background: previewFullscreen ? "#FFB236" : "#3c3c3c",
                border: "none",
                color: previewFullscreen ? "black" : "#ccc",
                padding: "4px 8px",
                fontSize: "10.5px",
                borderRadius: "3px",
                cursor: "pointer",
                fontWeight: "bold",
                fontFamily: "var(--sans)"
              }}
            >
              {previewFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            <button
              onClick={() => setActiveFile(Object.keys(editorFilesHtml)[0] || "")}
              style={{
                background: "#3c3c3c",
                border: "none",
                color: "#ccc",
                padding: "4px 8px",
                fontSize: "10.5px",
                borderRadius: "3px",
                cursor: "pointer",
                fontWeight: "bold",
                fontFamily: "var(--sans)"
              }}
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Browser Content */}
        <div style={{ flex: 1, background: "#ffffff", position: "relative" }}>
          <iframe
            key={previewRefreshKey}
            srcDoc={getPreviewSrcDoc(currentPreviewFile)}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "#ffffff"
            }}
            sandbox="allow-scripts"
            title="Web Preview"
          />
        </div>
      </div>
    );
  };

  const getFilesContext = () => {
    return Object.keys(editorFilesHtml)
      .filter(f => f !== "Preview" && f !== "Reasoning" && editorFilesHtml[f])
      .map(f => {
        const cleanContent = cleanSyntaxHighlightedHtml(editorFilesHtml[f]);
        return `File: ${f}\n\`\`\`\n${cleanContent}\n\`\`\``;
      })
      .join("\n\n");
  };

  const readSSEStream = async (actionName, requestBody, onMessage) => {
    if (copilotAbortControllerRef.current) {
      try { copilotAbortControllerRef.current.abort(); } catch (e) {}
    }
    copilotAbortControllerRef.current = new AbortController();

    const res = await fetch("/api/codeinc/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...requestBody,
        model: nvidiaModel,
        managerModel: managerModel
      }),
      signal: copilotAbortControllerRef.current.signal
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      accumulatedText += decoder.decode(value, { stream: true });
      const lines = accumulatedText.split("\n");
      accumulatedText = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const parsed = JSON.parse(dataStr);
            onMessage(parsed);
          } catch (e) {
            console.error("SSE parse error", e, dataStr);
          }
        }
      }
    }
  };

  const startCopilotInitial = async (customPrompt) => {
    const promptToUse = customPrompt || codePrompt;
    if (!promptToUse.trim()) return;
    
    setCodePrompt("");
    setCopilotStep("analyzing");
    setCodeGenerating(true);
    setCodeGenStatus("Analyzing workspace...");
    setCopilotLogs([{ time: new Date().toLocaleTimeString(), message: "Starting Agentic Workspace Planner..." }]);
    setFollowUpQuestion("");
    setFollowUpOptions([]);
    setSuggestedDesign("");
    setCopilotPlan("");
    setHiddenPrompt("");
    setQaCritiqueLog("");

    const filesContext = getFilesContext();

    try {
      await readSSEStream("initial", {
        action: "initial",
        prompt: promptToUse,
        filesContext
      }, (parsed) => {
        if (parsed.status === "log") {
          setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: parsed.message }]);
          setCodeGenStatus(parsed.message);
        } else if (parsed.status === "options") {
          setFollowUpQuestion(parsed.followUp || "");
          setFollowUpOptions(parsed.options || []);
          setSuggestedDesign(parsed.designSystem || "");
          setCopilotStep("options_ready");
          setCodeGenStatus("Select choice or enter reply...");
        } else if (parsed.status === "error") {
          throw new Error(parsed.message);
        }
      });
    } catch (err) {
      console.error(err);
      setCopilotStep("error");
      setCodeGenStatus("Error: " + err.message);
      setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "Error: " + err.message, error: true }]);
      setCodeGenerating(false);
    }
  };

  const submitCopilotOption = async (optionText) => {
    setSelectedOption(optionText);
    setCopilotStep("planning");
    setCodeGenStatus("Generating implementation plan...");
    setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Selected Option: "${optionText}"` }]);
    setCopilotPlan("");

    const filesContext = getFilesContext();

    try {
      let accumulatedPlan = "";
      await readSSEStream("plan", {
        action: "plan",
        prompt: codePrompt || selectedOption,
        selectedOption: optionText,
        filesContext
      }, (parsed) => {
        if (parsed.status === "log") {
          setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: parsed.message }]);
          setCodeGenStatus(parsed.message);
        } else if (parsed.status === "plan_chunk") {
          accumulatedPlan += parsed.token || "";
          setCopilotPlan(accumulatedPlan);
        } else if (parsed.status === "plan_ready") {
          let cleanPlan = parsed.plan || "";
          const splitIdx = cleanPlan.indexOf("[CODING_INSTRUCTIONS]");
          if (splitIdx !== -1) {
            cleanPlan = cleanPlan.slice(0, splitIdx).trim();
          }
          setCopilotPlan(cleanPlan);
          setHiddenPrompt(parsed.hiddenPrompt || "");
          setCopilotStep("plan_ready");
          setCodeGenStatus("Review plan and click Approve...");
        } else if (parsed.status === "error") {
          throw new Error(parsed.message);
        }
      });
    } catch (err) {
      console.error(err);
      setCopilotStep("error");
      setCodeGenStatus("Error: " + err.message);
      setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "Error: " + err.message, error: true }]);
      setCodeGenerating(false);
    }
  };

  const approveAndGenerateCode = async () => {
    setCopilotStep("coding");
    setCodeGenStatus("Generating code files...");
    setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "Plan approved. Coding model executing changes..." }]);

    const filesContext = getFilesContext();
    let accumulatedRawText = "";

    try {
      await readSSEStream("code", {
        action: "code",
        prompt: codePrompt,
        plan: copilotPlan,
        hiddenPrompt,
        filesContext
      }, (parsed) => {
        if (parsed.status === "log") {
          setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: parsed.message }]);
          setCodeGenStatus(parsed.message);
        } else if (parsed.status === "code_chunk") {
          const token = parsed.token || "";
          accumulatedRawText += token;
          
          const parsedFiles = parseWorkspaceFiles(accumulatedRawText);
          setEditorFilesHtml(prev => {
            const updated = { ...prev };
            Object.keys(parsedFiles).forEach(fileName => {
              const fileInfo = parsedFiles[fileName];
              if (fileInfo.action === "delete") {
                delete updated[fileName];
              } else if (fileInfo.action === "rename") {
                delete updated[fileName];
                updated[fileInfo.to] = formatCodeForEditor(fileInfo.content) + '<span class="gen-cursor"></span>';
              } else {
                updated[fileName] = formatCodeForEditor(fileInfo.content) + '<span class="gen-cursor"></span>';
              }
            });
            return updated;
          });
        } else if (parsed.status === "error") {
          throw new Error(parsed.message);
        }
      });

      // Clean cursors
      const finalFiles = parseWorkspaceFiles(accumulatedRawText);
      setEditorFilesHtml(prev => {
        const updated = { ...prev };
        Object.keys(finalFiles).forEach(fileName => {
          const fileInfo = finalFiles[fileName];
          if (fileInfo.action === "delete") {
            delete updated[fileName];
          } else if (fileInfo.action === "rename") {
            delete updated[fileName];
            updated[fileInfo.to] = formatCodeForEditor(fileInfo.content);
          } else {
            updated[fileName] = formatCodeForEditor(fileInfo.content);
          }
        });
        return updated;
      });

      // Auto-select first file
      const generatedKeys = Object.keys(finalFiles).filter(k => finalFiles[k].action !== "delete");
      if (generatedKeys.length > 0) {
        setActiveFile(generatedKeys[0]);
      }

      await runCopilotQA(accumulatedRawText);

    } catch (err) {
      console.error(err);
      setCopilotStep("error");
      setCodeGenStatus("Error: " + err.message);
      setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "Error: " + err.message, error: true }]);
      setCodeGenerating(false);
    }
  };

  const runCopilotQA = async (originalCode) => {
    setCopilotStep("qa");
    setCodeGenStatus("QA Reviewing and checking for design errors...");
    setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "Starting Quality Assurance validation loop..." }]);
    setQaCritiqueLog("");

    const filesContext = getFilesContext();
    let accumulatedQaLog = "";
    let accumulatedRawText = originalCode || "";

    try {
      await readSSEStream("qa", {
        action: "qa",
        prompt: codePrompt,
        plan: copilotPlan,
        generatedFiles: filesContext
      }, (parsed) => {
        if (parsed.status === "log") {
          setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: parsed.message }]);
          setCodeGenStatus(parsed.message);
        } else if (parsed.status === "qa_chunk") {
          accumulatedQaLog += parsed.token || "";
          setQaCritiqueLog(accumulatedQaLog);
        } else if (parsed.status === "code_chunk") {
          const token = parsed.token || "";
          accumulatedRawText += token;
          
          const parsedFiles = parseWorkspaceFiles(accumulatedRawText);
          setEditorFilesHtml(prev => {
            const updated = { ...prev };
            Object.keys(parsedFiles).forEach(fileName => {
              const fileInfo = parsedFiles[fileName];
              if (fileInfo.action === "delete") {
                delete updated[fileName];
              } else if (fileInfo.action === "rename") {
                delete updated[fileName];
                updated[fileInfo.to] = formatCodeForEditor(fileInfo.content) + '<span class="gen-cursor"></span>';
              } else {
                updated[fileName] = formatCodeForEditor(fileInfo.content) + '<span class="gen-cursor"></span>';
              }
            });
            return updated;
          });
        } else if (parsed.status === "complete") {
          setCopilotStep("finished");
          setCodeGenStatus("Success · Workspace verified");
          setCodeGenerating(false);
          showToast("Workspace checked, refined, and verified by QA!");
        } else if (parsed.status === "error") {
          throw new Error(parsed.message);
        }
      });

      // Clean cursors
      const finalFiles = parseWorkspaceFiles(accumulatedRawText);
      setEditorFilesHtml(prev => {
        const updated = { ...prev };
        Object.keys(finalFiles).forEach(fileName => {
          const fileInfo = finalFiles[fileName];
          if (fileInfo.action === "delete") {
            delete updated[fileName];
          } else if (fileInfo.action === "rename") {
            delete updated[fileName];
            updated[fileInfo.to] = formatCodeForEditor(fileInfo.content);
          } else {
            updated[fileName] = formatCodeForEditor(fileInfo.content);
          }
        });
        return updated;
      });

    } catch (err) {
      console.error(err);
      setCopilotStep("error");
      setCodeGenStatus("Error: " + err.message);
      setCopilotLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: "QA Error: " + err.message, error: true }]);
      setCodeGenerating(false);
    }
  };

  const handleGenerateCode = async (e) => {
    if (e) e.preventDefault();
    if (!codePrompt.trim()) return;
    await startCopilotInitial();
  };

  const handleCopyCode = () => {
    if (!activeFile || activeFile === "Preview") {
      showToast("No active file to copy.");
      return;
    }
    const rawHtml = editorFilesHtml[activeFile] || "";
    const plainText = cleanSyntaxHighlightedHtml(rawHtml);
    
    navigator.clipboard?.writeText(plainText).catch(() => {});
    showToast("Code copied to clipboard!");
  };

  const handleDownloadZip = async () => {
    try {
      showToast("Preparing ZIP download...");
      const res = await fetch("/api/codeinc/download");
      if (!res.ok) {
        throw new Error("Failed to download ZIP file.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "workspace.zip";
      link.click();
      URL.revokeObjectURL(url);
      showToast("Project downloaded as ZIP!");
    } catch (err) {
      console.error(err);
      showToast("Download failed: " + err.message);
    }
  };

  // Interactive workspaces simulation: Visual Workspace Generator
  const handleGenerateVisual = () => {
    if (!visualPrompt.trim()) return;
    setVisualGenerating(true);
    setVisualTiles([]);
    setVisualStatusText(visualType === "image" ? "Rendering — composing scene" : "Rendering — generating frames");
    
    setTimeout(() => {
      setVisualGenerating(false);
      const count = visualType === "image" ? 4 : 2;
      const newTiles = [];
      for (let i = 0; i < count; i++) {
        newTiles.push({
          id: Date.now() + i,
          style: visualStyle,
          aspect: visualAspect,
          isVideo: visualType === "video"
        });
      }
      setVisualTiles(newTiles);
      
      const newHistoryItem = {
        id: Date.now(),
        title: visualPrompt.slice(0, 24) + (visualPrompt.length > 24 ? "..." : ""),
        style: visualStyle,
        aspect: visualAspect,
        isVideo: visualType === "video",
        thumbClass: visualType === "video" ? "vhist-thumb-2" : "vhist-thumb-1"
      };
      setVisualHistory((prev) => [newHistoryItem, ...prev]);
    }, visualType === "image" ? 1300 : 2200);
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
        className={`chat-item relative group ${isActive ? "active" : ""}`}
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
                  setDeleteConfirmSessionId(null);
                  setOpenMenuSessionId(
                    openMenuSessionId === session.id ? null : session.id
                  );
                }}
                className="p-1 rounded text-brand-subtext/50 hover:text-brand-text active:scale-[0.88] opacity-0 hover:opacity-100 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-none outline-none"
                aria-label="Chat actions"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Rename/Delete menu */}
              {openMenuSessionId === session.id && (
                deleteConfirmSessionId === session.id ? (
                  <div 
                    ref={menuRef} 
                    className="absolute right-0 top-6 border border-[#262B33] rounded-md shadow-2xl p-3 z-30 w-[170px] animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      background: "rgba(16, 20, 24, 0.98)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div className="text-left mb-2.5">
                      <div className="text-white text-xs font-semibold font-sans">Delete conversation?</div>
                      <div className="text-[#8A919C] text-[10px] font-sans mt-0.5 leading-tight">This will permanently delete all messages.</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmSessionId(null);
                        }}
                        className="flex-1 text-center py-1 text-[10.5px] text-white border border-[#3E4550] hover:bg-[#ffffff0d] active:scale-[0.94] cursor-pointer bg-transparent rounded transition-all font-sans font-medium outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                          setDeleteConfirmSessionId(null);
                        }}
                        className="flex-1 text-center py-1 text-[10.5px] text-white bg-[#FF6B5C] hover:bg-[#FF5240] active:scale-[0.94] cursor-pointer border-none rounded transition-all font-sans font-medium outline-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={menuRef} 
                    className="absolute right-0 top-6 border border-[#262B33] rounded-md shadow-2xl p-1 z-30 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      background: "rgba(16, 20, 24, 0.96)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    {/* Rename Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameValue(session.title);
                        setRenamingSessionId(session.id);
                        setOpenMenuSessionId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11.5px] text-[#8A919C] hover:text-white hover:bg-[#ffffff0a] active:scale-[0.97] active:bg-[#ffffff12] cursor-pointer bg-transparent border-none font-sans flex items-center gap-2 rounded transition-all group outline-none"
                    >
                      <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Rename
                    </button>

                    {/* Export Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSession(session);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11.5px] text-[#8A919C] hover:text-white hover:bg-[#ffffff0a] active:scale-[0.97] active:bg-[#ffffff12] cursor-pointer bg-transparent border-none font-sans flex items-center gap-2 rounded transition-all group outline-none"
                    >
                      <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Chat
                    </button>

                    {/* Clear Messages Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearMessages(session.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11.5px] text-[#8A919C] hover:text-white hover:bg-[#ffffff0a] active:scale-[0.97] active:bg-[#ffffff12] cursor-pointer bg-transparent border-none font-sans flex items-center gap-2 rounded transition-all group outline-none"
                    >
                      <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Chat
                    </button>

                    {/* Divider */}
                    <div className="h-[1px] bg-[#262B33] my-1 mx-1" />

                    {/* Delete Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmSessionId(session.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11.5px] text-[#FF6B5C] hover:bg-[#FF6B5C]/10 active:scale-[0.97] active:bg-[#FF6B5C]/25 cursor-pointer bg-transparent border-none font-sans flex items-center gap-2 rounded transition-all outline-none"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Chat
                    </button>
                  </div>
                )
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

      <div className={`app ${mode === "codeinc" ? "codeinc-fullscreen" : ""}`}>
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

          <div
            className="mode-switcher"
            id="modeSwitcher"
            style={{
              "--mode-rail-x": modeRailX[mode],
              "--mode-active-color": modeColorVar[mode][0],
              "--mode-active-glow": modeColorVar[mode][1],
            }}
          >
            <button
              className={`mode-btn ${mode === "text" ? "active" : ""}`}
              onClick={() => handleModeChange("text")}
              data-mode="text"
            >
              <span className="mode-idx">01</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Text
            </button>
            <button
              className={`mode-btn ${mode === "visual" ? "active" : ""}`}
              onClick={() => handleModeChange("visual")}
              data-mode="visual"
            >
              <span className="mode-idx">02</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Visual
            </button>
            <button
              className={`mode-btn ${mode === "codeinc" ? "active" : ""}`}
              onClick={() => handleModeChange("codeinc")}
              data-mode="codeinc"
            >
              <span className="mode-idx">03</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Codeinc
            </button>
            <button
              className={`mode-btn ${mode === "nexstudy" ? "active" : ""}`}
              onClick={() => handleModeChange("nexstudy")}
              data-mode="nexstudy"
            >
              <span className="mode-idx">04</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              NexStudy
            </button>
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
          {/* ===== TEXT MODE SIDEBAR PANEL ===== */}
          <div className={`sidebar-panel ${mode === "text" ? "active" : ""}`} id="sidebarText">
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

          {/* ===== VISUAL MODE SIDEBAR PANEL ===== */}
          <div className={`sidebar-panel ${mode === "visual" ? "active" : ""}`} id="sidebarVisual">
            <div className="sidebar-top">
              <button
                onClick={() => {
                  setVisualPrompt("");
                  setVisualTiles([]);
                  setVisualGenerating(false);
                }}
                className="new-chat-btn new-chat-visual"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New generation
              </button>
              <div className="search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search generations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Section tiles for Image and Video */}
            <div className="section-tiles">
              <div
                onClick={() => setVisualType("image")}
                className={`section-tile tile-visual-mode ${visualType === "image" ? "active" : ""}`}
              >
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="tile-text">
                  <div className="tile-name">IMAGE</div>
                  <div className="tile-sub">Stills, art, product shots</div>
                </div>
                <svg className="tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              
              <div
                onClick={() => setVisualType("video")}
                className={`section-tile tile-visual-mode ${visualType === "video" ? "active" : ""}`}
              >
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </div>
                <div className="tile-text">
                  <div className="tile-name">VIDEO</div>
                  <div className="tile-sub">Clips & motion sequences</div>
                </div>
                <svg className="tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Visual generations history */}
            <div className="sidebar-scroll">
              <div className="section-label">Recent</div>
              {visualHistory
                .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setVisualPrompt(item.title);
                      setVisualStyle(item.style);
                      setVisualAspect(item.aspect);
                      setVisualType(item.isVideo ? "video" : "image");
                      setVisualTiles([
                        { id: 101, style: item.style, aspect: item.aspect, isVideo: item.isVideo }
                      ]);
                    }}
                    className="chat-item"
                  >
                    <svg className="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {item.isVideo ? (
                        <>
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" />
                        </>
                      ) : (
                        <>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </>
                      )}
                    </svg>
                    <span className="ci-title">{item.title}</span>
                  </div>
                ))}
            </div>

            <div className="sidebar-bottom">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>6 / 50 generations</span>
                <span>Free</span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: "12%", background: "var(--visual)" }}></div>
              </div>
            </div>
          </div>

          {/* ===== CODEINC SIDEBAR PANEL ===== */}
          <div className={`sidebar-panel ${mode === "codeinc" ? "active" : ""}`} id="sidebarCodeinc">
            <div className="sidebar-top" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "10px" }}>
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <button
                  onClick={() => {
                    showCustomPrompt(
                      "New Project",
                      "Enter the name of your new project:",
                      "my-web-project",
                      "",
                      (projectName) => {
                        if (projectName && projectName.trim()) {
                          const trimmed = projectName.trim();
                          const newProj = {
                            id: "project-" + Date.now(),
                            name: trimmed,
                            files: {}
                          };
                          setCodeProjects(prev => [newProj, ...prev]);
                          setActiveProjectId(newProj.id);
                          setEditorFilesHtml(newProj.files);
                          setActiveFile("");
                          showToast(`Created project ${trimmed}`);
                        }
                      }
                    );
                  }}
                  className="new-chat-btn new-chat-code"
                  style={{ flex: 1, padding: "6px 8px", fontSize: "11.5px", fontWeight: "600", border: "1px solid var(--code-accent)" }}
                >
                  New Project +
                </button>
              </div>
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <button
                  onClick={() => {
                    setNewResourceType("html");
                    setNewResourceName("");
                    setCreateResourceModalOpen(true);
                  }}
                  className="new-chat-btn new-chat-code"
                  style={{ flex: 1, padding: "6px 8px", fontSize: "10.5px" }}
                >
                  New File
                </button>
                <button
                  onClick={() => {
                    setNewResourceType("folder");
                    setNewResourceName("");
                    setCreateResourceModalOpen(true);
                  }}
                  className="new-chat-btn new-chat-code"
                  style={{ flex: 1, padding: "6px 8px", fontSize: "10.5px" }}
                >
                  New Folder
                </button>
              </div>
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <button
                  onClick={() => {
                    showCustomConfirm(
                      "Reset Files",
                      "Are you sure you want to reset all project files to default? This will clear all custom files and changes.",
                      () => {
                        setEditorFilesHtml({
                          "index.html": ``,
                          "style.css": ``,
                          "script.js": ``
                        });
                        setActiveFile("index.html");
                        showToast("Files reset");
                      }
                    );
                  }}
                  className="new-chat-btn new-chat-code"
                  style={{ flex: 1, padding: "6px 8px", fontSize: "10.5px", opacity: 0.7 }}
                >
                  Reset Current Files
                </button>
              </div>
              <div className="search-wrap" style={{ width: "100%" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search files…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-scroll">
              <div className="section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span>PROJECT FILES</span>
                <button
                  onClick={() => {
                    setNewResourceType("html");
                    setNewResourceName("");
                    setCreateResourceModalOpen(true);
                  }}
                  className="flex items-center justify-center border border-[#262B33] bg-[#0B0D10] text-[#5EE0A8] hover:bg-[#5EE0A8] hover:text-[#0B0D10] transition-colors"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    lineHeight: "1",
                    cursor: "pointer"
                  }}
                  title="Create New File/Folder"
                >
                  +
                </button>
              </div>
              <div className="file-tree-container mt-1">
                {Object.keys(editorFilesHtml).length === 0 ? (
                  <div className="text-brand-subtext text-xs p-3 italic">No files in project yet.</div>
                ) : (
                  renderSidebarTree(buildFileTree(editorFilesHtml))
                )}
              </div>
              
              <div className="section-label">Recent projects</div>
              {codeProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setEditorFilesHtml(proj.files);
                    const files = Object.keys(proj.files);
                    setActiveFile(files[0] || "");
                    showToast(`Opened project ${proj.name}`);
                  }}
                  className={`chat-item ${activeProjectId === proj.id ? "active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <svg className="ci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span className="ci-title" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{proj.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showCustomConfirm("Delete Project", `Are you sure you want to delete project ${proj.name}? All project files will be deleted permanently.`, () => {
                        const remaining = codeProjects.filter(p => p.id !== proj.id);
                        if (remaining.length === 0) {
                          const defaultProj = {
                            id: "proj_" + Date.now(),
                            name: "Project 1",
                            files: {}
                          };
                          const newProjectsList = [defaultProj];
                          setCodeProjects(newProjectsList);
                          localStorage.setItem("codeinc_projects", JSON.stringify(newProjectsList));
                          setActiveProjectId(defaultProj.id);
                          setEditorFilesHtml({});
                          setActiveFile("");
                        } else {
                          setCodeProjects(remaining);
                          localStorage.setItem("codeinc_projects", JSON.stringify(remaining));
                          if (activeProjectId === proj.id) {
                            const newActive = remaining[0];
                            setActiveProjectId(newActive.id);
                            setEditorFilesHtml(newActive.files);
                            const files = Object.keys(newActive.files);
                            setActiveFile(files[0] || "");
                          }
                        }
                        showToast(`Project ${proj.name} deleted!`);
                      });
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={`Delete project ${proj.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#FF5240" strokeWidth="2.5" style={{ width: "11px", height: "11px" }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="sidebar-bottom">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Coding Assistant</span>
                <span style={{ color: "var(--code-accent)" }}>● Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace" id="workspace">

          {/* ===== DEFAULT CHAT VIEW ===== */}
          <div className={`view ${mode === "text" && activeTab === "default" ? "active" : ""}`} id="viewChat">
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
          <div className={`view ${mode === "text" && activeTab === "research" ? "active" : ""}`} id="viewResearch">
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
          <div className={`view ${mode === "text" && activeTab === "private" ? "active" : ""}`} id="viewPrivate">
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
          <div className={`view ${mode === "codeinc" ? "active" : ""}`} id="viewCode" style={{ position: "relative" }}>
            {previewFullscreen && activeFile === "Preview" && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                background: "var(--background)",
                padding: "16px"
              }}>
                {renderBrowserSimulator()}
              </div>
            )}
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
                  <div className="ws-subtitle">Generates code from a prompt using the coding model</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "8.5px", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: "bold", fontFamily: "var(--mono)" }}>Coding Model</label>
                  <select
                    value={nvidiaModel}
                    onChange={(e) => setNvidiaModel(e.target.value)}
                    style={{
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      padding: "5px 10px",
                      fontFamily: "var(--mono)",
                      fontSize: "11.5px",
                      outline: "none",
                      cursor: "pointer",
                      borderRadius: "3px",
                      maxWidth: "200px"
                    }}
                  >
                    <optgroup label="NVIDIA Models" style={{ background: "var(--panel-2)", color: "var(--text-dim)" }}>
                      <option value="meta/llama-3.3-70b-instruct" style={{ color: "var(--text)" }}>meta/llama-3.3-70b-instruct</option>
                      <option value="meta/llama-3.1-70b-instruct" style={{ color: "var(--text)" }}>meta/llama-3.1-70b-instruct</option>
                      <option value="meta/llama-3.1-8b-instruct" style={{ color: "var(--text)" }}>meta/llama-3.1-8b-instruct</option>
                      <option value="meta/llama-3.2-3b-instruct" style={{ color: "var(--text)" }}>meta/llama-3.2-3b-instruct</option>
                      <option value="meta/llama-3.2-1b-instruct" style={{ color: "var(--text)" }}>meta/llama-3.2-1b-instruct</option>
                      <option value="microsoft/phi-4-mini-instruct" style={{ color: "var(--text)" }}>microsoft/phi-4-mini-instruct</option>
                      <option value="google/gemma-2-2b-it" style={{ color: "var(--text)" }}>google/gemma-2-2b-it</option>
                      <option value="mistralai/mixtral-8x7b-instruct-v0.1" style={{ color: "var(--text)" }}>mistralai/mixtral-8x7b-instruct-v0.1</option>
                    </optgroup>
                    <optgroup label="Xiaomi MiMo" style={{ background: "var(--panel-2)", color: "var(--text-dim)" }}>
                      <option value="mimo/mimo-v2.5-pro" style={{ color: "var(--text)" }}>mimo-v2.5-pro</option>
                      <option value="mimo/mimo-v2.5-pro-ultraspeed" style={{ color: "var(--text)" }}>mimo-v2.5-pro-ultraspeed</option>
                    </optgroup>
                    <optgroup label="Sakana AI (Fugu)" style={{ background: "var(--panel-2)", color: "var(--text-dim)" }}>
                      <option value="sakana/fugu" style={{ color: "var(--text)" }}>sakana/fugu</option>
                      <option value="sakana/fugu-ultra" style={{ color: "var(--text)" }}>sakana/fugu-ultra</option>
                    </optgroup>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <label style={{ fontSize: "8.5px", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: "bold", fontFamily: "var(--mono)" }}>Manager & QA Model</label>
                  <select
                    value={managerModel}
                    onChange={(e) => setManagerModel(e.target.value)}
                    style={{
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      padding: "5px 10px",
                      fontFamily: "var(--mono)",
                      fontSize: "11.5px",
                      outline: "none",
                      cursor: "pointer",
                      borderRadius: "3px",
                      maxWidth: "200px"
                    }}
                  >
                    <option value="groq/llama-3.3-70b-versatile" style={{ color: "var(--text)" }}>Llama 3.3 70B (Groq - Free)</option>
                    <option value="groq/gemma2-9b-it" style={{ color: "var(--text)" }}>Gemma 2 9B (Groq - Free)</option>
                    <option value="openrouter/openai/gpt-oss-120b:free" style={{ color: "var(--text)" }}>GPT OSS 120B (OpenRouter - Free)</option>
                    <option value="openrouter/openai/gpt-oss-20b:free" style={{ color: "var(--text)" }}>GPT OSS 20B (OpenRouter - Free)</option>
                    <option value="openrouter/nousresearch/hermes-3-llama-3.1-405b:free" style={{ color: "var(--text)" }}>Hermes 3 405B (OpenRouter - Free)</option>
                    <option value="openrouter/google/gemma-4-31b:free" style={{ color: "var(--text)" }}>Gemma 4 31B (OpenRouter - Free)</option>
                    <option value="openrouter/google/gemma-4-26b:free" style={{ color: "var(--text)" }}>Gemma 4 26B (OpenRouter - Free)</option>
                    <option value="openrouter/qwen/qwen3-next-80b-a3b:free" style={{ color: "var(--text)" }}>Qwen3 Next 80B (OpenRouter - Free)</option>
                    <option value="openrouter/qwen/qwen3-coder-480b-a3b:free" style={{ color: "var(--text)" }}>Qwen3 Coder 480B (OpenRouter - Free)</option>
                    <option value="openrouter/poolside/laguna-m.1:free" style={{ color: "var(--text)" }}>Laguna M.1 (OpenRouter - Free)</option>
                    <option value="openrouter/poolside/laguna-xs.2:free" style={{ color: "var(--text)" }}>Laguna XS.2 (OpenRouter - Free)</option>
                    <option value="openrouter/liquid/lfm2.5-1.2b-thinking:free" style={{ color: "var(--text)" }}>LFM 2.5 Thinking (OpenRouter - Free)</option>
                    <option value="openrouter/cohere/north-mini-code:free" style={{ color: "var(--text)" }}>Cohere North Mini Code (OpenRouter - Free)</option>
                    <option value="nvidia/nemotron-3-ultra-550b-a55b" style={{ color: "var(--text)" }}>Nemotron 3 Ultra (NVIDIA - Free)</option>
                    <option value="mistralai/mixtral-8x7b-instruct-v0.1" style={{ color: "var(--text)" }}>Mixtral 8x7B (NVIDIA - Free)</option>
                  </select>
                </div>

                <button
                  onClick={() => setCopilotPanelOpen(!copilotPanelOpen)}
                  style={{
                    background: copilotPanelOpen ? "rgba(255, 178, 54, 0.15)" : "var(--panel-2)",
                    border: copilotPanelOpen ? "1px solid #FFB236" : "1px solid var(--border)",
                    color: copilotPanelOpen ? "#FFB236" : "var(--text)",
                    padding: "6px 12px",
                    fontSize: "11.5px",
                    fontFamily: "var(--sans)",
                    fontWeight: "bold",
                    outline: "none",
                    cursor: "pointer",
                    borderRadius: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "12px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "13px", height: "13px" }}>
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {copilotPanelOpen ? "Hide Copilot" : "Show Copilot"}
                </button>

                <button onClick={() => handleModeChange("text")} className="ws-back" style={{ marginTop: "12px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Exit full screen
                </button>
              </div>
            </div>
            
            <div className="code-body" style={{
              gridTemplateColumns: copilotPanelOpen ? "220px 1fr 380px" : "220px 1fr"
            }}>
              <div className="file-tree">
                <h4>PROJECT FILES</h4>
                <div className="file-tree-container mt-1">
                  {Object.keys(editorFilesHtml).length === 0 ? (
                    <div className="text-brand-subtext text-xs p-3 italic">No files in project yet.</div>
                  ) : (
                    renderSidebarTree(buildFileTree(editorFilesHtml))
                  )}
                </div>
                <div
                  onClick={() => setActiveFile("Preview")}
                  className={`file-row ${activeFile === "Preview" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    marginTop: "12px",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "12px",
                    paddingLeft: "8px",
                    paddingRight: "8px"
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "13px", height: "13px", color: "var(--accent)" }}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span style={{ fontWeight: "600", fontSize: "12px", color: "var(--accent)" }}>Live Preview</span>
                </div>
              </div>
              
              <div className="code-main">
                <div className="code-tabs">
                  <div className="code-tab active">{activeFile || "No Active File"}</div>
                </div>
                {activeFile === "Preview" ? (
                  !previewFullscreen ? renderBrowserSimulator() : (
                    <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "12px", background: "var(--panel)" }}>
                      Previewing in Fullscreen mode (click the Fullscreen button in the overlay to exit).
                    </div>
                  )
                ) : !activeFile ? (
                  <div className="code-editor flex flex-col items-center justify-center text-center p-8 gap-4" style={{ height: "100%", justifyContent: "center", display: "flex" }}>
                    <div style={{ fontSize: "36px" }}>📁</div>
                    <h3 className="text-white text-sm font-bold">Empty Project Workspace</h3>
                    <p className="text-[#8A919C] text-xs max-w-xs leading-relaxed">
                      Create your first HTML, CSS, JS, or JSX file to begin coding and designing.
                    </p>
                    <button
                      onClick={() => {
                        setNewResourceType("html");
                        setNewResourceName("");
                        setCreateResourceModalOpen(true);
                      }}
                      className="px-4 py-2 mt-2 bg-[#5EE0A8] text-black text-xs font-bold rounded hover:bg-[#5EE0A8]/90 transition-all cursor-pointer font-sans"
                    >
                      + Create First File
                    </button>
                  </div>
                ) : (
                  <div className={`code-editor ${codeGenerating ? "generating" : ""}`} id="codeEditor" dangerouslySetInnerHTML={{ __html: editorFilesHtml[activeFile] || "" }} />
                )}
                
                <div className="code-actions-row">
                  <div className="code-gen-status" id="codeGenStatus">
                    {codeGenStatus}
                  </div>
                  <div className="code-actions">
                    <button onClick={handleCopyCode} className="code-action-btn" id="copyCodeBtn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </button>
                    <button onClick={() => showToast("Code inserted successfully!")} className="code-action-btn" id="insertCodeBtn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Insert into file
                    </button>
                    <button onClick={handleDownloadZip} className="code-action-btn" id="downloadZipBtn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download ZIP
                    </button>
                    <button onClick={() => { setCodePrompt("Regenerate file content"); setTimeout(() => startCopilotInitial("Regenerate project code"), 100); }} className="code-action-btn" id="regenBtn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                      </svg>
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>

              {copilotPanelOpen && (
                <div className="copilot-side-panel" style={{
                  borderLeft: "1px solid var(--border)",
                  background: "var(--panel)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                  textAlign: "left"
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#FFB236" strokeWidth="2.5" style={{ width: "16px", height: "16px" }}>
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <span style={{ fontWeight: "bold", fontSize: "13px", color: "var(--text)" }}>NexInc Copilot Tracker</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontSize: "9px",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontWeight: "bold",
                        background: copilotStep === "idle" ? "var(--border)" : copilotStep === "finished" ? "rgba(94,224,168,0.2)" : "rgba(255,178,54,0.2)",
                        color: copilotStep === "idle" ? "var(--text-dim)" : copilotStep === "finished" ? "#5EE0A8" : "#FFB236"
                      }}>
                        {copilotStep}
                      </span>
                      <button
                        onClick={handleResetEntireWorkspace}
                        style={{
                          background: "rgba(235, 87, 87, 0.08)",
                          border: "1px solid rgba(235, 87, 87, 0.3)",
                          color: "#EB5757",
                          padding: "2px 6px",
                          fontSize: "9.5px",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                          transition: "all 0.15s ease",
                          outline: "none"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(235, 87, 87, 0.2)"; e.currentTarget.style.borderColor = "#EB5757"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(235, 87, 87, 0.08)"; e.currentTarget.style.borderColor = "rgba(235, 87, 87, 0.3)"; }}
                        title="Restart Codeinc (delete all files & clear memory)"
                      >
                        🔄 Restart
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* PHASE TRACKING TIMELINE */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Step 1: Initial */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold",
                          background: copilotStep === "analyzing" || copilotStep === "options_ready" ? "rgba(255,178,54,0.2)" : ["planning","plan_ready","coding","qa","finished"].includes(copilotStep) ? "rgba(94,224,168,0.2)" : "var(--panel-2)",
                          color: copilotStep === "analyzing" || copilotStep === "options_ready" ? "#FFB236" : ["planning","plan_ready","coding","qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--text-dim)",
                          border: `1px solid ${copilotStep === "analyzing" || copilotStep === "options_ready" ? "#FFB236" : ["planning","plan_ready","coding","qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--border)"}`
                        }}>
                          {["planning","plan_ready","coding","qa","finished"].includes(copilotStep) ? "✓" : "1"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--text)" }}>1. Design & Follow-up</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-dim)" }}>Analyzing web inspirations & style options</div>
                        </div>
                      </div>

                      {/* Step 2: Planning */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold",
                          background: copilotStep === "planning" || copilotStep === "plan_ready" ? "rgba(255,178,54,0.2)" : ["coding","qa","finished"].includes(copilotStep) ? "rgba(94,224,168,0.2)" : "var(--panel-2)",
                          color: copilotStep === "planning" || copilotStep === "plan_ready" ? "#FFB236" : ["coding","qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--text-dim)",
                          border: `1px solid ${copilotStep === "planning" || copilotStep === "plan_ready" ? "#FFB236" : ["coding","qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--border)"}`
                        }}>
                          {["coding","qa","finished"].includes(copilotStep) ? "✓" : "2"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--text)" }}>2. Implementation Plan</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-dim)" }}>Review proposed project files layout</div>
                        </div>
                      </div>

                      {/* Step 3: Coding */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold",
                          background: copilotStep === "coding" ? "rgba(255,178,54,0.2)" : ["qa","finished"].includes(copilotStep) ? "rgba(94,224,168,0.2)" : "var(--panel-2)",
                          color: copilotStep === "coding" ? "#FFB236" : ["qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--text-dim)",
                          border: `1px solid ${copilotStep === "coding" ? "#FFB236" : ["qa","finished"].includes(copilotStep) ? "#5EE0A8" : "var(--border)"}`
                        }}>
                          {["qa","finished"].includes(copilotStep) ? "✓" : "3"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--text)" }}>3. Code Generation</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-dim)" }}>Coding model streaming workspace files</div>
                        </div>
                      </div>

                      {/* Step 4: QA Critique */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold",
                          background: copilotStep === "qa" ? "rgba(255,178,54,0.2)" : copilotStep === "finished" ? "rgba(94,224,168,0.2)" : "var(--panel-2)",
                          color: copilotStep === "qa" ? "#FFB236" : copilotStep === "finished" ? "#5EE0A8" : "var(--text-dim)",
                          border: `1px solid ${copilotStep === "qa" ? "#FFB236" : copilotStep === "finished" ? "#5EE0A8" : "var(--border)"}`
                        }}>
                          {copilotStep === "finished" ? "✓" : "4"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--text)" }}>4. QA Critique & Self-Correction</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-dim)" }}>Human-like evaluation & correction cycles</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}></div>

                    {/* INTERACTION SECTION */}
                    {copilotStep === "idle" && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-dim)" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>💡</div>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text)" }}>Ready to Assist</div>
                        <p style={{ fontSize: "11px", marginTop: "4px" }}>Type a message in the bottom prompt bar to trigger the agent workflow.</p>
                      </div>
                    )}

                    {copilotStep === "analyzing" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: "10px" }}>
                        <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid #FFB236", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                        <div style={{ fontSize: "12px", color: "#FFB236", fontWeight: "bold" }}>Analyzing workspace & search references...</div>
                        <div style={{ width: "100%", maxHeight: "150px", overflowY: "auto", background: "var(--panel-2)", padding: "8px", borderRadius: "4px", fontSize: "10.5px", fontFamily: "var(--mono)" }}>
                          {copilotLogs.map((l, i) => (
                            <div key={i} style={{ color: l.error ? "#FF5240" : "var(--text-dim)", marginBottom: "4px" }}>[{l.time}] {l.message}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {copilotStep === "options_ready" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ background: "rgba(255, 178, 54, 0.06)", border: "1px solid rgba(255, 178, 54, 0.2)", borderRadius: "6px", padding: "12px" }}>
                          <div style={{ fontSize: "11.5px", fontWeight: "bold", color: "#FFB236", marginBottom: "6px" }}>Question / Clarification:</div>
                          <div style={{ fontSize: "12px", color: "var(--text)", lineHeight: "1.5" }}>
                            {typeof followUpQuestion === "object" ? JSON.stringify(followUpQuestion) : String(followUpQuestion)}
                          </div>
                        </div>

                        {suggestedDesign && (
                          <div style={{ fontSize: "11px", color: "var(--text-dim)", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "4px", padding: "8px" }}>
                            <div style={{ fontWeight: "bold", color: "#FFB236", marginBottom: "4px" }}>Suggested Design System:</div>
                            {typeof suggestedDesign === "string" ? (
                              <div>{suggestedDesign}</div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {Object.entries(suggestedDesign).map(([key, val]) => {
                                  const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val);
                                  return (
                                    <div key={key}>
                                      <strong style={{ textTransform: "capitalize" }}>{key}:</strong> {displayVal}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                          {followUpOptions.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => submitCopilotOption(opt)}
                              style={{
                                background: "var(--panel-2)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                padding: "8px 12px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => e.target.style.borderColor = "#FFB236"}
                              onMouseLeave={(e) => e.target.style.borderColor = "var(--border)"}
                            >
                              <span style={{ fontWeight: "bold", color: "#FFB236", marginRight: "4px" }}>Option {String.fromCharCode(65 + i)}:</span>
                              {typeof opt === "object" ? JSON.stringify(opt) : String(opt)}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                          <label style={{ fontSize: "10.5px", fontWeight: "bold", color: "var(--text-dim)" }}>Custom Response / Special Prompts:</label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <input
                              type="text"
                              value={customReplyText}
                              onChange={(e) => setCustomReplyText(e.target.value)}
                              placeholder="Type a custom reply or specific design prompt..."
                              style={{
                                flex: 1,
                                background: "var(--panel-2)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                padding: "6px 10px",
                                fontSize: "11px",
                                borderRadius: "3px",
                                outline: "none"
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && customReplyText.trim()) {
                                  submitCopilotOption(customReplyText);
                                  setCustomReplyText("");
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (customReplyText.trim()) {
                                  submitCopilotOption(customReplyText);
                                  setCustomReplyText("");
                                }
                              }}
                              style={{
                                background: "#FFB236",
                                color: "black",
                                border: "none",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                borderRadius: "3px",
                                cursor: "pointer"
                              }}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {copilotStep === "planning" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: "10px" }}>
                        <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid #FFB236", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                        <div style={{ fontSize: "12px", color: "#FFB236", fontWeight: "bold" }}>Generating Implementation Plan...</div>
                        <div style={{ width: "100%", maxHeight: "150px", overflowY: "auto", background: "var(--panel-2)", padding: "8px", borderRadius: "4px", fontSize: "10.5px", fontFamily: "var(--mono)" }}>
                          {copilotPlan}
                        </div>
                      </div>
                    )}

                    {copilotStep === "plan_ready" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ background: "rgba(255, 178, 54, 0.03)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px", maxHeight: "250px", overflowY: "auto" }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#FFB236", marginBottom: "8px", textTransform: "uppercase" }}>Proposed Implementation Plan:</div>
                          <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--mono)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                            {copilotPlan}
                          </div>
                        </div>

                        <button
                          onClick={approveAndGenerateCode}
                          style={{
                            background: "#5EE0A8",
                            color: "black",
                            border: "none",
                            padding: "10px 16px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(94, 224, 168, 0.2)"
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: "14px", height: "14px" }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Approve Plan & Code
                        </button>
                      </div>
                    )}

                    {copilotStep === "coding" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid #5EE0A8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                          <span style={{ fontSize: "12px", color: "#5EE0A8", fontWeight: "bold" }}>Coding model streaming code...</span>
                        </div>
                        <div style={{ width: "100%", maxHeight: "200px", overflowY: "auto", background: "var(--panel-2)", padding: "10px", borderRadius: "4px", fontSize: "10.5px", fontFamily: "var(--mono)" }}>
                          {copilotLogs.map((l, i) => (
                            <div key={i} style={{ color: "var(--text-dim)", marginBottom: "4px" }}>[{l.time}] {l.message}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {copilotStep === "qa" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid #FFB236", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                          <span style={{ fontSize: "12px", color: "#FFB236", fontWeight: "bold" }}>Manager reviewing code quality (QA)...</span>
                        </div>

                        {qaCritiqueLog && (
                          <div style={{ background: "rgba(255, 178, 54, 0.05)", border: "1px solid rgba(255, 178, 54, 0.15)", borderRadius: "4px", padding: "10px", maxHeight: "150px", overflowY: "auto", fontSize: "10.5px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                            <div style={{ fontWeight: "bold", color: "#FFB236", marginBottom: "4px" }}>QA Critique & Refinement Plan:</div>
                            {qaCritiqueLog}
                          </div>
                        )}

                        <div style={{ width: "100%", maxHeight: "150px", overflowY: "auto", background: "var(--panel-2)", padding: "8px", borderRadius: "4px", fontSize: "10.5px", fontFamily: "var(--mono)" }}>
                          {copilotLogs.map((l, i) => (
                            <div key={i} style={{ color: "var(--text-dim)", marginBottom: "4px" }}>[{l.time}] {l.message}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {copilotStep === "finished" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ background: "rgba(94, 224, 168, 0.08)", border: "1px solid rgba(94, 224, 168, 0.2)", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "24px", marginBottom: "6px" }}>✓</div>
                          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#5EE0A8" }}>Workflow Completed!</div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>The code has been generated, critiqued by QA, refined, and verified.</p>
                        </div>

                        {qaCritiqueLog && (
                          <div style={{ background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "4px", padding: "10px", maxHeight: "150px", overflowY: "auto", fontSize: "10.5px", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                            <div style={{ fontWeight: "bold", color: "#5EE0A8", marginBottom: "4px" }}>Final QA Critique & Verification:</div>
                            {qaCritiqueLog}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setCopilotStep("idle");
                            setCodeGenStatus("Awaiting prompt · HTML/CSS/JS");
                          }}
                          style={{
                            background: "var(--panel-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            padding: "8px 12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Start New Task
                        </button>
                      </div>
                    )}

                    {copilotStep === "error" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ background: "rgba(255, 82, 64, 0.08)", border: "1px solid rgba(255, 82, 64, 0.2)", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "24px", marginBottom: "6px" }}>⚠️</div>
                          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#FF5240" }}>Workflow Error</div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>An error occurred during execution.</p>
                        </div>
                        <div style={{ width: "100%", maxHeight: "150px", overflowY: "auto", background: "var(--panel-2)", padding: "8px", borderRadius: "4px", fontSize: "10.5px", fontFamily: "var(--mono)", color: "#FF5240" }}>
                          {copilotLogs.map((l, i) => (
                            <div key={i} style={{ marginBottom: "4px" }}>[{l.time}] {l.message}</div>
                          ))}
                        </div>
                        <button
                          onClick={() => startCopilotInitial()}
                          style={{
                            background: "var(--panel-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            padding: "8px 12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Retry Step
                        </button>
                      </div>
                    )}

                    {codeGenerating && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", color: "var(--text-dim)" }}>
                          <span>Elapsed Time: <strong style={{ color: "#FFB236" }}>{loadingSeconds}s</strong></span>
                          {loadingSeconds >= 12 && (
                            <span style={{ color: "#FF5240", fontWeight: "bold" }}>⚠️ Action may be stuck</span>
                          )}
                        </div>
                        
                        {loadingSeconds >= 12 && (
                          <div style={{
                            background: "rgba(255, 178, 54, 0.08)",
                            border: "1px solid #FFB236",
                            borderRadius: "4px",
                            padding: "8px 10px",
                            fontSize: "11px",
                            color: "#FFB236",
                            lineHeight: "1.4"
                          }}>
                            The API response is taking longer than usual. You can cancel and restart the request using the button below.
                          </div>
                        )}

                        <button
                          onClick={stopCopilotWorkflow}
                          style={{
                            background: "rgba(255, 82, 64, 0.1)",
                            border: "1px solid #FF5240",
                            color: "#FF5240",
                            padding: "8px 12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                            fontFamily: "var(--sans)"
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                          </svg>
                          Cancel / Reset Agent
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
            
            <div className="code-prompt-wrap">
              <form onSubmit={handleGenerateCode} className="code-prompt-bar" id="codePromptBar">
                <svg className="cpb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <textarea
                  id="codePromptInput"
                  rows="1"
                  placeholder="Describe the code you want generated — a function, a file, a refactor…"
                  value={codePrompt}
                  onChange={(e) => setCodePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateCode();
                    }
                  }}
                />
                <button type="submit" className="code-prompt-go" id="codePromptGo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
              <div className="composer-hint">Codeinc generates code — it doesn't execute it. Run generated code in your own environment.</div>
            </div>
          </div>

          {/* ===== VISUAL WORKSPACE ===== */}
          <div className={`view ${mode === "visual" ? "active" : ""}`} id="viewVisual">
            <div className="ws-header">
              <div className="ws-header-left">
                <div className="ws-icon-big" style={{ background: "var(--visual)", boxShadow: "0 0 24px var(--visual-glow)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <div className="ws-title">Visual</div>
                  <div className="ws-subtitle" id="visualSubtitle">
                    {visualType === "image" ? "Generate images from a text prompt" : "Generate short video clips from a text prompt"}
                  </div>
                </div>
              </div>
              <div className="visual-type-toggle" id="visualTypeToggle">
                <button
                  type="button"
                  className={`vt-btn ${visualType === "image" ? "active" : ""}`}
                  onClick={() => setVisualType("image")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Image
                </button>
                <button
                  type="button"
                  className={`vt-btn ${visualType === "video" ? "active" : ""}`}
                  onClick={() => setVisualType("video")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  Video
                </button>
              </div>
            </div>

            <div className="visual-body">
              <div className="visual-main">
                <div className="visual-prompt-row">
                  <textarea
                    id="visualPrompt"
                    rows={1}
                    placeholder={visualType === "image" ? "Describe the image you want to generate…" : "Describe the video clip you want to generate…"}
                    value={visualPrompt}
                    onChange={(e) => setVisualPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateVisual();
                      }
                    }}
                  />
                  <button onClick={handleGenerateVisual} className="visual-go" id="visualGo" disabled={visualGenerating}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
                    </svg>
                    <span>{visualGenerating ? "Generating..." : "Generate"}</span>
                  </button>
                </div>

                <div className="visual-options">
                  <div className="vopt-group">
                    <span className="vopt-label">Style</span>
                    {["Photoreal", "Isometric", "Illustration", "3D render"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setVisualStyle(style)}
                        className={`vopt-chip ${visualStyle === style ? "active" : ""}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <div className="vopt-group" id="aspectGroup">
                    <span className="vopt-label">Aspect</span>
                    {["1:1", "16:9", "9:16"].map((aspect) => (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => setVisualAspect(aspect)}
                        className={`vopt-chip ${visualAspect === aspect ? "active" : ""}`}
                      >
                        {aspect}
                      </button>
                    ))}
                  </div>
                  {visualType === "video" && (
                    <div className="vopt-group" id="durationGroup">
                      <span className="vopt-label">Duration</span>
                      {["4s", "8s", "12s"].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => setVisualDuration(duration)}
                          className={`vopt-chip ${visualDuration === duration ? "active" : ""}`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {visualGenerating && (
                  <div className="visual-status" id="visualStatus">
                    <div className="vdot"></div>
                    <span>{visualStatusText}</span>
                  </div>
                )}

                <div className="visual-grid" id="visualGrid">
                  {visualTiles.length > 0 ? (
                    visualTiles.map((tile) => (
                      <div
                        key={tile.id}
                        className={`visual-tile ${tile.aspect === "16:9" ? "wide" : tile.aspect === "9:16" ? "tall" : ""}`}
                      >
                        <div className="visual-tile-label">
                          {tile.style} · {tile.aspect} {tile.isVideo && "· Video"}
                        </div>
                      </div>
                    ))
                  ) : (
                    !visualGenerating && (
                      <div className="visual-empty" id="visualEmpty">
                        <div className="visual-empty-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <p>Generated {visualType === "image" ? "images" : "videos"} will appear here</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="visual-sidebar">
                <h4>History</h4>
                <div id="visualHistoryCards">
                  {visualHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setVisualPrompt(item.title);
                        setVisualStyle(item.style);
                        setVisualAspect(item.aspect);
                        setVisualType(item.isVideo ? "video" : "image");
                        setVisualTiles([
                          { id: item.id + 10, style: item.style, aspect: item.aspect, isVideo: item.isVideo }
                        ]);
                      }}
                      className="vhist-card"
                    >
                      <div className={`vhist-thumb ${item.thumbClass}`}></div>
                      <div className="vhist-meta">
                        <div className="vhist-title">{item.title}</div>
                        <div className="vhist-sub">
                          {item.style} · {item.aspect}
                        </div>
                      </div>
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

      {/* CUSTOM CONFIRM/PROMPT MODAL DIALOG OVERLAY */}
      {customModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => customModal.onCancel?.()}
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
          />
          <div className="bg-[#13161B] w-full max-w-sm rounded border border-[#262B33] p-5 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 font-sans">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {customModal.type === 'confirm' ? '⚠️' : '📝'} {customModal.title}
              </h2>
              <p className="text-[#8A919C] text-xs mt-2 leading-relaxed">
                {customModal.message}
              </p>
            </div>

            {customModal.type === 'prompt' && (
              <div className="mt-1">
                <input
                  type="text"
                  value={customModalInputVal}
                  onChange={(e) => setCustomModalInputVal(e.target.value)}
                  placeholder={customModal.placeholder || ''}
                  className="w-full bg-[#0B0D10] border border-[#262B33] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5EE0A8] transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      customModal.onConfirm(customModalInputVal);
                    } else if (e.key === 'Escape') {
                      customModal.onCancel?.();
                    }
                  }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => customModal.onCancel?.()}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-[#262B33] bg-[#0B0D10] text-[#8A919C] hover:bg-[#1E2330] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customModal.type === 'prompt') {
                    customModal.onConfirm(customModalInputVal);
                  } else {
                    customModal.onConfirm();
                  }
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded text-white transition-all cursor-pointer ${
                  customModal.title.toLowerCase().includes('delete')
                    ? 'bg-[#FF453A] hover:bg-[#FF453A]/90'
                    : 'bg-[#5EE0A8] hover:bg-[#5EE0A8]/90 !text-[#0B0D10]'
                }`}
              >
                {customModal.type === 'prompt' ? 'Create' : customModal.title.toLowerCase().includes('delete') ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW FILE / FOLDER SELECTOR BOX MODAL */}
      {createResourceModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setCreateResourceModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
          />
          <div className="bg-[#13161B] w-full max-w-md rounded border border-[#262B33] p-5 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 font-sans">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                📁 Create New Resource
              </h2>
              <p className="text-[#8A919C] text-xs mt-1">
                Enter name and select type below.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-subtext font-black uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
                placeholder={newResourceType === "folder" ? "styles" : "index"}
                className="w-full bg-[#0B0D10] border border-[#262B33] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5EE0A8] transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateResource();
                  } else if (e.key === 'Escape') {
                    setCreateResourceModalOpen(false);
                  }
                }}
              />
              {newResourceName.trim() && (
                <span className="text-[10px] text-[#8A919C] mt-1 font-mono">
                  Will create: <span className="text-[#5EE0A8]">
                    {selectedParentFolder === "/" ? "" : selectedParentFolder + "/"}
                    {newResourceName.trim()}
                    {newResourceType === "html" && !newResourceName.toLowerCase().endsWith(".html") ? ".html" : ""}
                    {newResourceType === "jsx" && !newResourceName.toLowerCase().endsWith(".jsx") ? ".jsx" : ""}
                    {newResourceType === "js" && !newResourceName.toLowerCase().endsWith(".js") ? ".js" : ""}
                    {newResourceType === "css" && !newResourceName.toLowerCase().endsWith(".css") ? ".css" : ""}
                    {newResourceType === "folder" ? "/ (folder)" : ""}
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-subtext font-black uppercase tracking-wider">Destination Folder</label>
              <select
                value={selectedParentFolder}
                onChange={(e) => setSelectedParentFolder(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#262B33] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5EE0A8] transition-colors"
              >
                <option value="/">/ (Root)</option>
                {getExistingFolders().map(folder => (
                  <option key={folder} value={folder}>/{folder}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-brand-subtext font-black uppercase tracking-wider">Select Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "html", label: "HTML File", icon: "🌐" },
                  { id: "jsx", label: "React JSX", icon: "⚛️" },
                  { id: "js", label: "JavaScript", icon: "🟨" },
                  { id: "css", label: "CSS Style", icon: "🎨" },
                  { id: "folder", label: "Folder", icon: "📁" },
                  { id: "custom", label: "Custom", icon: "📄" }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setNewResourceType(item.id)}
                    className={`p-3 rounded border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      newResourceType === item.id
                        ? "border-[#5EE0A8] bg-[#5EE0A8]/10 text-white"
                        : "border-[#262B33] bg-[#0B0D10] text-[#8A919C] hover:border-[#262B33]/80 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[10px] font-bold font-sans">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setCreateResourceModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-[#262B33] bg-[#0B0D10] text-[#8A919C] hover:bg-[#1E2330] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResource}
                className="px-3.5 py-1.5 text-xs font-bold rounded bg-[#5EE0A8] hover:bg-[#5EE0A8]/90 text-[#0B0D10] transition-all cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
