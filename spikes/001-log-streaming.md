# Spike: Reading Logs from AppDaemon Add-on

## Overview
Investigate the best approach for reading AppDaemon logs from within AppDaemon Studio add-on, balancing functionality with security (minimal permissions).

## Options Analysis

### Option 1: Supervisor API (Requires elevated permissions)
**Implementation:**
```typescript
const response = await fetch('http://supervisor/addons/core_appdaemon/logs', {
  headers: { 'Authorization': `Bearer ${SUPERVISOR_TOKEN}` },
});
```

**Required Permissions:**
- `hassio_api: true`
- `hassio_role: manager` or `admin`

**Pros:**
- Official API, reliable
- Real-time streaming support
- No file system access needed

**Cons:**
- Requires elevated permissions (manager/admin role)
- Adds security surface area
- May not work with all AppDaemon installations (slug varies)

### Option 2: Shared Volume Mapping (File-based)
**Implementation:**
Mount AppDaemon's log directory in `config.json`:
```json
"map": [
  "config:rw",
  "addon_config:rw"
]
```

Then read: `/config/appdaemon/logs/appdaemon.log`

**Pros:**
- No special API permissions needed
- Works offline
- Simple file reading

**Cons:**
- Requires AppDaemon to log to file (not stdout)
- Need to coordinate with AppDaemon add-on
- Log rotation handling needed
- Not real-time (polling required)

### Option 3: No Logs (Status Quo)
Simply remove log viewing feature from the IDE.

**Pros:**
- Zero additional permissions
- Reduced complexity
- Users can view logs via HA Supervisor UI

**Cons:**
- Less integrated experience
- Users need to switch contexts

## Recommendation

**DECISION: Option 3 - Remove log viewing feature for now**

Rationale:
1. **Security First**: Minimal permissions principle - don't request elevated access unless absolutely necessary
2. **Maintenance**: Log streaming adds complexity (WebSocket, reconnection, parsing)
3. **User Alternative**: Home Assistant already has excellent log viewing in Supervisor
4. **Focus**: Better to invest effort in code editing features (IntelliSense, autocomplete)

**Future Consideration:**
If users strongly request integrated logs, we can:
1. Re-evaluate with user feedback
2. Consider Option 2 (file-based) with documented AppDaemon configuration requirements
3. Or wait for Home Assistant to provide a read-only logs API

## Notes
- AppDaemon logs are available in HA Supervisor UI
- Users can SSH into host to view logs directly
- Log streaming was in v0.1.x but removed in v0.2.x migration

## Status
**CLOSED - Won't Implement (for now)**

If reopening:
1. Gather user feedback on log viewing importance
2. Test Option 2 with file-based approach
3. Document required AppDaemon configuration
