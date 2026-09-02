import React, { useState } from 'react';
import {
  ArchitectureCanvasState,
  ArchitectureNode,
  ArchitectureEdge,
} from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  X,
  Server,
  Database,
  HardDrive,
  Cpu,
  Globe,
  Radio,
  ArrowRight,
  Maximize2,
  Minimize2,
  Sliders,
  Move,
  Link,
  Shield,
  HelpCircle,
  FileCode,
} from 'lucide-react';

interface SystemDesignWhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiagram?: ArchitectureCanvasState;
  onSyncDiagram: (diagram: ArchitectureCanvasState) => void;
}

const COMPONENT_PRESETS: Array<{
  type: ArchitectureNode['type'];
  label: string;
  technology: string;
  defaultSpecs: string;
  icon: any;
  colorClass: string;
}> = [
  {
    type: 'client',
    label: 'Client (Web / Mobile)',
    technology: 'Next.js / iOS / Android',
    defaultSpecs: '100M+ DAU, WebSocket + HTTPS',
    icon: Globe,
    colorClass: 'from-blue-600 to-cyan-600',
  },
  {
    type: 'gateway',
    label: 'API Gateway / Edge LB',
    technology: 'Envoy / Kong / Cloudflare',
    defaultSpecs: 'SSL Term, Rate-Limiting, Auth',
    icon: Radio,
    colorClass: 'from-purple-600 to-indigo-600',
  },
  {
    type: 'service',
    label: 'Microservice / Backend',
    technology: 'Golang / Node.js Cluster',
    defaultSpecs: 'Stateless, Auto-scaled, p99 < 20ms',
    icon: Server,
    colorClass: 'from-indigo-600 to-violet-600',
  },
  {
    type: 'cache',
    label: 'In-Memory Cache',
    technology: 'Redis Cluster / Memcached',
    defaultSpecs: 'LRU Eviction, 95%+ Hit Ratio',
    icon: Zap,
    colorClass: 'from-amber-600 to-orange-600',
  },
  {
    type: 'queue',
    label: 'Message Queue / Event Stream',
    technology: 'Apache Kafka / RabbitMQ',
    defaultSpecs: 'Partitioned by Key, Idempotent',
    icon: Layers,
    colorClass: 'from-emerald-600 to-teal-600',
  },
  {
    type: 'database',
    label: 'Relational DB (Master-Replica)',
    technology: 'PostgreSQL / MySQL + Citus',
    defaultSpecs: 'ACID, WAL, Read Replicas',
    icon: Database,
    colorClass: 'from-blue-700 to-indigo-800',
  },
  {
    type: 'storage',
    label: 'NoSQL / Object Store',
    technology: 'Cassandra / DynamoDB / S3',
    defaultSpecs: 'Consistent Hashing Ring, 99.999%',
    icon: HardDrive,
    colorClass: 'from-rose-600 to-pink-600',
  },
  {
    type: 'worker',
    label: 'Async Worker / Cron',
    technology: 'Temporal / Celery Workers',
    defaultSpecs: 'Dead-Letter Queue, Retry Policy',
    icon: Cpu,
    colorClass: 'from-slate-600 to-slate-700',
  },
];

