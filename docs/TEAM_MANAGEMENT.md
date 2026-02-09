# Team Management

The Team page allows owners and managers to add and manage team members by creating API keys with specific roles and permissions.

## Features

### Access Control
- **Only accessible by:** Owners and Managers
- **Publishers and Advertisers** see an access denied message

### Team Member Management

#### View Team Members
- List all API keys (team members) for the current tenant
- Display:
  - Email address
  - Role (owner, manager, publisher, advertiser)
  - Permissions (read, write)
  - **API Key** - Click "Copy token" button to copy to clipboard
  - Created date (relative time)
  - Expiration date (if set)

#### Add Team Member
1. Click "Add Team Member" button
2. Fill in the form:
   - **Email** (required) - User's email address
   - **Role** (required) - Select from:
     - **Owner** - Full access to everything
     - **Manager** - Can manage team, settings, zones & campaigns
     - **Publisher** - Can manage zones
     - **Advertiser** - Can manage campaigns
   - **Permissions**:
     - **Read** - Always enabled (required for all users)
     - **Write** - Optional, allows creating and editing
3. Click "Create Team Member"
4. Team member is added to the list
5. **Copy the API key:** Click "Copy token" button in the table to copy their API key and share it with them

### Role Descriptions

| Role | Description | Typical Use Case |
|------|-------------|------------------|
| **Owner** | Full access to all features | Primary account holder |
| **Manager** | Can manage team, settings, zones & campaigns | Operations manager |
| **Publisher** | Can manage zones and view stats | Website owners with ad zones |
| **Advertiser** | Can manage campaigns and view stats | Advertisers running campaigns |

### Permissions

- **Read** (always enabled) - View data, required for all users
- **Write** (optional) - Create and edit campaigns, zones, etc.

## API Integration

### List Team Members (Users)
```typescript
import { listApiKeys } from '@/lib/services/api-keys';

// Get users (entities with email)
const teamMembers = await listApiKeys('user');

// Get machine API keys (entities without email)
const machineKeys = await listApiKeys('api-key');
```

### Add Team Member (User)
```typescript
import { createApiKey } from '@/lib/services/api-keys';

const newMember = await createApiKey({
  email: 'user@example.com',
  role: 'publisher',
  permissions: ['read', 'write']
});

// Show the generated API key to the user
console.log('API Key:', newMember.token);
```

### Add Machine API Key (No Email)
```typescript
import { createMachineApiKey } from '@/lib/services/api-keys';

const newKey = await createMachineApiKey({
  role: 'publisher',
  permissions: ['read', 'write']
});

console.log('Machine API Key:', newKey.token);
```

## Backend Endpoints

### List API Keys (Users)
```http
GET /api/api-keys?type=user
Authorization: Bearer <your-api-key>
X-Namespace: <your-namespace>
```

**Response:**
```json
[
  {
    "token": "test-uuidv4-123456",
    "namespace": "demo",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@demo.com",
    "role": "publisher",
    "created_at": 1714589060000,
    "expires_at": 1717181060000,
    "permissions": ["read", "write"]
  }
]
```

### List Machine API Keys
```http
GET /api/api-keys?type=api-key
Authorization: Bearer <your-api-key>
X-Namespace: <your-namespace>
```

**Response:** Same format but `email: null` for all items.

### Create User (API Key with Email)
```http
POST /api/api-keys?type=user
Authorization: Bearer <your-api-key>
X-Namespace: <your-namespace>
Content-Type: application/json

{
  "email": "newuser@demo.com",
  "role": "publisher",
  "permissions": ["read", "write"]
}
```

### Create Machine API Key (No Email)
```http
POST /api/api-keys?type=api-key
Authorization: Bearer <your-api-key>
X-Namespace: <your-namespace>
Content-Type: application/json

{
  "role": "publisher",
  "permissions": ["read", "write"]
}
```

**Response (both):**
```json
{
  "token": "generated-uuidv4-xyz",
  "namespace": "demo",
  "user_id": "generated-uuid",
  "email": "newuser@demo.com",  // or null for api-key type
  "role": "publisher",
  "created_at": 1714589060000,
  "permissions": ["read", "write"]
}
```

## User Experience

### For Owners/Managers

1. **Empty State:**
   - Shows "No team members yet" message
   - "Add Your First Team Member" button

2. **With Team Members:**
   - Table view with all team members
   - "Copy token" button for each user to copy their API key
   - Add button in top-right
   - Color-coded role badges

3. **Adding a Member:**
   - Dialog form opens
   - Fill in email and select role/permissions
   - Submit creates the user
   - Toast notification confirms creation
   - **Copy API key:** Use "Copy token" button in the table to get their API key

### For Non-Owners/Managers

- Shows access denied message
- Explains that only owners and managers can access this page

## Security Considerations

1. **API Keys are always visible** - Owners and managers can copy any user's API key using the "Copy token" button
2. **Role-based access** - Only owners and managers can access the Team page
3. **Server-side validation** - Backend verifies caller's role before allowing API key creation
4. **Namespace isolation** - Users can only create keys for their own namespace

## Future Enhancements

- [ ] Delete/revoke team members (button currently disabled)
- [ ] Edit team member role/permissions
- [ ] Set expiration date when creating keys
- [ ] Resend/regenerate API keys
- [ ] Audit log of team member actions
- [ ] Email invitations with automatic key setup

## Files

- **Service:** `lib/services/api-keys.ts`
- **Page:** `app/(app)/team/page.tsx`
- **Types:** Defined in service file
- **Hook:** Uses `useUserIdentity()` to check permissions

## Testing Checklist

- [ ] Owner can access Team page
- [ ] Manager can access Team page
- [ ] Publisher sees access denied
- [ ] Advertiser sees access denied
- [ ] Can view list of team members
- [ ] Can add new team member with email
- [ ] Role dropdown shows all 4 roles
- [ ] Read permission is always checked and disabled
- [ ] Write permission can be toggled
- [ ] Form validation requires email
- [ ] Toast shows success message after creation
- [ ] New member appears in table after creation
- [ ] "Copy token" button copies API key to clipboard
- [ ] Button shows "Copied" with checkmark after clicking
- [ ] Can copy different users' tokens
- [ ] Role badges have correct colors
- [ ] Dates show relative time (e.g., "2 days ago")
