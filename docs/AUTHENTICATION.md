# Authentication & User Identity

This document describes the authentication system and user identity management in the Lite Adserver UI.

## Overview

The application uses API key-based authentication with proper validation. User identity (email, role, permissions) is now separated from tenant configuration.

## Architecture

### Components

1. **User Identity** (from `/api/me`):
   - `user_id`: Unique user identifier (may be null for legacy keys)
   - `email`: User email address (may be null for legacy keys)
   - `role`: User role (e.g., "owner", "admin", "affiliate", "advertiser") (may be null for legacy keys)
   - `permissions`: Array of permission strings (e.g., ["read", "write"])
   - `namespace`: Tenant namespace

2. **Tenant Settings** (from `/api/tenant`):
   - `company`: Company/brand name
   - `timezone`: Default timezone for the tenant
   - `primary_color`: Primary brand color (hex)
   - `secondary_color`: Secondary brand color (hex)

### Key Files

- `lib/services/user.ts`: User identity API service (`validateApiKey()`, `UserIdentity` type)
- `lib/user-identity-cache.ts`: In-memory cache for user identity
- `lib/use-user-identity.ts`: React hook for accessing user identity
- `components/auth-provider.tsx`: Authentication state management and validation
- `app/login/page.tsx`: Login page with API key validation

## Login Flow

```
1. User enters API key
   ↓
2. Login page calls auth.login(apiKey)
   ↓
3. AuthProvider sets API key in client
   ↓
4. AuthProvider calls validateApiKey() → GET /api/me
   ↓
5a. Success (200 OK):
    - Store API key in localStorage
    - Cache user identity
    - Set authenticated state
    - Redirect to /dashboard
   ↓
5b. Failure (401/400/network error):
    - Clear API client
    - Show error message
    - Keep user on login page
```

## Usage

### Access User Identity

```tsx
import { useUserIdentity } from '@/lib/use-user-identity';

function MyComponent() {
  const { email, role, permissions, userIdentity } = useUserIdentity();
  
  // Use email for display
  console.log('Current user:', email);
  
  // Check role
  if (role === 'owner') {
    // Show owner-only features
  }
  
  // Check permissions
  if (permissions.includes('write')) {
    // Allow write operations
  }
  
  return <div>Hello {email}</div>;
}
```

### Access Full Auth Context

```tsx
import { useAuth } from '@/components/auth-provider';

function MyComponent() {
  const { isAuthenticated, userIdentity, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome {userIdentity?.email}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
```

## API Key Validation

The `/api/me` endpoint validates the API key and returns user information:

**Request:**
```bash
GET /api/me
Headers:
  Authorization: Bearer <api-key>
  X-Namespace: <namespace>
```

**Success Response (200 OK):**
```json
{
  "namespace": "acme",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "owner",
  "permissions": ["read", "write"]
}
```

**Error Responses:**
- `400 Bad Request`: Missing Authorization or X-Namespace header
- `401 Unauthorized`: Invalid or expired API key, or key not authorized for namespace

**Legacy Keys:**
- Legacy API keys may have `user_id`, `email`, or `role` as `null`
- The UI should handle these gracefully

## Caching

### User Identity Cache
- Stored in memory (cleared on logout)
- Used to avoid re-validating on every mount
- Invalidated on logout or validation failure

### Tenant Settings Cache
- Stored in memory (cleared on logout)
- 5-minute TTL to reduce API calls
- Separate from user identity

## Security Considerations

1. **API Key Storage**: API keys are stored in localStorage (client-side only)
2. **Validation on Login**: Keys are validated via `/api/me` before being stored
3. **Validation on Mount**: Existing keys are re-validated on app mount
4. **Auto-Logout on Error**: 401/403 errors trigger automatic logout
5. **Namespace Security**: Namespace is derived from hostname and validated server-side

## Migration from Old System

### What Changed

**Before:**
- API key was stored without validation
- All requests would fail if key was invalid
- User email was stored in tenant settings
- No concept of roles or permissions

**After:**
- API key is validated on login via `/api/me`
- Invalid keys are rejected immediately
- User email/role/permissions are separate from tenant
- Ready for role-based access control (RBAC)

### Backward Compatibility

- Legacy keys with `null` user_id/email/role are supported
- Tenant settings API (`/api/tenant`) remains backward compatible
- Existing functionality continues to work unchanged
