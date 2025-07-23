import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { getLogger } from '../../src/utils/logger';
import { EncryptionManager } from '../../security/crypto/encryption';

export interface BackupConfig {
  backupDir: string;
  encryptionKey: string;
  compressionLevel?: number;
  retentionDays?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface BackupManifest {
  timestamp: string;
  version: string;
  files: string[];
  checksum: string;
  encrypted: boolean;
  size: number;
}

export class SecureBackupManager {
  private config: BackupConfig;
  private logger = getLogger();
  private encryptionManager: EncryptionManager;

  constructor(config: BackupConfig) {
    this.config = {
      compressionLevel: 9,
      retentionDays: 30,
      excludePatterns: [
        'node_modules',
        '.git',
        'logs',
        'temp',
        '*.tmp',
        '.env',
        'secrets',
      ],
      includePatterns: [
        'src/**/*',
        'core/**/*',
        'agents/**/*',
        'security/**/*',
        'middleware/**/*',
        'scripts/**/*',
        'package.json',
        'tsconfig.json',
        'system_manifest.json',
        'agent_registry.json',
        'guild_definitions.json',
        'DEPLOYMENT_READINESS.md',
      ],
      ...config,
    };

    this.encryptionManager = new EncryptionManager();
    this.ensureBackupDirectory();
    this.logger.info('Secure Backup Manager initialized', {
      backupDir: this.config.backupDir,
      retentionDays: this.config.retentionDays,
      compressionLevel: this.config.compressionLevel,
    });
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
      this.logger.info('Backup directory created', {
        path: this.config.backupDir,
      });
    }
  }

  /**
   * Create a secure backup
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `codessa-backup-${timestamp}`;
    const backupPath = path.join(this.config.backupDir, backupName);

    try {
      this.logger.info('Starting secure backup', {
        backupName,
        backupPath,
        timestamp,
      });

      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Collect files based on patterns
      const files = await this.collectFiles();
      this.logger.info('Files collected for backup', {
        fileCount: files.length,
      });

      // Create compressed archive
      const archivePath = await this.createArchive(files, backupPath);
      this.logger.info('Archive created', {
        archivePath,
        size: fs.statSync(archivePath).size,
      });

      // Encrypt the archive
      const encryptedPath = await this.encryptArchive(archivePath);
      this.logger.info('Archive encrypted', {
        encryptedPath,
        size: fs.statSync(encryptedPath).size,
      });

      // Clean up unencrypted archive
      fs.unlinkSync(archivePath);

      // Generate checksum
      const checksum = await this.generateChecksum(encryptedPath);

      // Create manifest
      const manifest: BackupManifest = {
        timestamp,
        version: '1.0.0-phase-v-active',
        files,
        checksum,
        encrypted: true,
        size: fs.statSync(encryptedPath).size,
      };

      // Save manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      this.logger.info('Backup completed successfully', {
        backupName,
        backupPath,
        fileCount: files.length,
        size: manifest.size,
        checksum,
      });

      return backupPath;
    } catch (error) {
      this.logger.error('Backup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        backupName,
        backupPath,
      });
      throw error;
    }
  }

  /**
   * Collect files based on include/exclude patterns
   */
  private async collectFiles(): Promise<string[]> {
    const files: string[] = [];

    // Use git to list tracked files if available
    try {
      const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
        .split('\n')
        .filter((file) => file.trim() !== '');

      for (const file of gitFiles) {
        if (this.shouldIncludeFile(file)) {
          files.push(file);
        }
      }
    } catch (error) {
      this.logger.warn('Git not available, using pattern matching', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to pattern matching
      this.collectFilesRecursive('.', files);
    }

    return files;
  }

  /**
   * Recursively collect files using pattern matching
   */
  private collectFilesRecursive(dir: string, files: string[]): void {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative('.', fullPath);

      if (fs.statSync(fullPath).isDirectory()) {
        if (this.shouldIncludeFile(relativePath)) {
          this.collectFilesRecursive(fullPath, files);
        }
      } else {
        if (this.shouldIncludeFile(relativePath)) {
          files.push(relativePath);
        }
      }
    }
  }

  /**
   * Check if file should be included based on patterns
   */
  private shouldIncludeFile(filePath: string): boolean {
    // Check exclude patterns
    for (const pattern of this.config.excludePatterns!) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of this.config.includePatterns!) {
      if (this.matchesPattern(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple pattern matching (supports * wildcards)
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]'),
    );
    return regex.test(filePath);
  }

