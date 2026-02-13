<script lang="ts">
    import { onMount } from "svelte";
    import {
        KeyEscrowService,
        DEFAULT_CLINIC_ID,
    } from "$lib/security/KeyEscrowService";
    import * as KeyVault from "$lib/security/KeyVaultIndexedDB";
    import { StorageMode } from "$lib/security/KeyVaultIndexedDB";

    // State
    let isLoading = true;
    let keyInfo: {
        exists: boolean;
        createdAt?: number;
        lastAccessedAt?: number;
        keyVersion?: number;
    } | null = null;
    let storageMode: StorageMode = StorageMode.EPHEMERAL;
    let shareCount = 0;
    let showConfirmRotation = false;
    let isRotating = false;
    let rotationSuccess = false;
    let error: string | null = null;

    // Props
    export let clinicId: string = DEFAULT_CLINIC_ID;

    onMount(async () => {
        await loadKeyStatus();
    });

    async function loadKeyStatus() {
        isLoading = true;
        error = null;

        try {
            // Request persistent storage
            storageMode = await KeyVault.requestPersistentStorage();

            // Get key info
            keyInfo = await KeyEscrowService.getKeyInfo(clinicId);

            // Get share count
            const shares = await KeyVault.getShares(clinicId);
            shareCount = shares.length;
        } catch (e) {
            error = (e as Error).message;
        } finally {
            isLoading = false;
        }
    }

    async function handleRotateKey() {
        if (!showConfirmRotation) {
            showConfirmRotation = true;
            return;
        }

        isRotating = true;
        error = null;
        rotationSuccess = false;

        try {
            await KeyEscrowService.rotateKey(clinicId);
            rotationSuccess = true;
            showConfirmRotation = false;
            await loadKeyStatus();
        } catch (e) {
            error = (e as Error).message;
        } finally {
            isRotating = false;
        }
    }

    function cancelRotation() {
        showConfirmRotation = false;
    }

    function formatDate(timestamp: number | undefined): string {
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleString();
    }

    function getStorageModeColor(mode: StorageMode): string {
        switch (mode) {
            case StorageMode.PERSISTENT:
                return "text-green-400";
            case StorageMode.EPHEMERAL:
                return "text-yellow-400";
            case StorageMode.SESSION_ONLY:
                return "text-orange-400";
            case StorageMode.UNAVAILABLE:
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    }

    function getStorageModeLabel(mode: StorageMode): string {
        switch (mode) {
            case StorageMode.PERSISTENT:
                return "Persistent (Protected)";
            case StorageMode.EPHEMERAL:
                return "Ephemeral (May be evicted)";
            case StorageMode.SESSION_ONLY:
                return "Session Only (Private Browsing)";
            case StorageMode.UNAVAILABLE:
                return "Unavailable";
            default:
                return "Unknown";
        }
    }
</script>

<div class="admin-key-panel">
    <header class="panel-header">
        <div class="header-content">
            <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                />
            </svg>
            <h2>Key Management</h2>
        </div>
        <span
            class="badge {storageMode === StorageMode.PERSISTENT
                ? 'badge-success'
                : 'badge-warning'}"
        >
            Noctua Sentinel
        </span>
    </header>

    {#if isLoading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading key status...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <p>⚠️ {error}</p>
            <button class="btn btn-ghost" on:click={loadKeyStatus}>Retry</button
            >
        </div>
    {:else}
        <div class="key-info-grid">
            <!-- Storage Mode -->
            <div class="info-card">
                <label>Storage Mode</label>
                <span class="value {getStorageModeColor(storageMode)}">
                    {getStorageModeLabel(storageMode)}
                </span>
            </div>

            <!-- Key Status -->
            <div class="info-card">
                <label>Master Key</label>
                <span
                    class="value {keyInfo?.exists
                        ? 'text-green-400'
                        : 'text-gray-500'}"
                >
                    {keyInfo?.exists ? "✓ Active" : "✗ Not Created"}
                </span>
            </div>

            <!-- Shares -->
            <div class="info-card">
                <label>Recovery Shares</label>
                <span class="value text-blue-400">
                    {shareCount}/5 (3 required)
                </span>
            </div>

            <!-- Created -->
            <div class="info-card">
                <label>Created</label>
                <span class="value text-white/60">
                    {formatDate(keyInfo?.createdAt)}
                </span>
            </div>

            <!-- Last Access -->
            <div class="info-card">
                <label>Last Accessed</label>
                <span class="value text-white/60">
                    {formatDate(keyInfo?.lastAccessedAt)}
                </span>
            </div>

            <!-- Version -->
            <div class="info-card">
                <label>Key Version</label>
                <span class="value text-white/60">
                    v{keyInfo?.keyVersion || 0}
                </span>
            </div>
        </div>

        <!-- Rotation Controls -->
        <div class="rotation-section">
            {#if rotationSuccess}
                <div class="success-banner">
                    ✓ Key rotated successfully. New shares generated.
                </div>
            {/if}

            {#if showConfirmRotation}
                <div class="confirm-dialog">
                    <p class="warning-text">
                        ⚠️ <strong>Warning:</strong> Rotating the key will invalidate
                        all existing encrypted data. Make sure you have decrypted
                        all archives before proceeding.
                    </p>
                    <div class="dialog-actions">
                        <button
                            class="btn btn-danger"
                            on:click={handleRotateKey}
                            disabled={isRotating}
                        >
                            {#if isRotating}
                                <span class="spinner-sm"></span>
                                Rotating...
                            {:else}
                                Confirm Rotation
                            {/if}
                        </button>
                        <button
                            class="btn btn-ghost"
                            on:click={cancelRotation}
                            disabled={isRotating}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <button
                    class="btn btn-primary"
                    on:click={handleRotateKey}
                    disabled={!keyInfo?.exists}
                >
                    🔄 Rotate Master Key
                </button>
            {/if}
        </div>

        <!-- Security Notice -->
        {#if storageMode === StorageMode.SESSION_ONLY}
            <div class="security-notice warning">
                <svg
                    class="icon-sm"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                <p>
                    <strong>Private Browsing Detected:</strong> Keys are stored in
                    memory only and will be lost when you close the browser. Switch
                    to a normal browsing session for persistent key storage.
                </p>
            </div>
        {:else if storageMode === StorageMode.EPHEMERAL}
            <div class="security-notice info">
                <svg
                    class="icon-sm"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4m0-4h.01" />
                </svg>
                <p>
                    Browser did not grant persistent storage. Keys may be
                    evicted under disk pressure. Consider enabling cloud backup
                    for recovery.
                </p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .admin-key-panel {
        background: linear-gradient(
            135deg,
            rgba(30, 41, 59, 0.9),
            rgba(15, 23, 42, 0.95)
        );
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
        max-width: 600px;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-content h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: white;
        margin: 0;
    }

    .icon {
        width: 24px;
        height: 24px;
        color: #60a5fa;
    }

    .icon-sm {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .badge {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
    }

    .badge-success {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
    }

    .badge-warning {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
    }

    .loading-state,
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 1rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #60a5fa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 0.5rem;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .key-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .info-card {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
        padding: 0.75rem;
    }

    .info-card label {
        display: block;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 0.25rem;
    }

    .info-card .value {
        font-size: 0.875rem;
        font-weight: 500;
    }

    .rotation-section {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .success-banner {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #22c55e;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }

    .confirm-dialog {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.75rem;
        padding: 1rem;
    }

    .warning-text {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .dialog-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .btn-danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    .btn-ghost {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-ghost:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
    }

    .security-notice {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    .security-notice p {
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
    }

    .security-notice.warning {
        background: rgba(234, 179, 8, 0.1);
        border: 1px solid rgba(234, 179, 8, 0.3);
    }

    .security-notice.warning .icon-sm {
        color: #eab308;
    }

    .security-notice.info {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .security-notice.info .icon-sm {
        color: #3b82f6;
    }

    .text-green-400 {
        color: #4ade80;
    }
    .text-yellow-400 {
        color: #facc15;
    }
    .text-orange-400 {
        color: #fb923c;
    }
    .text-red-400 {
        color: #f87171;
    }
    .text-blue-400 {
        color: #60a5fa;
    }
    .text-gray-400 {
        color: #9ca3af;
    }
    .text-gray-500 {
        color: #6b7280;
    }
</style>