const ARCHITECTURE_TEMPLATES: Record<string, { title: string; desc: string; state: ArchitectureCanvasState }> = {
  streaming: {
    title: 'Global Video Streaming (Netflix Scale)',
    desc: 'CDN caching, Transcoding workers, NoSQL metadata, and S3 video chunk storage.',
    state: {
      nodes: [
        { id: 'n1', type: 'client', label: 'Client Apps (Smart TVs, Mobile)', technology: 'React / iOS / Android', x: 50, y: 150, specs: 'Adaptive Bitrate HLS' },
        { id: 'n2', type: 'gateway', label: 'Cloudflare CDN & Edge LB', technology: 'Cloudflare CDN', x: 260, y: 150, specs: 'Cache Hit 98% for Video Segments' },
        { id: 'n3', type: 'service', label: 'Video Catalog & Auth API', technology: 'Golang Microservices', x: 480, y: 80, specs: '100k QPS, Stateless' },
        { id: 'n4', type: 'cache', label: 'Metadata & Recommendation Cache', technology: 'Redis Cluster', x: 480, y: 220, specs: 'p99 < 5ms Latency' },
        { id: 'n5', type: 'queue', label: 'Ingestion & Telemetry Stream', technology: 'Apache Kafka', x: 700, y: 80, specs: 'Partitioned by User ID' },
        { id: 'n6', type: 'worker', label: 'Transcoding & Encoding Cluster', technology: 'GPU Workers / FFmpeg', x: 700, y: 220, specs: '1080p, 4K HDR Chunking' },
        { id: 'n7', type: 'storage', label: 'Distributed Video Chunk Store', technology: 'AWS S3 + Multi-Region', x: 920, y: 150, specs: 'Immutable HLS Blobs' },
      ],
      edges: [
        { id: 'e1', from: 'Client Apps (Smart TVs, Mobile)', to: 'Cloudflare CDN & Edge LB', protocol: 'HTTPS', label: 'Video Stream Requests' },
        { id: 'e2', from: 'Cloudflare CDN & Edge LB', to: 'Video Catalog & Auth API', protocol: 'HTTPS', label: 'Catalog / Auth' },
        { id: 'e3', from: 'Video Catalog & Auth API', to: 'Metadata & Recommendation Cache', protocol: 'TCP', label: 'Lookup' },
        { id: 'e4', from: 'Video Catalog & Auth API', to: 'Ingestion & Telemetry Stream', protocol: 'Kafka', label: 'Playback Events' },
        { id: 'e5', from: 'Ingestion & Telemetry Stream', to: 'Transcoding & Encoding Cluster', protocol: 'Kafka', label: 'Encode Jobs' },
        { id: 'e6', from: 'Transcoding & Encoding Cluster', to: 'Distributed Video Chunk Store', protocol: 'HTTPS', label: 'Upload Chunks' },
      ],
      diagramSummary: 'Global low-latency video streaming architecture with CDN caching, asynchronous GPU transcoding pipeline, and partitioned metadata storage.',
    },
  },
  collaborative: {
    title: 'Real-Time Collaborative Canvas (Figma / Google Docs)',
    desc: 'WebSocket Gateway, CRDT synchronization, Redis Pub/Sub, and Snapshot persistence.',
    state: {
      nodes: [
        { id: 'n1', type: 'client', label: 'Browser Clients', technology: 'WebAssembly + WebSockets', x: 60, y: 150, specs: 'Local Optimistic CRDT' },
        { id: 'n2', type: 'gateway', label: 'WebSocket Connection Gateway', technology: 'Envoy / Custom Rust Gateway', x: 280, y: 150, specs: '500k Persistent WS Conns' },
        { id: 'n3', type: 'service', label: 'Document Coordination Engine', technology: 'Node.js / Rust OT Workers', x: 500, y: 150, specs: 'CRDT Operation Resolution' },
        { id: 'n4', type: 'cache', label: 'Document Room State Pub/Sub', technology: 'Redis Cluster Pub/Sub', x: 720, y: 80, specs: 'Sub-10ms Room Broadcast' },
        { id: 'n5', type: 'database', label: 'Append-Only Operation Log & Snapshot DB', technology: 'PostgreSQL + S3 Snapshot', x: 720, y: 230, specs: 'Deterministic Replay Log' },
      ],
      edges: [
        { id: 'e1', from: 'Browser Clients', to: 'WebSocket Connection Gateway', protocol: 'WebSocket', label: 'CRDT Ops Delta' },
        { id: 'e2', from: 'WebSocket Connection Gateway', to: 'Document Coordination Engine', protocol: 'gRPC', label: 'Multiplexed Conns' },
        { id: 'e3', from: 'Document Coordination Engine', to: 'Document Room State Pub/Sub', protocol: 'TCP', label: 'Room Broadcast' },
        { id: 'e4', from: 'Document Coordination Engine', to: 'Append-Only Operation Log & Snapshot DB', protocol: 'SQL', label: 'Periodic Snapshot' },
      ],
      diagramSummary: 'Real-time collaborative editing architecture utilizing WebSockets, optimistic CRDT operations, Redis Pub/Sub for room broadcasting, and append-only database snapshots.',
    },
  },
  ecommerce: {
    title: 'High-Throughput Flash-Sale (Amazon Scale)',
    desc: 'Ingress Rate-Limiting, Distributed Locks, Kafka Inventory Reservation, and ACID Database.',
    state: {
      nodes: [
        { id: 'n1', type: 'client', label: 'Shoppers Mobile & Web', technology: 'React Native / Next.js', x: 50, y: 150, specs: '1M+ Concurrent Users' },
        { id: 'n2', type: 'gateway', label: 'Cloudflare WAF & Token Bucket Rate Limiter', technology: 'Cloudflare + Envoy', x: 260, y: 150, specs: 'Drop Bot Traffic & Spikes' },
        { id: 'n3', type: 'cache', label: 'Redis Stock Cache & Distributed Lock', technology: 'Redis (Redlock Algorithm)', x: 480, y: 80, specs: 'Atomic Stock Decrement' },
        { id: 'n4', type: 'queue', label: 'Order Processing Queue', technology: 'Apache Kafka', x: 480, y: 220, specs: 'Strict FIFO per Product SKU' },
        { id: 'n5', type: 'service', label: 'Order & Payment Fulfillment Service', technology: 'Java Spring Boot Cluster', x: 700, y: 220, specs: 'Idempotency Keys Enforced' },
        { id: 'n6', type: 'database', label: 'Primary Order & Ledger Database', technology: 'PostgreSQL Master + Read Replicas', x: 920, y: 220, specs: 'Serializable Transactions' },
      ],
      edges: [
        { id: 'e1', from: 'Shoppers Mobile & Web', to: 'Cloudflare WAF & Token Bucket Rate Limiter', protocol: 'HTTPS', label: 'Checkout Requests' },
        { id: 'e2', from: 'Cloudflare WAF & Token Bucket Rate Limiter', to: 'Redis Stock Cache & Distributed Lock', protocol: 'TCP', label: 'Atomic Stock Check' },
        { id: 'e3', from: 'Cloudflare WAF & Token Bucket Rate Limiter', to: 'Order Processing Queue', protocol: 'Kafka', label: 'Queue Order' },
        { id: 'e4', from: 'Order Processing Queue', to: 'Order & Payment Fulfillment Service', protocol: 'Kafka', label: 'Consume Async' },
        { id: 'e5', from: 'Order & Payment Fulfillment Service', to: 'Primary Order & Ledger Database', protocol: 'SQL', label: 'Commit Order' },
      ],
      diagramSummary: 'Resilient flash-sale system with token-bucket rate limiting, Redis atomic stock decrement locks, Kafka asynchronous queueing, and ACID ledger database.',
    },
  },
};