  /**
   * Create compressed archive
   */
  private async createArchive(
    files: string[],
    backupPath: string,
  ): Promise<string> {
    const archivePath = path.join(backupPath, 'backup.tar.gz');

    // Create tar command
    const tarCommand = `tar -czf "${archivePath}" ${files.map((f) => `"${f}"`).join(' ')}`;

    try {
      execSync(tarCommand, { stdio: 'pipe' });
      return archivePath;
    } catch (error) {
      this.logger.error('Archive creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        command: tarCommand,
      });
      throw new Error('Archive creation failed');
    }
  }

  /**
   * Encrypt archive
   */
  private async encryptArchive(archivePath: string): Promise<string> {
    const encryptedPath = archivePath + '.enc';

    try {
      const data = fs.readFileSync(archivePath);
      const encrypted = this.encryptionManager.encrypt(
        data.toString('base64'),
        this.config.encryptionKey,
      );

      fs.writeFileSync(encryptedPath, JSON.stringify(encrypted));
      return encryptedPath;
    } catch (error) {
      this.logger.error('Archive encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        archivePath,
      });
      throw new Error('Archive encryption failed');
    }
  }

  /**
   * Generate checksum for file
   */
  private async generateChecksum(filePath: string): Promise<string> {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath: string, restoreDir: string): Promise<void> {
    try {
      this.logger.info('Starting backup restore', {
        backupPath,
        restoreDir,
      });

      // Read manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Backup manifest not found');
      }

      const manifest: BackupManifest = JSON.parse(
        fs.readFileSync(manifestPath, 'utf8'),
      );

      // Find encrypted archive
      const encryptedPath = path.join(backupPath, 'backup.tar.gz.enc');
      if (!fs.existsSync(encryptedPath)) {
        throw new Error('Encrypted archive not found');
      }

      // Verify checksum
      const checksum = await this.generateChecksum(encryptedPath);
      if (checksum !== manifest.checksum) {
        throw new Error('Checksum verification failed');
      }

      // Decrypt archive
      const decryptedPath = await this.decryptArchive(encryptedPath);

      // Extract archive
      await this.extractArchive(decryptedPath, restoreDir);

      // Clean up
      fs.unlinkSync(decryptedPath);

      this.logger.info('Backup restored successfully', {
        backupPath,
        restoreDir,
        fileCount: manifest.files.length,
        timestamp: manifest.timestamp,
      });
    } catch (error) {
      this.logger.error('Backup restore failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        backupPath,
        restoreDir,
      });
      throw error;
    }
  }

  /**
   * Decrypt archive
   */
  private async decryptArchive(encryptedPath: string): Promise<string> {
    const decryptedPath = encryptedPath.replace('.enc', '');

    try {
      const encryptedData = JSON.parse(fs.readFileSync(encryptedPath, 'utf8'));
      const decrypted = this.encryptionManager.decrypt(
        encryptedData,
        this.config.encryptionKey,
      );

      const data = Buffer.from(decrypted, 'base64');
      fs.writeFileSync(decryptedPath, data);

      return decryptedPath;
    } catch (error) {
      this.logger.error('Archive decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        encryptedPath,
      });
      throw new Error('Archive decryption failed');
    }
  }

  /**
   * Extract archive
   */
  private async extractArchive(
    archivePath: string,
    restoreDir: string,
  ): Promise<void> {
    // Ensure restore directory exists
    if (!fs.existsSync(restoreDir)) {
      fs.mkdirSync(restoreDir, { recursive: true });
    }

    const extractCommand = `tar -xzf "${archivePath}" -C "${restoreDir}"`;

    try {
      execSync(extractCommand, { stdio: 'pipe' });
    } catch (error) {
      this.logger.error('Archive extraction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        command: extractCommand,
      });
      throw new Error('Archive extraction failed');
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const backups = fs
        .readdirSync(this.config.backupDir)
        .filter((name) => name.startsWith('codessa-backup-'))
        .map((name) => {
          const fullPath = path.join(this.config.backupDir, name);
          const stats = fs.statSync(fullPath);
          return {
            name,
            path: fullPath,
            timestamp: stats.birthtime,
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays!);

      let deletedCount = 0;
      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          fs.rmSync(backup.path, { recursive: true, force: true });
          deletedCount++;
          this.logger.info('Old backup deleted', {
            name: backup.name,
            timestamp: backup.timestamp,
          });
        }
      }

      this.logger.info('Backup cleanup completed', {
        totalBackups: backups.length,
        deletedCount,
        retentionDays: this.config.retentionDays,
      });
    } catch (error) {
      this.logger.error('Backup cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List available backups
   */
  listBackups(): BackupManifest[] {
    const backups: BackupManifest[] = [];

    try {
      const backupDirs = fs
        .readdirSync(this.config.backupDir)
        .filter((name) => name.startsWith('codessa-backup-'));

      for (const dir of backupDirs) {
        const manifestPath = path.join(
          this.config.backupDir,
          dir,
          'manifest.json',
        );
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          backups.push(manifest);
        }
      }

      return backups.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } catch (error) {
      this.logger.error('Failed to list backups', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}
