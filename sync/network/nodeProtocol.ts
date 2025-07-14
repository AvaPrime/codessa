import { EventEmitter } from 'events';
import { NodeInfo, SyncResult, NetworkProtocol, Connection } from '../interfaces/syncTypes';

export interface ProtocolMessage {
  type: 'handshake' | 'sync' | 'heartbeat' | 'data' | 'error';
  payload: any;
  timestamp?: Date;
  messageId?: string;
}

export interface MockConnection {
  nodeId: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  latency: number;
  lastActivity: Date;
  isAlive: boolean;
}

export class NodeProtocol extends EventEmitter implements NetworkProtocol {
  private connections: Map<string, MockConnection>;
  private heartbeatInterval: number;
  private selfNodeInfo: NodeInfo;
  private messageHandlers: Map<string, (message: any, fromNode: string) => void>;

  constructor(selfNodeInfo: NodeInfo, heartbeatInterval: number = 30000) {
    super();
    this.selfNodeInfo = selfNodeInfo;
    this.connections = new Map();
    this.heartbeatInterval = heartbeatInterval;
    this.messageHandlers = new Map();

    // Start heartbeat monitoring
    setInterval(() => this.sendHeartbeats(), this.heartbeatInterval);
  }

  async connect(nodeId: string, endpoint: string): Promise<Connection> {
    console.log(`🔗 Connecting to node ${nodeId} at ${endpoint}`);
    
    const connection: MockConnection = {
      nodeId,
      endpoint,
      status: 'connecting',
      latency: Math.random() * 100 + 50, // 50-150ms simulated latency
      lastActivity: new Date(),
      isAlive: true
    };

    // Simulate connection process
    setTimeout(() => {
      connection.status = 'connected';
      this.connections.set(nodeId, connection);
      
      console.log(`✅ Connected to node ${nodeId}`);
      this.emit('node_connected', { nodeId, endpoint });
      
      // Send handshake
      this.sendHandshake(nodeId);
    }, 100);

    return {
      nodeId,
      endpoint,
      status: 'connected',
      latency: connection.latency,
      lastActivity: new Date(),
      send: async (message: any) => {
        await this.send(nodeId, message);
      },
      close: async () => {
        await this.disconnect(nodeId);
      }
    };
  }

  async disconnect(nodeId: string): Promise<void> {
    const connection = this.connections.get(nodeId);
    if (connection) {
      connection.status = 'disconnected';
      this.connections.delete(nodeId);
      
      console.log(`❌ Disconnected from node ${nodeId}`);
      this.emit('node_disconnected', { nodeId });
    }
  }

  async send(nodeId: string, message: any): Promise<void> {
    const connection = this.connections.get(nodeId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Node ${nodeId} is not connected`);
    }

    const protocolMessage: ProtocolMessage = {
      type: 'data',
      payload: message,
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Simulate network delay
    setTimeout(() => {
      connection.lastActivity = new Date();
      console.log(`📤 Sent message to ${nodeId}:`, protocolMessage.type);
      
      // Simulate message handling on remote node
      this.simulateRemoteMessageHandling(nodeId, protocolMessage);
    }, connection.latency);
  }

  async broadcast(message: any, excludeNodes?: string[]): Promise<void> {
    const targetNodes = Array.from(this.connections.keys())
      .filter(nodeId => !excludeNodes || !excludeNodes.includes(nodeId));

    console.log(`📡 Broadcasting message to ${targetNodes.length} nodes`);
    
    await Promise.all(
      targetNodes.map(nodeId => this.send(nodeId, message))
    );
  }

  onMessage(handler: (message: any, fromNode: string) => void): void {
    this.messageHandlers.set('default', handler);
  }

  onNodeConnected(handler: (nodeId: string) => void): void {
    this.on('node_connected', (event) => handler(event.nodeId));
  }

  onNodeDisconnected(handler: (nodeId: string) => void): void {
    this.on('node_disconnected', (event) => handler(event.nodeId));
  }

  // Node management methods

  getConnectedNodes(): string[] {
    return Array.from(this.connections.keys())
      .filter(nodeId => this.connections.get(nodeId)?.status === 'connected');
  }

  getNodeStatus(nodeId: string): 'connected' | 'disconnected' | 'connecting' | 'error' | 'unknown' {
    const connection = this.connections.get(nodeId);
    return connection ? connection.status : 'unknown';
  }

  getConnectionLatency(nodeId: string): number {
    const connection = this.connections.get(nodeId);
    return connection ? connection.latency : -1;
  }

  // Private methods

  private sendHandshake(nodeId: string): void {
    const handshakeMessage = {
      type: 'handshake',
      nodeId: this.selfNodeInfo.id,
      capabilities: this.selfNodeInfo.capabilities,
      timestamp: new Date()
    };
    
    this.send(nodeId, handshakeMessage).catch(error => {
      console.error(`Failed to send handshake to ${nodeId}:`, error);
    });
  }

  private sendHeartbeats(): void {
    const connectedNodes = this.getConnectedNodes();
    
    connectedNodes.forEach(nodeId => {
      const connection = this.connections.get(nodeId);
      if (!connection) return;

      // Check if node is still alive (simulated)
      const timeSinceLastActivity = Date.now() - connection.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.heartbeatInterval * 2) {
        console.warn(`⚠️ Node ${nodeId} seems unresponsive. Marking as degraded.`);
        connection.isAlive = false;
        // Could trigger reconnection logic here
      } else {
        // Send heartbeat
        this.send(nodeId, { type: 'heartbeat', timestamp: new Date() })
          .catch(error => {
            console.error(`Failed to send heartbeat to ${nodeId}:`, error);
          });
      }
    });
  }

  private simulateRemoteMessageHandling(nodeId: string, message: ProtocolMessage): void {
    // Simulate processing time
    setTimeout(() => {
      const handler = this.messageHandlers.get('default');
      if (handler) {
        handler(message.payload, nodeId);
      }
      
      // Emit specific events based on message type
      switch (message.type) {
        case 'handshake':
          this.emit('handshake_received', { nodeId, payload: message.payload });
          break;
        case 'sync':
          this.emit('sync_received', { nodeId, payload: message.payload });
          break;
        case 'heartbeat':
          this.emit('heartbeat_received', { nodeId, timestamp: message.timestamp });
          break;
      }
    }, 10); // Small processing delay
  }

  // Utility methods

  getNetworkStats(): any {
    const connections = Array.from(this.connections.values());
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const averageLatency = connections.reduce((sum, c) => sum + c.latency, 0) / connections.length;
    
    return {
      nodeId: this.selfNodeInfo.id,
      totalConnections: connections.length,
      connectedNodes: connectedCount,
      averageLatency: averageLatency || 0,
      lastHeartbeat: new Date()
    };
  }
}

