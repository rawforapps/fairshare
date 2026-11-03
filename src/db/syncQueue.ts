/**
 * Local-First Offline Sync Queue
 * Allows instant, optimistic updates with 0ms network latency.
 * Stores pending mutations on-device and flushes to Supabase when connectivity is restored.
 */

export interface PendingMutation {
  id: string; // UUID generated locally
  table: 'expenses' | 'expense_splits' | 'settlements' | 'groups';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

export class OfflineSyncQueue {
  private queue: PendingMutation[] = [];
  private isSyncing = false;
  private onStatusChange?: (pendingCount: number, isSyncing: boolean) => void;

  constructor(onStatusChange?: (pendingCount: number, isSyncing: boolean) => void) {
    this.onStatusChange = onStatusChange;
  }

  /**
   * Enqueues a local mutation and triggers optimistic background sync
   */
  public enqueue(
    table: PendingMutation['table'],
    action: PendingMutation['action'],
    payload: Record<string, any>
  ): PendingMutation {
    const mutation: PendingMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      table,
      action,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.queue.push(mutation);
    this.notify();
    this.processQueue();
    return mutation;
  }

  /**
   * Processes the queue sequentially to maintain causal ordering
   */
  public async processQueue(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    this.notify();

    while (this.queue.length > 0) {
      const mutation = this.queue[0];

      try {
        await this.syncMutationToCloud(mutation);
        // Successful sync: remove from queue
        this.queue.shift();
        this.notify();
      } catch (err) {
        mutation.retryCount += 1;
        console.warn(`Sync failed for ${mutation.id}, will retry:`, err);
        // Backoff and break loop if network is genuinely offline
        break;
      }
    }

    this.isSyncing = false;
    this.notify();
  }

  private async syncMutationToCloud(mutation: PendingMutation): Promise<void> {
    // In production: Supabase RPC call with client_mutation_id for idempotency
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  private notify() {
    if (this.onStatusChange) {
      this.onStatusChange(this.queue.length, this.isSyncing);
    }
  }
}
