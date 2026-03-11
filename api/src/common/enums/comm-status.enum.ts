export enum CommStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum CommDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}
