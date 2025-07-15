// Minimal scaffolding for diagnostics module

export interface SystemStats {
    timestamp: string;
    cpuUsage: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    activeProcesses: number;
}

export function collectSystemStats(): SystemStats {
    return {
        timestamp: new Date().toISOString(),
        cpuUsage: process.cpuUsage().system / 1000000, // Convert to seconds
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        activeProcesses: 1 // Simplified for now
    };
}

export function logDiagnostic(message: string, data?: any) {
    console.debug(`[DIAGNOSTIC] ${message}`, data);
}

export function getSystemHealth(): { status: string; stats: SystemStats } {
    const stats = collectSystemStats();
    const memoryUsagePercent = (stats.memoryUsage.heapUsed / stats.memoryUsage.heapTotal) * 100;
    
    let status = 'healthy';
    if (memoryUsagePercent > 80) {
        status = 'warning';
    }
    if (memoryUsagePercent > 95) {
        status = 'critical';
    }
    
    return { status, stats };
}
