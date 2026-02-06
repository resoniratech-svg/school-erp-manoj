# Incident Response & Operational Playbooks

## Severity Classification

| Level | Name | Examples | Response |
|-------|------|----------|----------|
| **P0** | Critical | Billing double-charge, data corruption, auth bypass | Immediate |
| **P1** | High | App unusable for many tenants | ≤ 30 min |
| **P2** | Medium | One module broken, degraded performance | ≤ 4 hrs |
| **P3** | Low | UI bug, report mismatch | Next business day |

> **Rule:** Only P0/P1 justify emergency actions.

---

## Universal First-Response Checklist

### 1. STOP
- ❌ Do NOT redeploy
- ❌ Do NOT run migrations
- ❌ Do NOT "try fixes"

### 2. IDENTIFY
- Is this **data**, **billing**, or **availability**?
- **One tenant** or **many**?

### 3. CONTAIN
```
system.maintenanceMode = true
jobs.enabled = false
```

### 4. PRESERVE
- ❌ Do NOT delete anything
- ❌ Do NOT modify financial records
- ✅ Logs > Fixes

---

## Kill Switch Playbooks

### 🔥 Platform Misbehaving
```
1. system.maintenanceMode = true
2. jobs.enabled = false
3. rate.limit.enabled = true
4. notification.*.enabled = false
```

### 💸 Billing / Payment Issue
```
1. jobs.enabled = false
2. DO NOT touch invoices/payments
3. Verify Razorpay dashboard
4. Contact support if refund needed
```

### 📩 Notification Storm
```
1. notification.email.enabled = false
2. notification.sms.enabled = false
3. notification.whatsapp.enabled = false
```

### 🧮 DB Load / Slow Queries
```
1. rate.limit.enabled = true
2. Reduce rate limits temporarily
3. jobs.enabled = false
```

---

## Financial Incident Rules (NON-NEGOTIABLE)

### ❌ NEVER
- Delete payments, invoices, credit notes
- "Fix" by editing DB rows directly
- Recalculate historical amounts

### ✅ ALLOWED
- Create credit note for correction
- Issue refund via Razorpay dashboard
- Add audit log entry

> **If unsure: do nothing. Data > Speed.**

---

## Customer Communication Templates

### P0/P1 Incident
```
We're currently experiencing a temporary issue affecting some features.
Your data and payments remain safe.
We've paused affected services while we resolve this and will update you shortly.
```

### Billing-Specific
```
We detected an issue in our billing workflow.
No action is required from your side.
Any incorrect charge will be automatically reversed or credited.
```

### Post-Resolution
```
The issue has been resolved.
We've taken steps to ensure this doesn't recur and appreciate your patience.
```

---

## Post-Incident Review Template

```markdown
# PIR: [Incident Title]
Date: YYYY-MM-DD

## Summary
- What happened:
- Duration:
- Tenants affected:

## Root Cause
- [ ] Code bug
- [ ] Config error
- [ ] External service
- [ ] Human error

## Resolution
- Fix applied:
- Kill switches used:

## Prevention
- Config change:
- Monitoring added:
- Documentation updated:
```

---

## Quick Reference Card

| Situation | First Action |
|-----------|--------------|
| Can't login | Check auth service, NOT database |
| Double charge | DO NOTHING, check Razorpay |
| Slow response | Enable stricter rate limits |
| Notification flood | Disable all notification.*.enabled |
| Unknown error | Enable maintenance mode |
