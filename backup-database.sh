#!/bin/bash

# Farmforce Dashboard - Automated Backup Script
# Script untuk backup database PostgreSQL secara otomatis

# Configuration
BACKUP_DIR="/var/backups/farmforce"
DB_NAME="farmforce_db"
DB_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DAYS_TO_KEEP=7
LOG_FILE="/var/log/farmforce-backup.log"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log_message "Starting backup process..."

# Backup database
log_message "Backing up database: $DB_NAME"
sudo -u $DB_USER pg_dump $DB_NAME > $BACKUP_DIR/farmforce_$DATE.sql

if [ $? -eq 0 ]; then
    log_message "Database backup successful: farmforce_$DATE.sql"
    
    # Compress backup
    gzip $BACKUP_DIR/farmforce_$DATE.sql
    log_message "Backup compressed: farmforce_$DATE.sql.gz"
    
    # Get file size
    FILE_SIZE=$(du -h $BACKUP_DIR/farmforce_$DATE.sql.gz | cut -f1)
    log_message "Backup size: $FILE_SIZE"
    
    # Delete old backups
    log_message "Cleaning up old backups (older than $DAYS_TO_KEEP days)..."
    DELETED=$(find $BACKUP_DIR -name "*.sql.gz" -mtime +$DAYS_TO_KEEP -delete -print | wc -l)
    log_message "Deleted $DELETED old backup(s)"
    
    # List current backups
    TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)
    log_message "Total backups: $TOTAL_BACKUPS"
    
    log_message "Backup completed successfully!"
else
    log_message "ERROR: Database backup failed!"
    exit 1
fi

# Optional: Send backup to remote storage (uncomment if needed)
# Example with rsync to remote server:
# rsync -avz $BACKUP_DIR/farmforce_$DATE.sql.gz user@remote-server:/path/to/backup/

# Example with AWS S3 (requires aws-cli):
# aws s3 cp $BACKUP_DIR/farmforce_$DATE.sql.gz s3://your-bucket/farmforce-backups/

log_message "========================================="
