#!/usr/bin/env node

import { SecureBackupManager } from './secureBackup';
import { EncryptionManager } from '../../security/crypto/encryption';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Usage: node backup-cli.js <command> [options]

Commands:
  create              Create a new backup
  restore <backup>    Restore from backup
  list                List available backups
  cleanup             Clean up old backups
  help                Show this help message

Examples:
  node backup-cli.js create
  node backup-cli.js restore codessa-backup-2025-07-17T10-30-00-000Z
  node backup-cli.js list
  node backup-cli.js cleanup
`);
    process.exit(1);
  }

  try {
    // Generate encryption key if not exists
    const keyPath = path.join(__dirname, '.backup-key');
    let encryptionKey: string;

    if (fs.existsSync(keyPath)) {
      encryptionKey = fs.readFileSync(keyPath, 'utf8').trim();
    } else {
      const encryptionManager = new EncryptionManager();
      encryptionKey = encryptionManager.generateKey();
      fs.writeFileSync(keyPath, encryptionKey);
      console.log('⚠️  New encryption key generated and saved to .backup-key');
      console.log("🔒 Keep this key safe - it's required to restore backups!");
    }

    const backupManager = new SecureBackupManager({
      backupDir: path.join(__dirname, '../../backups'),
      encryptionKey,
      retentionDays: 30,
    });

    switch (command) {
      case 'create':
        console.log('🚀 Creating secure backup...');
        const backupPath = await backupManager.createBackup();
        console.log(`✅ Backup created successfully: ${backupPath}`);
        break;

      case 'restore':
        const backupName = args[1];
        if (!backupName) {
          console.error('❌ Please specify backup name');
          process.exit(1);
        }

        const restoreDir = args[2] || './restored';
        const fullBackupPath = path.join(
          __dirname,
          '../../backups',
          backupName,
        );

        console.log(`🔄 Restoring backup: ${backupName}`);
        await backupManager.restoreBackup(fullBackupPath, restoreDir);
        console.log(`✅ Backup restored successfully to: ${restoreDir}`);
        break;

      case 'list':
        console.log('📋 Available backups:');
        const backups = backupManager.listBackups();
        if (backups.length === 0) {
          console.log('  No backups found');
        } else {
          backups.forEach((backup, index) => {
            const size = (backup.size / 1024 / 1024).toFixed(2);
            console.log(
              `  ${index + 1}. ${backup.timestamp} (${size} MB, ${backup.files.length} files)`,
            );
          });
        }
        break;

      case 'cleanup':
        console.log('🧹 Cleaning up old backups...');
        await backupManager.cleanupOldBackups();
        console.log('✅ Cleanup completed');
        break;

      case 'help':
        main();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(
      '❌ Error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
