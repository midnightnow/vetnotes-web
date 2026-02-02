/**
 * Request Queue Manager
 * Prevents race conditions and duplicate requests
 */

interface QueuedRequest {
    id: string;
    isSacred: boolean;
    timestamp: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

export class RequestQueue {
    private queue: QueuedRequest[] = [];
    private processing = false;
    private lastRequestId: string | null = null;
    private requestCache = new Map<string, any>();
    private cacheTimeout = 5000; // 5 seconds

    /**
     * Add request to queue with deduplication
     */
    async enqueue(isSacred: boolean): Promise<any> {
        const requestId = `${isSacred ? 'sacred' : 'normal'}-${Date.now()}`;

        // Check cache for recent identical request
        const cacheKey = isSacred ? 'sacred' : 'normal';
        const cached = this.requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Returning cached result for', cacheKey);
            return cached.data;
        }

        return new Promise((resolve, reject) => {
            this.queue.push({
                id: requestId,
                isSacred,
                timestamp: Date.now(),
                resolve,
                reject
            });

            this.processQueue();
        });
    }

    /**
     * Process queue sequentially
     */
    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const request = this.queue.shift()!;

            try {
                const result = await this.executeRequest(request);

                // Cache result
                const cacheKey = request.isSacred ? 'sacred' : 'normal';
                this.requestCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });

                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Execute individual request
     */
    private async executeRequest(request: QueuedRequest): Promise<any> {
        const maxRetries = 3;
        const timeoutMs = 5000;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const res = await fetch("/api/economy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isSacred: request.isSacred }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
                }

                const data = await res.json();

                if (!data.status) {
                    throw new Error("Invalid response: missing status field");
                }

                if (data.error) {
                    throw new Error(data.error);
                }

                return data;

            } catch (e) {
                attempt++;

                if (attempt < maxRetries) {
                    const backoffMs = 1000 * Math.pow(2, attempt - 1);
                    await new Promise((r) => setTimeout(r, backoffMs));
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.requestCache.clear();
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            cacheSize: this.requestCache.size
        };
    }
}
