import { EventEmitter } from 'events';
import { 
  MemorySegment, 
  MemorySyncRequest, 
  MemorySyncResponse, 
  SyncResult, 
  SyncConflict,
  SyncOperation,
  NodeInfo 
} from '../interfaces/syncTypes';

export interface MemoryGraph {
  id: string;
  nodeId: string;
  segments: Map<string, MemorySegment>;
  version: number;
  lastModified: Date;
  checksum: string;
}

export interface MemoryDelta {
  id: string;
  fromVersion: number;
  toVersion: number;
  operations: MemoryOperation[];
  nodeId: string;
  timestamp: Date;
}

export interface MemoryOperation {
  type: 'create' | 'update' | 'delete' | 'merge';
  segmentId: string;
  segment?: MemorySegment;
  previousSegment?: MemorySegment;
  timestamp: Date;
  nodeId: string;
}

export interface ConflictResolutionLog {
  id: string;
  nodeId: string;
  conflicts: MemoryConflict[];
  resolved: number;
  failed: number;
  timestamp: Date;
}

export interface MemoryConflict {
  segmentId: string;
  localSegment: MemorySegment;
  remoteSegment: MemorySegment;
  resolutionStrategy: 'timestamp' | 'version_vector' | 'merge_content' | 'manual';
  resolved: boolean;
  resolution?: MemorySegment;
}

export class MemorySyncManager extends EventEmitter {
  private localGraph: MemoryGraph;
  private remoteGraphs: Map<string, MemoryGraph>;
  private syncHistory: Map<string, MemorySyncResponse>;
  private conflictLog: ConflictResolutionLog[];
  private nodeId: string;

  constructor(nodeId: string) {
    super();
    this.nodeId = nodeId;
    this.localGraph = {
      id: `graph_${nodeId}`,
      nodeId,
      segments: new Map(),
      version: 1,
      lastModified: new Date(),
      checksum: this.calculateChecksum(new Map())
    };
    this.remoteGraphs = new Map();
    this.syncHistory = new Map();
    this.conflictLog = [];
  }

