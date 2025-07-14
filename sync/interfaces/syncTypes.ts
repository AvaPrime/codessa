export interface NodeInfo {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[];
  lastSeen: Date;
  status: 'online' | 'offline' | 'degraded' | 'syncing';
  latency: number;
  version: string;
  region?: string;
  resources: NodeResources;
}

export interface NodeResources {
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
  activeConnections: number;
  maxConnections: number;
}

export interface SyncState {
  nodeId: string;
  timestamp: Date;
  version: number;
  checksum: string;
  data: Record<string, any>;
  deltaFrom?: string;
  compressionType?: 'none' | 'gzip' | 'lz4';
}

export interface SyncDelta {
  id: string;
  fromVersion: number;
  toVersion: number;
  operations: SyncOperation[];
  timestamp: Date;
  nodeId: string;
}

export interface SyncOperation {
  type: 'create' | 'update' | 'delete' | 'merge';
  path: string;
  value?: any;
  previousValue?: any;
  timestamp: Date;
  nodeId: string;
}

export interface SyncConflict {
  id: string;
  path: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  localNodeId: string;
  remoteNodeId: string;
  resolutionStrategy: 'last_write_wins' | 'merge' | 'manual' | 'version_vector';
}

export interface SyncResult {
  success: boolean;
  nodeId: string;
  syncId: string;
  operationsApplied: number;
  conflictsResolved: number;
  latency: number;
  timestamp: Date;
  error?: string;
}

export interface MemorySegment {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: any;
  timestamp: Date;
  nodeId: string;
  version: number;
  dependencies: string[];
  checksum: string;
}

export interface MemorySyncRequest {
  id: string;
  requestingNodeId: string;
  targetNodeId: string;
  segmentIds: string[];
  sinceVersion?: number;
  maxSegments?: number;
  timestamp: Date;
}

export interface MemorySyncResponse {
  id: string;
  requestId: string;
  segments: MemorySegment[];
  hasMore: boolean;
  totalSegments: number;
  timestamp: Date;
  nodeId: string;
}

export interface ClusterMap {
  nodes: Map<string, NodeInfo>;
  connections: Map<string, Set<string>>;
  partitions: Set<Set<string>>;
  quorumSize: number;
  masterNode?: string;
  timestamp: Date;
}

export interface SyncEngine {
  startSync(): Promise<void>;
  stopSync(): Promise<void>;
  syncWithNode(nodeId: string): Promise<SyncResult>;
  handleIncomingSync(request: SyncRequest): Promise<SyncResponse>;
  resolveConflict(conflict: SyncConflict): Promise<any>;
  getNodeStatus(nodeId: string): Promise<NodeInfo | null>;
  registerNode(node: NodeInfo): Promise<boolean>;
  unregisterNode(nodeId: string): Promise<boolean>;
  detectPartitions(): Promise<Set<Set<string>>>;
  recoverFromPartition(partition: Set<string>): Promise<boolean>;
}

export interface SyncRequest {
  id: string;
  type: 'full' | 'incremental' | 'heartbeat' | 'recovery';
  sourceNodeId: string;
  targetNodeId: string;
  sinceVersion?: number;
  maxOperations?: number;
  timestamp: Date;
}

export interface SyncResponse {
  id: string;
  requestId: string;
  type: 'success' | 'partial' | 'conflict' | 'error';
  operations: SyncOperation[];
  conflicts: SyncConflict[];
  nextVersion: number;
  hasMore: boolean;
  timestamp: Date;
  nodeId: string;
}

export interface SyncConfig {
  syncInterval: number;
  heartbeatInterval: number;
  maxRetries: number;
  timeout: number;
  compressionEnabled: boolean;
  conflictResolutionStrategy: 'last_write_wins' | 'merge' | 'manual';
  maxOperationsPerSync: number;
  enableDeltaSync: boolean;
  partitionDetectionEnabled: boolean;
  quorumSize: number;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageLatency: number;
  conflictsResolved: number;
  partitionsDetected: number;
  bytesTransferred: number;
  compressionRatio: number;
  nodeUptime: Record<string, number>;
}

export interface NetworkProtocol {
  connect(nodeId: string, endpoint: string): Promise<Connection>;
  disconnect(nodeId: string): Promise<void>;
  send(nodeId: string, message: any): Promise<void>;
  broadcast(message: any, excludeNodes?: string[]): Promise<void>;
  onMessage(handler: (message: any, fromNode: string) => void): void;
  onNodeConnected(handler: (nodeId: string) => void): void;
  onNodeDisconnected(handler: (nodeId: string) => void): void;
}

export interface Connection {
  nodeId: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  latency: number;
  lastActivity: Date;
  send(message: any): Promise<void>;
  close(): Promise<void>;
}

export interface FederationConfig {
  nodeId: string;
  nodeName: string;
  endpoint: string;
  capabilities: string[];
  region: string;
  bootstrapNodes: string[];
  maxConnections: number;
  syncConfig: SyncConfig;
  securityConfig: SecurityConfig;
}

export interface SecurityConfig {
  enableEncryption: boolean;
  keyExchangeMethod: 'ecdh' | 'rsa' | 'none';
  allowedNodes: string[];
  trustedCertificates: string[];
  authenticationRequired: boolean;
  maxUnauthenticatedTime: number;
}

export interface SyncEvent {
  id: string;
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'conflict_detected' | 
        'node_connected' | 'node_disconnected' | 'partition_detected' | 'partition_recovered';
  nodeId: string;
  data: any;
  timestamp: Date;
}
