// Minimal scaffolding for statusManager module

export class StatusManager {
    private static statusMap: Map<string, string> = new Map();
    
    static setStatus(id: string, status: string) {
        this.statusMap.set(id, status);
        console.log(`Status updated: ${id} -> ${status}`);
    }
    
    static getStatus(id: string): string | undefined {
        return this.statusMap.get(id);
    }
    
    static clearStatus(id: string) {
        this.statusMap.delete(id);
        console.log(`Status cleared: ${id}`);
    }
}

export function updateDirectiveStatus(directiveId: string, status: string) {
    StatusManager.setStatus(directiveId, status);
}

export function checkDirectiveStatus(directiveId: string): string | undefined {
    return StatusManager.getStatus(directiveId);
}
