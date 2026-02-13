# Key Escrow Disaster Recovery Protocol

## Overview

This document outlines recovery procedures for the **Noctua Sentinel 3-of-5 Shamir Secret Sharing** key escrow system.

---

## Share Distribution

| Share | Location | Access |
|-------|----------|--------|
| 1 | IndexedDB (Device) | User's browser |
| 2 | IndexedDB (Device) | User's browser |
| 3 | IndexedDB (Device) | User's browser |
| 4 | Firestore (Cloud) | Encrypted backup |
| 5 | Firestore (Cloud) | Encrypted backup |

**Threshold**: 3 shares required to reconstruct

---

## Scenario A: Device Loss

**Trigger**: User loses laptop/phone, can't access local IndexedDB

### Recovery Steps

1. User logs into new device
2. System detects no local key
3. Retrieve 2 cloud shares from Firestore
4. Prompt user for backup share (paper backup, USB, etc.)
5. Reconstruct key with 2 cloud + 1 backup
6. Store new key in local IndexedDB
7. Generate new 5-share split for future

### Code

```typescript
const cloudShares = await CloudShareBackup.getCloudShares(clinicId, userId, db);
const backupShare = prompt('Enter your backup share code:');
const allShares = [...cloudShares, backupShare];
await KeyEscrowService.recoverFromShares(clinicId, allShares);
```

---

## Scenario B: Cloud Breach

**Trigger**: Firestore compromised, attacker has 2 shares

### Impact Assessment

- ✅ **Key remains secure** - 2 shares below threshold
- ⚠️ **Initiate key rotation** - Precautionary measure

### Response Steps

1. Alert security team
2. Rotate all affected keys via Admin panel
3. Re-encrypt existing clinical archives
4. Generate new share distribution
5. Revoke old Firestore shares

### Code

```typescript
const newKey = await KeyEscrowService.rotateKey(clinicId);
// Re-encrypt all existing records with new key
await reEncryptArchives(clinicId, oldKey, newKey);
```

---

## Scenario C: Local Corruption

**Trigger**: Browser data corrupted, partial share loss

### Recovery Steps

1. Attempt to read remaining local shares
2. Retrieve cloud shares
3. If total ≥ 3 shares → reconstruct
4. If total < 3 shares → escalate to admin

### Detection

```typescript
const localShares = await KeyVault.getShares(clinicId);
if (localShares.length + CLOUD_SHARE_COUNT >= 3) {
    // Recovery possible
} else {
    // Escalation required
}
```

---

## Scenario D: Private Browsing

**Trigger**: User in Incognito mode

### Behavior

- Keys stored in memory only
- Session ends → keys lost
- **No recovery possible** for that session

### Mitigation

- UI shows prominent warning banner
- Encourage switching to normal browsing
- Offer "export session" before close

---

## Key Rotation Schedule

| Event | Action |
|-------|--------|
| Quarterly | Optional rotation (recommended) |
| Personnel change | Mandatory rotation |
| Security incident | Immediate rotation |
| User request | On-demand via Admin UI |

---

## Audit Trail

All key operations are logged via `StateSigner`:

- `KEY_CREATED` - New key generated
- `KEY_ACCESS` - Key retrieved for use
- `KEY_ROTATED` - Key replaced
- `KEY_RECOVERED` - Reconstructed from shares
- `SHARES_EXPORTED` - Backup shares retrieved
- `CLOUD_BACKUP_CREATED` - Shares uploaded to Firestore

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Security Lead | [Clinic Admin] |
| Tech Support | support@vetnotes.pro |
| Incident Response | [On-call] |