  /**
   * Synchronize memory graph with remote node
   */
  async syncMemoryGraph(remoteGraph: MemoryGraph): Promise<SyncResult> {
    const startTime = Date.now();
    const syncId = `memory_sync_${this.nodeId}_${remoteGraph.nodeId}_${Date.now()}`;
    
    console.log(`🧠 Starting memory sync with ${remoteGraph.nodeId}`);
    console.log(`   Local version: ${this.localGraph.version}, Remote version: ${remoteGraph.version}`);

    try {
      // Store remote graph
      this.remoteGraphs.set(remoteGraph.nodeId, remoteGraph);

      // Generate delta operations
      const delta = this.generateMemoryDelta(this.localGraph, remoteGraph);
      
      // Apply operations with conflict detection
      const conflicts = await this.applyMemoryDelta(delta);
      
      // Resolve conflicts
      const resolutionLog = await this.resolveConflicts(remoteGraph.nodeId);
      
      // Update local graph version
      this.localGraph.version = Math.max(this.localGraph.version, remoteGraph.version) + 1;
      this.localGraph.lastModified = new Date();
      this.localGraph.checksum = this.calculateChecksum(this.localGraph.segments);

      const endTime = Date.now();
      
      console.log(`✅ Memory sync completed with ${remoteGraph.nodeId}`);
      console.log(`   Operations applied: ${delta.operations.length}`);
      console.log(`   Conflicts resolved: ${resolutionLog.resolved}`);
      console.log(`   New local version: ${this.localGraph.version}`);

      this.emit('memory_sync_completed', {
        nodeId: remoteGraph.nodeId,
        syncId,
        operationsApplied: delta.operations.length,
        conflictsResolved: resolutionLog.resolved,
        latency: endTime - startTime
      });

      return {
        success: true,
        nodeId: remoteGraph.nodeId,
        syncId,
        operationsApplied: delta.operations.length,
        conflictsResolved: resolutionLog.resolved,
        latency: endTime - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`❌ Memory sync failed with ${remoteGraph.nodeId}:`, error);
      
      return {
        success: false,
        nodeId: remoteGraph.nodeId,
        syncId,
        operationsApplied: 0,
        conflictsResolved: 0,
        latency: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve conflicts for a specific node
   */
  async resolveConflicts(remoteNodeId: string): Promise<ConflictResolutionLog> {
    const conflicts = this.detectConflicts(remoteNodeId);
    const logId = `conflict_resolution_${this.nodeId}_${remoteNodeId}_${Date.now()}`;
    
    let resolved = 0;
    let failed = 0;

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveMemoryConflict(conflict);
        if (resolution) {
          // Apply resolution to local graph
          this.localGraph.segments.set(conflict.segmentId, resolution);
          conflict.resolved = true;
          conflict.resolution = resolution;
          resolved++;
        }
      } catch (error) {
        console.error(`Failed to resolve conflict for segment ${conflict.segmentId}:`, error);
        failed++;
      }
    }

    const resolutionLog: ConflictResolutionLog = {
      id: logId,
      nodeId: this.nodeId,
      conflicts,
      resolved,
      failed,
      timestamp: new Date()
    };

    this.conflictLog.push(resolutionLog);
    
    return resolutionLog;
  }

  /**
   * Pull remote delta from another node
   */
  async pullRemoteDelta(remoteNodeId: string, sinceVersion?: number): Promise<MemoryDelta> {
    const remoteGraph = this.remoteGraphs.get(remoteNodeId);
    if (!remoteGraph) {
      throw new Error(`Remote graph not found for node ${remoteNodeId}`);
    }

    const fromVersion = sinceVersion || this.localGraph.version;
    const operations: MemoryOperation[] = [];

    // Generate operations for segments that have changed
    for (const [segmentId, segment] of remoteGraph.segments) {
      if (segment.version > fromVersion) {
        operations.push({
          type: 'update',
          segmentId,
          segment,
          timestamp: segment.timestamp,
          nodeId: remoteNodeId
        });
      }
    }

    return {
      id: `delta_${this.nodeId}_${remoteNodeId}_${Date.now()}`,
      fromVersion,
      toVersion: remoteGraph.version,
      operations,
      nodeId: remoteNodeId,
      timestamp: new Date()
    };
  }

  /**
   * Add or update a memory segment
   */
  async addMemorySegment(segment: MemorySegment): Promise<boolean> {
    try {
      // Update segment version and node info
      segment.nodeId = this.nodeId;
      segment.version = this.localGraph.version + 1;
      segment.timestamp = new Date();
      segment.checksum = this.calculateSegmentChecksum(segment);

      // Add to local graph
      this.localGraph.segments.set(segment.id, segment);
      
      // Update graph metadata
      this.localGraph.version++;
      this.localGraph.lastModified = new Date();
      this.localGraph.checksum = this.calculateChecksum(this.localGraph.segments);

      console.log(`📝 Added memory segment ${segment.id} (${segment.type})`);
      
      this.emit('memory_segment_added', {
        segmentId: segment.id,
        type: segment.type,
        nodeId: this.nodeId,
        version: segment.version
      });

      return true;
    } catch (error) {
      console.error(`Failed to add memory segment ${segment.id}:`, error);
      return false;
    }
  }

  /**
   * Get memory segment by ID
   */
  getMemorySegment(segmentId: string): MemorySegment | undefined {
    return this.localGraph.segments.get(segmentId);
  }

  /**
   * Get all memory segments of a specific type
   */
  getSegmentsByType(type: MemorySegment['type']): MemorySegment[] {
    return Array.from(this.localGraph.segments.values())
      .filter(segment => segment.type === type);
  }

  /**
   * Get memory graph statistics
   */
  getMemoryStats(): any {
    const segments = Array.from(this.localGraph.segments.values());
    const typeDistribution = segments.reduce((acc, segment) => {
      acc[segment.type] = (acc[segment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      nodeId: this.nodeId,
      totalSegments: segments.length,
      version: this.localGraph.version,
      lastModified: this.localGraph.lastModified,
      typeDistribution,
      remoteGraphs: this.remoteGraphs.size,
      conflictsResolved: this.conflictLog.reduce((sum, log) => sum + log.resolved, 0)
    };
  }

  // Private helper methods

  private generateMemoryDelta(localGraph: MemoryGraph, remoteGraph: MemoryGraph): MemoryDelta {
    const operations: MemoryOperation[] = [];

    // Find segments that exist in remote but not local (creates)
    for (const [segmentId, remoteSegment] of remoteGraph.segments) {
      const localSegment = localGraph.segments.get(segmentId);
      
      if (!localSegment) {
        operations.push({
          type: 'create',
          segmentId,
          segment: remoteSegment,
          timestamp: remoteSegment.timestamp,
          nodeId: remoteGraph.nodeId
        });
      } else if (remoteSegment.version > localSegment.version) {
        operations.push({
          type: 'update',
          segmentId,
          segment: remoteSegment,
          previousSegment: localSegment,
          timestamp: remoteSegment.timestamp,
          nodeId: remoteGraph.nodeId
        });
      }
    }

    // Find segments that exist in local but not remote (potential deletes)
    for (const [segmentId, localSegment] of localGraph.segments) {
      if (!remoteGraph.segments.has(segmentId)) {
        operations.push({
          type: 'delete',
          segmentId,
          previousSegment: localSegment,
          timestamp: new Date(),
          nodeId: this.nodeId
        });
      }
    }

    return {
      id: `delta_${localGraph.nodeId}_${remoteGraph.nodeId}_${Date.now()}`,
      fromVersion: localGraph.version,
      toVersion: remoteGraph.version,
      operations,
      nodeId: remoteGraph.nodeId,
      timestamp: new Date()
    };
  }

  private async applyMemoryDelta(delta: MemoryDelta): Promise<MemoryConflict[]> {
    const conflicts: MemoryConflict[] = [];

    for (const operation of delta.operations) {
      try {
        switch (operation.type) {
          case 'create':
            if (operation.segment) {
              this.localGraph.segments.set(operation.segmentId, operation.segment);
            }
            break;
            
          case 'update':
            if (operation.segment) {
              const existingSegment = this.localGraph.segments.get(operation.segmentId);
              if (existingSegment && this.hasConflict(existingSegment, operation.segment)) {
                conflicts.push({
                  segmentId: operation.segmentId,
                  localSegment: existingSegment,
                  remoteSegment: operation.segment,
                  resolutionStrategy: 'timestamp',
                  resolved: false
                });
              } else {
                this.localGraph.segments.set(operation.segmentId, operation.segment);
              }
            }
            break;
            
          case 'delete':
            this.localGraph.segments.delete(operation.segmentId);
            break;
        }
      } catch (error) {
        console.error(`Failed to apply operation ${operation.type} for segment ${operation.segmentId}:`, error);
      }
    }

    return conflicts;
  }

  private detectConflicts(remoteNodeId: string): MemoryConflict[] {
    const conflicts: MemoryConflict[] = [];
    const remoteGraph = this.remoteGraphs.get(remoteNodeId);
    
    if (!remoteGraph) {
      return conflicts;
    }

    for (const [segmentId, localSegment] of this.localGraph.segments) {
      const remoteSegment = remoteGraph.segments.get(segmentId);
      
      if (remoteSegment && this.hasConflict(localSegment, remoteSegment)) {
        conflicts.push({
          segmentId,
          localSegment,
          remoteSegment,
          resolutionStrategy: 'timestamp',
          resolved: false
        });
      }
    }

    return conflicts;
  }

  private hasConflict(localSegment: MemorySegment, remoteSegment: MemorySegment): boolean {
    return localSegment.checksum !== remoteSegment.checksum &&
           localSegment.version !== remoteSegment.version;
  }

  private async resolveMemoryConflict(conflict: MemoryConflict): Promise<MemorySegment | null> {
    switch (conflict.resolutionStrategy) {
      case 'timestamp':
        return conflict.localSegment.timestamp > conflict.remoteSegment.timestamp
          ? conflict.localSegment
          : conflict.remoteSegment;
          
      case 'version_vector':
        return conflict.localSegment.version > conflict.remoteSegment.version
          ? conflict.localSegment
          : conflict.remoteSegment;
          
      case 'merge_content':
        return this.mergeSegments(conflict.localSegment, conflict.remoteSegment);
        
      case 'manual':
        // Emit event for manual resolution
        this.emit('manual_conflict_resolution_required', conflict);
        return null;
        
      default:
        return conflict.localSegment;
    }
  }

  private mergeSegments(local: MemorySegment, remote: MemorySegment): MemorySegment {
    // Simple merge strategy - combine content if possible
    const mergedContent = {
      ...local.content,
      ...remote.content
    };

    return {
      ...local,
      content: mergedContent,
      version: Math.max(local.version, remote.version) + 1,
      timestamp: new Date(),
      checksum: this.calculateSegmentChecksum({
        ...local,
        content: mergedContent
      })
    };
  }

  private calculateChecksum(segments: Map<string, MemorySegment>): string {
    const segmentData = Array.from(segments.values())
      .map(segment => `${segment.id}:${segment.version}:${segment.checksum}`)
      .sort()
      .join('|');
    
    return this.simpleHash(segmentData);
  }

  private calculateSegmentChecksum(segment: MemorySegment): string {
    const segmentData = `${segment.id}:${segment.type}:${JSON.stringify(segment.content)}:${segment.version}`;
    return this.simpleHash(segmentData);
  }

  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
