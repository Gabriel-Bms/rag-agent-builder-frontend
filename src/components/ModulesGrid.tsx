
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LangChainIcon, OpenAIIcon, ChromaIcon, DefaultIcon } from "./Icons";
import { CustomSelect } from "./CustomSelect";

interface UploadResponse {
  total_pages: number;
  preview: string;
  file_path: string;
}

export function ModulesGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState<{
    fileName: string;
    response: UploadResponse;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Split Document states
  const [splitSource, setSplitSource] = useState("LangChain");
  const [chunkingStrategy, setChunkingStrategy] = useState("RecursiveCharacterTextSplitter");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunkData, setChunkData] = useState<{
    total_chunks: number;
    sample_chunks: string[];
  } | null>(null);
  const [showChunkPreview, setShowChunkPreview] = useState(false);
  const [showSplitParamsModal, setShowSplitParamsModal] = useState(false);

  // Chunking parameters
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [separator, setSeparator] = useState("\\n\\n");
  const [tokenChunkSize, setTokenChunkSize] = useState(512);
  const [tokenChunkOverlap, setTokenChunkOverlap] = useState(50);

  // Embeddings states
  const [embeddingsProvider, setEmbeddingsProvider] = useState("OpenAI");
  const [embeddingsModel, setEmbeddingsModel] = useState("text-embedding-3-small");
  const [selectedCredential, setSelectedCredential] = useState("");
  const [credentials, setCredentials] = useState<{
    id: string;
    name: string;
    provider: string;
    key: string;
  }[]>([]);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [isEditingCredential, setIsEditingCredential] = useState(false);
  const [credentialName, setCredentialName] = useState("");
  const [credentialKey, setCredentialKey] = useState("");
  const [credentialProvider, setCredentialProvider] = useState("OpenAI");
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embedData, setEmbedData] = useState<{
    dimension: number;
    sample_vector: number[];
  } | null>(null);
  const [embedError, setEmbedError] = useState("");

  // Vector Database states
  const [vectorDbProvider, setVectorDbProvider] = useState("FAISS");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [collections, setCollections] = useState<string[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isInsertingEmbeddings, setIsInsertingEmbeddings] = useState(false);

  // Language Model states
  const [llmProvider, setLlmProvider] = useState("OpenAI");
  const [llmModel, setLlmModel] = useState("gpt-4o");
  const [selectedLlmCredential, setSelectedLlmCredential] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [showParamsModal, setShowParamsModal] = useState(false);
  const [isConfiguringLLM, setIsConfiguringLLM] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState(false);


  useEffect(() => {
    const initSession = async () => {
      const urlSessionId = searchParams.get("session_id");

      if (urlSessionId) {
        setSessionId(urlSessionId);
        // Store in sessionStorage for access from other pages
        sessionStorage.setItem('rag_session_id', urlSessionId);
      } else {
        try {
          const res = await fetch("http://localhost:8000/api/v1/session", { method: "POST" });
          const newSessionId = await res.json();
          setSessionId(newSessionId);

          // Store in sessionStorage for access from other pages
          sessionStorage.setItem('rag_session_id', newSessionId);

          // Update URL without reload
          const params = new URLSearchParams(searchParams.toString());
          params.set("session_id", newSessionId);
          router.replace(`/?${params.toString()}`);
        } catch (error) {
          console.error("Failed to init session:", error);
        }
      }
    };

    initSession();
  }, [searchParams, router]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    setIsUploading(true);

    // Simulate form data (though we are just hitting a mock endpoint)
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/ingest/${sessionId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadData({
        fileName: file.name,
        response: data
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessChunks = async () => {
    if (!sessionId) return;

    setIsProcessing(true);

    try {
      let payload: any = {};

      // Build payload based on strategy
      switch (chunkingStrategy) {
        case 'RecursiveCharacterTextSplitter':
          payload = {
            strategy: "recursive",
            chunk_size: chunkSize,
            chunk_overlap: chunkOverlap,
            separators: ["\n\n", "\n", ". ", " ", ""]
          };
          break;

        case 'CharacterTextSplitter':
          payload = {
            strategy: "character",
            separator: separator,
            chunk_size: chunkSize,
            chunk_overlap: chunkOverlap
          };
          break;

        case 'TokenTextSplitter':
          payload = {
            strategy: "token",
            chunk_size: tokenChunkSize,
            chunk_overlap: tokenChunkOverlap
          };
          break;

        case 'MarkdownHeaderTextSplitter':
          payload = {
            strategy: "markdown_header",
            headers_to_split_on: [
              ["#", "Header 1"],
              ["##", "Header 2"],
              ["###", "Header 3"]
            ]
          };
          break;

        case 'HTMLHeaderTextSplitter':
          payload = {
            strategy: "html_header",
            headers_to_split_on: [
              ["h1", "Header 1"],
              ["h2", "Header 2"],
              ["p", "Paragraph"]
            ]
          };
          break;
      }

      const res = await fetch(`http://localhost:8000/api/v1/chunk/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setChunkData({
        total_chunks: data.total_chunks,
        sample_chunks: data.sample_chunks
      });
    } catch (error) {
      console.error("Chunking failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get model options based on provider
  const getModelOptions = () => {
    switch (embeddingsProvider) {
      case "OpenAI":
        return ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
      case "AWS Bedrock":
        return ["amazon.titan-embed-text-v2:0", "amazon.titan-embed-text-v1", "cohere.embed-multilingual-v3"];
      case "Google GenAI":
        return ["text-embedding-004", "embedding-001"];
      default:
        return [];
    }
  };

  // Handle opening credential modal for adding
  const handleAddCredential = () => {
    setIsEditingCredential(false);
    setCredentialName("");
    setCredentialKey("");
    setCredentialProvider(embeddingsProvider);
    setShowCredentialModal(true);
  };

  // Handle opening credential modal for editing
  const handleEditCredential = () => {
    const cred = credentials.find(c => c.name === selectedCredential);
    if (cred) {
      setIsEditingCredential(true);
      setCredentialName(cred.name);
      setCredentialKey(cred.key);
      setCredentialProvider(cred.provider);
      setShowCredentialModal(true);
    }
  };

  // Save credential
  const handleSaveCredential = async () => {
    if (!credentialName || !credentialKey || !sessionId) return;

    // Map provider names to backend format
    const providerMap: { [key: string]: string } = {
      "OpenAI": "openai",
      "AWS Bedrock": "aws_bedrock",
      "Google GenAI": "google_genai"
    };

    const newCred = {
      id: isEditingCredential
        ? credentials.find(c => c.name === selectedCredential)?.id || `cred_${Date.now()}`
        : `cred_${Date.now()}`,
      name: credentialName,
      provider: providerMap[credentialProvider],
      key: credentialKey
    };

    let updatedCredentials;
    if (isEditingCredential) {
      // Update existing
      updatedCredentials = credentials.map(c =>
        c.name === selectedCredential ? newCred : c
      );
    } else {
      // Add new
      updatedCredentials = [...credentials, newCred];
      setSelectedCredential(credentialName);
    }

    setCredentials(updatedCredentials);

    // Save to backend credentials.json
    try {
      await fetch(`http://localhost:8000/api/v1/credentials/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available_credentials: updatedCredentials
        })
      });
    } catch (error) {
      console.error("Failed to save credential:", error);
    }

    setShowCredentialModal(false);
  };

  // Generate embeddings
  const handleGenerateEmbeddings = async () => {
    if (!sessionId || !selectedCredential) return;

    setIsGeneratingEmbeddings(true);
    setEmbedError("");
    setEmbedData(null);

    try {
      // Map provider names to backend format
      const providerMap: { [key: string]: string } = {
        "OpenAI": "openai",
        "AWS Bedrock": "aws_bedrock",
        "Google GenAI": "google_genai"
      };

      const res = await fetch(`http://localhost:8000/api/v1/embed/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: providerMap[embeddingsProvider],
          model_name: embeddingsModel,
          credential_name: selectedCredential
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle error responses
        setEmbedError(data.detail || "Failed to generate embeddings");
      } else {
        // Success - save results
        setEmbedData({
          dimension: data.dimension,
          sample_vector: data.sample_vector
        });
      }
    } catch (error: any) {
      console.error("Embedding generation failed:", error);
      setEmbedError(error.message || "Network error occurred");
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Create new collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    // Add to collections list
    setCollections([...collections, newCollectionName]);
    setSelectedCollection(newCollectionName);
    setNewCollectionName("");
    setShowCollectionModal(false);
  };

  // Insert embeddings to vector database
  const handleInsertEmbeddings = async () => {
    if (!sessionId || !selectedCollection) return;

    setIsInsertingEmbeddings(true);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/vectordb/insert/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: vectorDbProvider.toLowerCase(),
          collection_name: selectedCollection
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Insert failed:", data.detail);
      } else {
        console.log("Embeddings inserted successfully:", data);
      }
    } catch (error: any) {
      console.error("Insert embeddings failed:", error);
    } finally {
      setIsInsertingEmbeddings(false);
    }
  };

  // Configure Language Model
  const handleConfigureLLM = async () => {
    if (!sessionId || !selectedLlmCredential) return;

    setIsConfiguringLLM(true);
    setLlmConfigured(false);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/llm/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: llmProvider.toLowerCase(),
          model_name: llmModel,
          temperature: temperature,
          credential_name: selectedLlmCredential
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("LLM configuration failed:", data.detail);
      } else {
        console.log("LLM configured successfully:", data);
        setLlmConfigured(true);
      }
    } catch (error: any) {
      console.error("LLM configuration failed:", error);
    } finally {
      setIsConfiguringLLM(false);
    }
  };


  return (
    <>
      <div className="w-full max-w-[1280px] grid grid-cols-3 gap-8 relative z-10 mx-auto">
        {/* Module 01: Upload Document */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 01
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Cargar Documento
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--nvidia-green)] p-2 bg-white/40 rounded-full">
              cloud_upload
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf"
          />

          {!uploadData ? (
            <div className={`flex-1 portal-upload flex flex-col items-center justify-center p-6 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-white/20'}`}>
              <div className="size-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-xl shadow-gray-400/10">
                {isUploading ? (
                  <span className="material-symbols-outlined text-3xl text-[var(--champagne-gold)] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-3xl text-[var(--champagne-gold)]">
                    add
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--gunmetal-gray)] text-center font-semibold mb-4">
                {isUploading ? "INGESTING DATA..." : "DRAG & DROP DATA CORE"}
              </p>
              <button
                onClick={handleFileSelect}
                className="px-6 py-2 bg-white/60 border border-[var(--brushed-bronze)]/20 rounded-full text-[var(--brushed-bronze)] text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
              >
                Seleccionar Archivo
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="size-12 rounded-xl bg-[var(--nvidia-green)]/10 flex items-center justify-center mb-3 text-[var(--nvidia-green)]">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--obsidian-black)] mb-1 truncate max-w-full text-center px-2">
                {uploadData.fileName}
              </h4>
              <span className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest mb-4">
                {uploadData.response.total_pages} Pages Processed
              </span>
              <button
                onClick={() => setShowPreview(true)}
                className="w-full py-2 bg-[var(--obsidian-black)] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[var(--gunmetal-gray)] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                Ver Contenido
              </button>
              <button
                onClick={() => setUploadData(null)}
                className="mt-2 text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest hover:underline"
              >
                Subir Nuevo
              </button>
            </div>
          )}
        </div>


        {/* Module 02: Split Document */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 02
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Dividir Documento
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--nvidia-green)] p-2 bg-white/40 rounded-full">
              content_cut
            </span>
          </div>
          <div className="space-y-6">
            {!chunkData ? (
              <>
                {/* Source Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                    Fuente
                  </label>
                  <CustomSelect
                    value={splitSource}
                    onChange={setSplitSource}
                    options={[
                      { value: "LangChain", label: "LangChain", icon: LangChainIcon },
                      { value: "Custom", label: "Custom", icon: DefaultIcon },
                    ]}
                  />
                </div>

                {/* Chunking Strategy Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                    Estrategia de Chunking
                  </label>
                  <select
                    className="custom-select w-full text-[var(--obsidian-black)] font-medium"
                    value={chunkingStrategy}
                    onChange={(e) => setChunkingStrategy(e.target.value)}
                  >
                    <option value="RecursiveCharacterTextSplitter">RecursiveCharacterTextSplitter</option>
                    <option value="CharacterTextSplitter">CharacterTextSplitter</option>
                    <option value="TokenTextSplitter">TokenTextSplitter</option>
                    <option value="MarkdownHeaderTextSplitter">MarkdownHeaderTextSplitter</option>
                    <option value="HTMLHeaderTextSplitter">HTMLHeaderTextSplitter</option>
                  </select>
                </div>

                {/* Configurar Parámetros Button */}
                <button
                  onClick={() => setShowSplitParamsModal(true)}
                  className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 text-[var(--obsidian-black)] py-3 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-white/60 transition-all"
                >
                  Configurar Parámetros
                </button>

                {/* Process Button */}
                <button
                  onClick={handleProcessChunks}
                  disabled={!sessionId || isProcessing}
                  className="w-full mt-4 bg-[var(--obsidian-black)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Generar Chunks"}
                </button>
              </>
            ) : (
              <>
                {/* Results View */}
                <div className="p-4 bg-[var(--nvidia-green)]/10 border border-[var(--nvidia-green)]/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--gunmetal-gray)] uppercase">
                      Total Chunks: {chunkData.total_chunks}
                    </span>
                    <button
                      onClick={() => setShowChunkPreview(true)}
                      className="text-sm font-bold text-[var(--nvidia-green)] hover:underline uppercase"
                    >
                      Ver Muestras
                    </button>
                  </div>
                </div>

                {/* Re-process Button */}
                <button
                  onClick={() => setChunkData(null)}
                  className="w-full bg-[var(--brushed-bronze)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all"
                >
                  Re-process Chunks
                </button>
              </>
            )}
          </div>
        </div>


        {/* Module 03: Embeddings */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 03
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Embeddings
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--nvidia-green)] p-2 bg-white/40 rounded-full">
              memory
            </span>
          </div>
          <div className="space-y-4">
            {/* Provider Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                Proveedor
              </label>
              <CustomSelect
                value={embeddingsProvider}
                onChange={(val) => {
                  setEmbeddingsProvider(val);
                  setEmbeddingsModel(getModelOptions()[0] || "");
                }}
                options={[
                  { value: "OpenAI", label: "OpenAI", icon: OpenAIIcon },
                  { value: "AWS Bedrock", label: "AWS Bedrock", icon: DefaultIcon },
                  { value: "Google GenAI", label: "Google GenAI", icon: DefaultIcon },
                ]}
              />
            </div>

            {/* Embeddings Model Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                Modelo de Embeddings
              </label>
              <select
                className="custom-select w-full text-[var(--obsidian-black)] font-medium"
                value={embeddingsModel}
                onChange={(e) => setEmbeddingsModel(e.target.value)}
              >
                {getModelOptions().map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Connect Credentials - Only for OpenAI and Google GenAI */}
            {(embeddingsProvider === "OpenAI" || embeddingsProvider === "Google GenAI") && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Conectar Credenciales
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <select
                      className="custom-select flex-1 text-[var(--obsidian-black)] font-medium"
                      value={selectedCredential}
                      onChange={(e) => setSelectedCredential(e.target.value)}
                    >
                      <option value="">Select credential...</option>
                      {credentials
                        .filter(cred => {
                          const providerMap: { [key: string]: string } = {
                            "OpenAI": "openai",
                            "AWS Bedrock": "aws_bedrock",
                            "Google GenAI": "google_genai"
                          };
                          return cred.provider === providerMap[embeddingsProvider];
                        })
                        .map((cred) => (
                          <option key={cred.id} value={cred.name}>{cred.name}</option>
                        ))
                      }
                    </select>
                    {selectedCredential && (
                      <button
                        onClick={handleEditCredential}
                        className="size-10 rounded-lg bg-white/40 border border-[var(--gunmetal-gray)]/30 flex items-center justify-center hover:bg-white/60 transition-colors"
                        title="Edit credential"
                      >
                        <span className="material-symbols-outlined text-lg text-[var(--gunmetal-gray)]">
                          edit
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleAddCredential}
                    className="size-10 rounded-lg bg-[var(--brushed-bronze)] flex items-center justify-center hover:brightness-110 transition-all shadow-md"
                    title="Add new credential"
                  >
                    <span className="material-symbols-outlined text-lg text-white">
                      add
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Generate Embeddings Button */}
            <button
              onClick={handleGenerateEmbeddings}
              disabled={!sessionId || isGeneratingEmbeddings}
              className="w-full mt-2 bg-[var(--obsidian-black)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingEmbeddings ? "Generating..." : "Generar Embeddings"}
            </button>

            {/* Error Display */}
            {embedError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">
                    error
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Error</p>
                    <p className="text-xs text-red-600">{embedError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {embedData && (
              <div className="mt-3 p-4 bg-[var(--nvidia-green)]/10 border border-[var(--nvidia-green)]/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--gunmetal-gray)] uppercase">
                    ✓ Embeddings Generated
                  </span>
                  <span className="text-xs font-bold text-[var(--nvidia-green)] bg-[var(--nvidia-green)]/10 px-2 py-1 rounded">
                    {embedData.dimension}D
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                    Sample Vector (first 5)
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {embedData.sample_vector.map((val, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono text-[var(--gunmetal-gray)] bg-white/50 px-2 py-1 rounded border border-[var(--gunmetal-gray)]/20"
                      >
                        {val.toFixed(3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Module 04: Vector Database */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 04
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Base de Datos Vectorial
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--champagne-gold)] p-2 bg-white/40 rounded-full">
              database
            </span>
          </div>
          <div className="space-y-4">
            {/* Provider Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                Proveedor
              </label>
              <CustomSelect
                value={vectorDbProvider}
                onChange={setVectorDbProvider}
                options={[
                  { value: "FAISS", label: "FAISS", icon: DefaultIcon },
                  { value: "Chroma", label: "Chroma", icon: ChromaIcon },
                  { value: "Pinecone", label: "Pinecone", icon: DefaultIcon },
                  { value: "In-memory", label: "In-memory", icon: DefaultIcon },
                ]}
              />
            </div>

            {/* Collections Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                Colecciones
              </label>
              <div className="flex items-center gap-2">
                <select
                  className="custom-select flex-1 text-[var(--obsidian-black)] font-medium"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  <option value="">Select collection...</option>
                  {collections.map((collection) => (
                    <option key={collection} value={collection}>{collection}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCollectionModal(true)}
                  className="size-10 rounded-lg bg-[var(--brushed-bronze)] flex items-center justify-center hover:brightness-110 transition-all shadow-md"
                  title="Create new collection"
                >
                  <span className="material-symbols-outlined text-lg text-white">
                    add
                  </span>
                </button>
              </div>
            </div>

            {/* Insert Embeddings Button */}
            <button
              onClick={handleInsertEmbeddings}
              disabled={!sessionId || !selectedCollection || isInsertingEmbeddings}
              className="w-full mt-2 bg-[var(--obsidian-black)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInsertingEmbeddings ? "Inserting..." : "Insertar Embeddings"}
            </button>
          </div>
        </div>

        {/* Module 05: Rerankers */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 05
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Rerankers
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--champagne-gold)] p-2 bg-white/40 rounded-full">
              manage_search
            </span>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                Modelo de Reranking
              </label>
              <select className="custom-select w-full text-[var(--obsidian-black)] font-medium">
                <option>Cohere-Rerank-v3</option>
                <option>BGE-Reranker-Large</option>
                <option>Cross-Encoder-MsMarco</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Top K Results
                </label>
                <span className="text-xs font-bold text-[var(--nvidia-green)]">
                  10
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button className="py-2 rounded-lg border border-[var(--gunmetal-gray)]/20 text-[10px] text-[var(--gunmetal-gray)] font-bold hover:bg-white/50">
                  3
                </button>
                <button className="py-2 rounded-lg border border-[var(--gunmetal-gray)]/20 text-[10px] text-[var(--gunmetal-gray)] font-bold hover:bg-white/50">
                  5
                </button>
                <button className="py-2 rounded-lg border-2 border-[var(--nvidia-green)] bg-[var(--nvidia-green)]/10 text-[10px] text-[var(--nvidia-green)] font-bold">
                  10
                </button>
                <button className="py-2 rounded-lg border border-[var(--gunmetal-gray)]/20 text-[10px] text-[var(--gunmetal-gray)] font-bold hover:bg-white/50">
                  20
                </button>
              </div>
            </div>

            {/* Configurar Reranker Button */}
            <button
              disabled={!sessionId}
              className="w-full mt-4 bg-[var(--obsidian-black)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Configurar Reranker
            </button>
          </div>
        </div>

        {/* Module 06: Language Model */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold text-[var(--brushed-bronze)] uppercase tracking-widest block mb-1">
                Módulo 06
              </span>
              <h3 className="text-xl font-bold text-[var(--obsidian-black)] tracking-tight">
                Modelo de Lenguaje
              </h3>
            </div>
            <span className="material-symbols-outlined text-[var(--champagne-gold)] p-2 bg-white/40 rounded-full">
              psychology
            </span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Provider Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Proveedor
                </label>
                <CustomSelect
                  value={llmProvider}
                  onChange={setLlmProvider}
                  options={[
                    { value: "OpenAI", label: "OpenAI", icon: OpenAIIcon },
                  ]}
                />
              </div>

              {/* Language Model Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Modelo de Lenguaje
                </label>
                <select
                  className="custom-select w-full text-[var(--obsidian-black)] font-medium"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                >
                  <option value="gpt-5-nano">gpt-5-nano</option>
                  <option value="gpt-5.2-chat-latest">gpt-5.2-chat-latest</option>
                  <option value="gpt-5.1-chat-latest">gpt-5.1-chat-latest</option>
                  <option value="gpt-5-chat-latest">gpt-5-chat-latest</option>
                  <option value="gpt-4.1">gpt-4.1</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </select>
              </div>
            </div>

            {/* Connect Credentials (only for OpenAI) */}
            {llmProvider === "OpenAI" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Conectar Credenciales
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <select
                      className="custom-select flex-1 text-[var(--obsidian-black)] font-medium"
                      value={selectedLlmCredential}
                      onChange={(e) => setSelectedLlmCredential(e.target.value)}
                    >
                      <option value="">Select credential...</option>
                      {credentials
                        .filter(cred => cred.provider === "openai")
                        .map((cred) => (
                          <option key={cred.id} value={cred.name}>{cred.name}</option>
                        ))
                      }
                    </select>
                    {selectedLlmCredential && (
                      <button
                        onClick={handleEditCredential}
                        className="size-10 rounded-lg bg-white/40 border border-[var(--gunmetal-gray)]/30 flex items-center justify-center hover:bg-white/60 transition-colors"
                        title="Edit credential"
                      >
                        <span className="material-symbols-outlined text-lg text-[var(--gunmetal-gray)]">
                          edit
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleAddCredential}
                    className="size-10 rounded-lg bg-[var(--brushed-bronze)] flex items-center justify-center hover:brightness-110 transition-all shadow-md"
                    title="Add new credential"
                  >
                    <span className="material-symbols-outlined text-lg text-white">
                      add
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Parameters Button */}
            <button
              onClick={() => setShowParamsModal(true)}
              className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 text-[var(--obsidian-black)] py-3 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-white/60 transition-all"
            >
              Configurar parámetros (T: {temperature})
            </button>

            {/* Configure LLM Button */}
            <button
              onClick={handleConfigureLLM}
              disabled={!sessionId || !selectedLlmCredential || isConfiguringLLM}
              className="w-full bg-[var(--obsidian-black)] text-white py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-gray-400/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfiguringLLM ? "Configurando..." : llmConfigured ? "✓ Configurado" : "Configurar LLM"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && uploadData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--obsidian-black)]">Document Preview</h3>
                <p className="text-xs text-[var(--gunmetal-gray)] font-medium">{uploadData.fileName}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-[var(--gunmetal-gray)] hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-[var(--gunmetal-gray)]">
                <p>{uploadData.response.preview}</p>
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-[var(--obsidian-black)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--gunmetal-gray)] transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chunk Preview Modal */}
      {showChunkPreview && chunkData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowChunkPreview(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--obsidian-black)]">Chunk Samples</h3>
                <p className="text-xs text-[var(--gunmetal-gray)] font-medium">
                  Total Chunks: {chunkData.total_chunks}
                </p>
              </div>
              <button
                onClick={() => setShowChunkPreview(false)}
                className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-[var(--gunmetal-gray)] hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="space-y-4">
                {chunkData.sample_chunks.map((chunk, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[var(--nvidia-green)] bg-[var(--nvidia-green)]/10 px-2 py-1 rounded">
                        Chunk {idx + 1}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--gunmetal-gray)] leading-relaxed whitespace-pre-wrap">
                      {chunk}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowChunkPreview(false)}
                className="px-6 py-2 bg-[var(--obsidian-black)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--gunmetal-gray)] transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credential Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowCredentialModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[var(--obsidian-black)]">
                {isEditingCredential ? "Edit Credential" : "Add New Credential"}
              </h3>
              <p className="text-xs text-[var(--gunmetal-gray)] mt-1">
                Configure API credentials for {embeddingsProvider}
              </p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Provider
                </label>
                <select
                  className="custom-select w-full text-[var(--obsidian-black)] font-medium"
                  value={credentialProvider}
                  onChange={(e) => setCredentialProvider(e.target.value)}
                >
                  <option value="OpenAI">OpenAI</option>
                  <option value="AWS Bedrock">AWS Bedrock</option>
                  <option value="Google GenAI">Google GenAI</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  API Key Name
                </label>
                <input
                  type="text"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  placeholder="e.g., My OpenAI Key"
                  className="w-full bg-white border border-[var(--gunmetal-gray)]/30 rounded-lg py-2.5 px-4 text-sm text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20 focus:border-[var(--brushed-bronze)] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  API Key Value
                </label>
                <input
                  type="password"
                  value={credentialKey}
                  onChange={(e) => setCredentialKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white border border-[var(--gunmetal-gray)]/30 rounded-lg py-2.5 px-4 text-sm font-mono text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20 focus:border-[var(--brushed-bronze)] outline-none transition-all"
                />
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="px-6 py-2 bg-gray-200 text-[var(--gunmetal-gray)] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredential}
                disabled={!credentialName || !credentialKey}
                className="px-6 py-2 bg-[var(--brushed-bronze)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditingCredential ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowCollectionModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[var(--obsidian-black)]">
                Create New Collection
              </h3>
              <p className="text-xs text-[var(--gunmetal-gray)] mt-1">
                Enter a name for your vector collection
              </p>
            </div>
            <div className="p-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g., my_documents"
                  className="w-full bg-white border border-[var(--gunmetal-gray)]/30 rounded-lg py-2.5 px-4 text-sm text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20 focus:border-[var(--brushed-bronze)] outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCollection();
                  }}
                />
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowCollectionModal(false)}
                className="px-6 py-2 bg-gray-200 text-[var(--gunmetal-gray)] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="px-6 py-2 bg-[var(--brushed-bronze)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Params Modal */}
      {showSplitParamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowSplitParamsModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[var(--obsidian-black)]">
                Configurar Parámetros
              </h3>
              <p className="text-xs text-[var(--gunmetal-gray)] mt-1">
                Ajusta los parámetros de división
              </p>
            </div>
            <div className="p-8">
              <div className="space-y-3 pt-2">
                {/* RecursiveCharacterTextSplitter Parameters */}
                {chunkingStrategy === 'RecursiveCharacterTextSplitter' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                          Chunk Size
                        </label>
                        <input
                          type="number"
                          value={chunkSize}
                          onChange={(e) => setChunkSize(Number(e.target.value))}
                          className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                          Chunk Overlap
                        </label>
                        <input
                          type="number"
                          value={chunkOverlap}
                          onChange={(e) => setChunkOverlap(Number(e.target.value))}
                          className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                        Separators
                      </label>
                      <div className="text-xs text-[var(--gunmetal-gray)] font-mono bg-white/30 p-2 rounded-lg border border-[var(--gunmetal-gray)]/20">
                        ["\n\n", "\n", ". ", " ", ""]
                      </div>
                    </div>
                  </>
                )}

                {/* CharacterTextSplitter Parameters */}
                {chunkingStrategy === 'CharacterTextSplitter' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                        Separator
                      </label>
                      <input
                        type="text"
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                        className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-mono text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                          Chunk Size
                        </label>
                        <input
                          type="number"
                          value={chunkSize}
                          onChange={(e) => setChunkSize(Number(e.target.value))}
                          className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                          Chunk Overlap
                        </label>
                        <input
                          type="number"
                          value={chunkOverlap}
                          onChange={(e) => setChunkOverlap(Number(e.target.value))}
                          className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TokenTextSplitter Parameters */}
                {chunkingStrategy === 'TokenTextSplitter' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                        Chunk Size (Tokens)
                      </label>
                      <input
                        type="number"
                        value={tokenChunkSize}
                        onChange={(e) => setTokenChunkSize(Number(e.target.value))}
                        className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                        Chunk Overlap
                      </label>
                      <input
                        type="number"
                        value={tokenChunkOverlap}
                        onChange={(e) => setTokenChunkOverlap(Number(e.target.value))}
                        className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2 px-3 text-sm font-medium text-[var(--obsidian-black)] focus:ring-2 focus:ring-[var(--brushed-bronze)]/20"
                      />
                    </div>
                  </div>
                )}

                {/* MarkdownHeaderTextSplitter Parameters */}
                {chunkingStrategy === 'MarkdownHeaderTextSplitter' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                      Headers to Split On
                    </label>
                    <div className="space-y-2">
                      {[
                        { symbol: '#', name: 'Header 1' },
                        { symbol: '##', name: 'Header 2' },
                        { symbol: '###', name: 'Header 3' }
                      ].map((header, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/30 p-2 rounded-lg border border-[var(--gunmetal-gray)]/20">
                          <span className="text-xs font-mono font-bold text-[var(--obsidian-black)] bg-white/50 px-3 py-1 rounded">
                            {header.symbol}
                          </span>
                          <span className="text-xs text-[var(--gunmetal-gray)] font-medium">
                            {header.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HTMLHeaderTextSplitter Parameters */}
                {chunkingStrategy === 'HTMLHeaderTextSplitter' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                      Headers to Split On
                    </label>
                    <div className="space-y-2">
                      {[
                        { tag: 'h1', name: 'Header 1' },
                        { tag: 'h2', name: 'Header 2' },
                        { tag: 'p', name: 'Paragraph' }
                      ].map((header, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/30 p-2 rounded-lg border border-[var(--gunmetal-gray)]/20">
                          <span className="text-xs font-mono font-bold text-[var(--obsidian-black)] bg-white/50 px-3 py-1 rounded">
                            {header.tag}
                          </span>
                          <span className="text-xs text-[var(--gunmetal-gray)] font-medium">
                            {header.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowSplitParamsModal(false)}
                className="px-6 py-2 bg-[var(--brushed-bronze)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Parameters Modal */}
      {showParamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--obsidian-black)]/60 backdrop-blur-sm"
            onClick={() => setShowParamsModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[var(--obsidian-black)]">
                Parámetros Adicionales
              </h3>
              <p className="text-xs text-[var(--gunmetal-gray)] mt-1">
                Ajusta los parámetros del modelo de lenguaje
              </p>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[var(--gunmetal-gray)] uppercase tracking-widest">
                      Temperature
                    </label>
                    <span className="text-sm font-bold text-[var(--obsidian-black)] bg-gray-100 px-3 py-1 rounded-lg">
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--brushed-bronze)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--gunmetal-gray)]">
                    <span>Preciso (0.0)</span>
                    <span>Creativo (2.0)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowParamsModal(false)}
                className="px-6 py-2 bg-[var(--brushed-bronze)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