export const SystemDesignWhiteboardModal: React.FC<SystemDesignWhiteboardModalProps> = ({
  isOpen,
  onClose,
  currentDiagram,
  onSyncDiagram,
}) => {
  if (!isOpen) return null;

  const [nodes, setNodes] = useState<ArchitectureNode[]>(() => {
    if (currentDiagram?.nodes && currentDiagram.nodes.length > 0) return currentDiagram.nodes;
    return ARCHITECTURE_TEMPLATES.streaming.state.nodes;
  });

  const [edges, setEdges] = useState<ArchitectureEdge[]>(() => {
    if (currentDiagram?.edges && currentDiagram.edges.length > 0) return currentDiagram.edges;
    return ARCHITECTURE_TEMPLATES.streaming.state.edges;
  });

  const [notes, setNotes] = useState<string>(currentDiagram?.rawNotes || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<ArchitectureEdge['protocol']>('HTTPS');
  const [isSynced, setIsSynced] = useState<boolean>(Boolean(currentDiagram?.lastSyncedAt));

  const handleAddNode = (preset: typeof COMPONENT_PRESETS[0]) => {
    const newNode: ArchitectureNode = {
      id: `node-${Date.now()}`,
      type: preset.type,
      label: preset.label,
      technology: preset.technology,
      specs: preset.defaultSpecs,
      x: 100 + (nodes.length % 5) * 140,
      y: 80 + Math.floor(nodes.length / 5) * 120,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsSynced(false);
  };

  const handleNodeClick = (node: ArchitectureNode) => {
    if (connectSourceNodeId) {
      if (connectSourceNodeId !== node.id) {
        const sourceNode = nodes.find((n) => n.id === connectSourceNodeId);
        if (sourceNode) {
          const newEdge: ArchitectureEdge = {
            id: `edge-${Date.now()}`,
            from: sourceNode.label,
            to: node.label,
            protocol: selectedProtocol,
            label: selectedProtocol,
          };
          setEdges((prev) => [...prev, newEdge]);
          setIsSynced(false);
        }
      }
      setConnectSourceNodeId(null);
    } else {
      setSelectedNodeId(node.id);
    }
  };

  const handleDeleteNode = (id: string) => {
    const nodeToDelete = nodes.find((n) => n.id === id);
    if (!nodeToDelete) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== nodeToDelete.label && e.to !== nodeToDelete.label));
    if (selectedNodeId === id) setSelectedNodeId(null);
    setIsSynced(false);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setIsSynced(false);
  };

  const handleLoadTemplate = (key: string) => {
    const t = ARCHITECTURE_TEMPLATES[key];
    if (t) {
      setNodes(t.state.nodes);
      setEdges(t.state.edges);
      setNotes(t.state.diagramSummary || '');
      setSelectedNodeId(null);
      setConnectSourceNodeId(null);
      setIsSynced(false);
    }
  };

  const handleSyncWithPanel = () => {
    const diagramSummary =
      notes.trim() ||
      `Candidate system architecture comprising ${nodes.length} nodes (${nodes.map((n) => n.label).join(', ')}) connected via ${edges.length} communication protocols.`;

    const stateToSync: ArchitectureCanvasState = {
      nodes,
      edges,
      lastSyncedAt: Date.now(),
      diagramSummary,
      rawNotes: notes,
    };

    onSyncDiagram(stateToSync);
    setIsSynced(true);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[94vh] text-slate-200 animate-scale-up">
        {/* Whiteboard Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  🎨 Live System Design Whiteboard
                </span>
                {isSynced ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced with Interviewers
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Draft (Click "Sync Diagram" to share)
                  </span>
                )}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white">Interactive System Architecture Canvas</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncWithPanel}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
              title="Broadcast this architecture diagram into the AI Interviewers' shared context"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isSynced ? 'Re-Sync with Panel' : 'Sync Diagram with Panel'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Whiteboard Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Bar & Quick Presets */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter Blueprints:</span>
            {Object.entries(ARCHITECTURE_TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => handleLoadTemplate(key)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
              >
                {t.title.split('(')[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setIsSynced(false);
              }}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Canvas</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left / Center: Interactive SVG Grid Canvas */}
          <div className="flex-1 bg-slate-950 relative overflow-auto p-4 border-r border-slate-800 select-none">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Instruction Callout */}
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 shadow-md backdrop-blur-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Click a component block to edit specs, or click <strong>Connect Arrow</strong> to draw protocols.
              </span>
            </div>

            {/* Render Nodes */}
            <div className="relative w-[1100px] h-[550px]">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnectSource = connectSourceNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute w-52 p-3 rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-sm group ${
                      isConnectSource
                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/60 animate-pulse text-white'
                        : isSelected
                        ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 text-white shadow-indigo-500/20'
                        : 'bg-slate-900/90 hover:bg-slate-900 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {node.type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Delete component"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <h4 className="text-xs font-black truncate text-white">{node.label}</h4>
                    <p className="text-[11px] text-indigo-400 font-mono font-semibold truncate">{node.technology}</p>

                    {node.specs && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                        {node.specs}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Palette, Editor & Edge Table */}
          <div className="w-full lg:w-80 bg-slate-900/95 p-4 border-t lg:border-t-0 border-slate-800 flex flex-col gap-4 overflow-y-auto text-xs">
            {/* Add Components Palette */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Plus className="w-3 h-3 text-indigo-400" /> Add Architectural Block
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {COMPONENT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddNode(preset)}
                    className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <preset.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white truncate">{preset.label.split('(')[0]}</p>
                      <p className="text-[9px] text-slate-400 truncate">{preset.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Node Spec Editor */}
            {selectedNode ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    Edit Selected Component
                  </span>
                  <button
                    onClick={() => setConnectSourceNodeId(selectedNode.id)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" /> Connect Arrow
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400">Block Name:</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n)));
                      setIsSynced(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400">Technology Choice:</label>
                  <input
                    type="text"
                    value={selectedNode.technology}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, technology: val } : n)));
                      setIsSynced(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400">Throughput / SLAs / Specs:</label>
                  <input
                    type="text"
                    value={selectedNode.specs || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, specs: val } : n)));
                      setIsSynced(false);
                    }}
                    placeholder="e.g. 50k QPS, p99 < 15ms, WAL replica"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            ) : null}

            {/* Active Data Flow Connections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Connections ({edges.length})
                </span>
                <select
                  value={selectedProtocol}
                  onChange={(e) => setSelectedProtocol(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="HTTPS">HTTPS</option>
                  <option value="gRPC">gRPC</option>
                  <option value="Kafka">Kafka</option>
                  <option value="WebSocket">WebSocket</option>
                  <option value="SQL">SQL</option>
                </select>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {edges.map((edge) => (
                  <div
                    key={edge.id}
                    className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-semibold text-slate-300 truncate">{edge.from}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-300 truncate">{edge.to}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {edge.protocol}
                      </span>
                      <button
                        onClick={() => handleDeleteEdge(edge.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Architecture Notes for Interviewers */}
            <div className="space-y-1.5 mt-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Architecture Notes / Explanations:
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setIsSynced(false);
                }}
                rows={3}
                placeholder="Explain key trade-offs, consistency model (CAP), partition strategy, and disaster recovery..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
