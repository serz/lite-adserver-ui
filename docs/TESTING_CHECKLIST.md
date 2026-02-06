# API Key Validation - Testing Checklist

## Quick Testing Guide

### Prerequisites
- Backend must have `/api/me` endpoint implemented
- Test with both valid and invalid API keys
- Test with legacy keys (null email/role) if available

## Test Scenarios

### ✅ Login Flow

#### Test 1: Valid API Key
- [ ] Navigate to `/login`
- [ ] Enter a valid API key
- [ ] Click "Sign in"
- **Expected:** 
  - Loading state shows "Signing in..."
  - Request to `/api/me` with Authorization header
  - Redirected to `/dashboard`
  - User email shows in account dropdown

#### Test 2: Invalid API Key
- [ ] Navigate to `/login`
- [ ] Enter an invalid API key (e.g., "invalid-key-123")
- [ ] Click "Sign in"
- **Expected:**
  - Loading state shows "Signing in..."
  - Request to `/api/me` returns 401
  - Error message: "Invalid API key. Please check your key and try again."
  - User stays on login page
  - Form remains enabled

#### Test 3: Network Error
- [ ] Turn off network or use invalid API URL
- [ ] Navigate to `/login`
- [ ] Enter any API key
- [ ] Click "Sign in"
- **Expected:**
  - Error message: "Network error. Please check your connection and try again."
  - User stays on login page

#### Test 4: Already Logged In
- [ ] Log in successfully
- [ ] Navigate to `/login` manually
- **Expected:**
  - Automatically redirected to `/dashboard`

### ✅ Dashboard/App Flow

#### Test 5: Fresh Login
- [ ] Clear localStorage and cookies
- [ ] Navigate to `/dashboard` (or any protected route)
- **Expected:**
  - Redirected to `/login`
  - After login, redirected back to dashboard

#### Test 6: Page Refresh While Logged In
- [ ] Log in successfully
- [ ] Navigate to any page (e.g., `/campaigns`)
- [ ] Refresh the page (Cmd+R / Ctrl+R)
- **Expected:**
  - Page loads normally
  - User remains authenticated
  - User email still shows in account dropdown
  - Console shows: "Using cached user identity" OR "API key valid, user: [email]"

#### Test 7: User Email Display
- [ ] Log in with a key that has an email
- [ ] Check account dropdown in top-right
- **Expected:**
  - User email is displayed
  - Truncated if too long with ellipsis

#### Test 8: Legacy Key (No Email)
- [ ] Log in with a legacy key that returns `email: null` from `/api/me`
- [ ] Check account dropdown
- **Expected:**
  - Shows "Account" instead of email
  - No errors in console

### ✅ Logout Flow

#### Test 9: Logout
- [ ] Log in successfully
- [ ] Click account dropdown → "Sign out"
- **Expected:**
  - Redirected to `/login`
  - User email no longer visible
  - Navigating to `/dashboard` redirects to `/login`

#### Test 10: Logout Clears Cache
- [ ] Log in successfully
- [ ] Open browser DevTools → Console
- [ ] Log out
- [ ] Try to navigate to `/dashboard`
- **Expected:**
  - No cached identity used
  - User must log in again

### ✅ Error Handling

#### Test 11: Expired Key During Session
- [ ] Log in successfully
- [ ] Have backend revoke/expire the API key
- [ ] Perform an action that makes an API request (e.g., load campaigns)
- **Expected:**
  - API returns 401
  - User is automatically logged out
  - Redirected to `/login`
  - Error message or toast may appear

#### Test 12: Invalid Namespace
- [ ] Use a subdomain that doesn't exist (e.g., `nonexistent.affset.com`)
- [ ] Try to log in with any API key
- **Expected:**
  - Request to `/api/me` returns 401 or 404
  - Error message shown
  - User stays on login page

### ✅ Developer Tools Verification

#### Test 13: Network Request Inspection
- [ ] Open browser DevTools → Network tab
- [ ] Clear network log
- [ ] Log in with valid API key
- **Expected network requests:**
  1. `GET /api/public/tenant` (if namespace exists, for branding)
  2. `GET /api/me` with headers:
     - `Authorization: Bearer <your-api-key>`
     - `X-Namespace: <your-namespace>` (if applicable)
  3. Response body should match `UserIdentity` interface

#### Test 14: Console Logs
- [ ] Open browser DevTools → Console tab
- [ ] Log in with valid API key
- **Expected console logs:**
  - "AuthProvider: API key validated successfully, user: [email]"
  - No error messages
- [ ] Log in with invalid API key
- **Expected console logs:**
  - "AuthProvider: API key validation failed: [error]"

#### Test 15: LocalStorage Inspection
- [ ] Open browser DevTools → Application/Storage tab → Local Storage
- [ ] Log in successfully
- [ ] Check `lite-adserver-api-key` entry
- **Expected:**
  - API key is stored
- [ ] Log out
- **Expected:**
  - `lite-adserver-api-key` is removed

## Quick Test Script

For rapid testing, use this sequence:

```bash
# Test 1: Valid login
1. Go to /login
2. Enter valid key → Should redirect to /dashboard

# Test 2: Invalid login
3. Go to /login
4. Enter "invalid-key" → Should show error

# Test 3: Persistence
5. Refresh page → Should stay logged in
6. Close tab, reopen app → Should stay logged in

# Test 4: Logout
7. Click Sign out → Should go to /login
8. Try /dashboard → Should redirect to /login
```

## Automated Test

Run the test suite:

```bash
npm test -- Login.test.tsx
```

**Expected:** All tests pass, including:
- ✅ renders the login form
- ✅ handles form submission and calls login
- ✅ redirects if already authenticated
- ✅ displays error message when login fails with invalid API key
- ✅ displays network error message when connection fails

## Common Issues & Solutions

### Issue: Infinite redirect loop
**Solution:** Clear localStorage and check that `isAuthReady` is properly set

### Issue: User identity is null after login
**Solution:** Check that `/api/me` endpoint is returning correct response format

### Issue: Email shows "Account" instead of email
**Solution:** Check that `/api/me` returns non-null `email` field

### Issue: Network error on login
**Solution:** Verify `NEXT_PUBLIC_AD_SERVER_URL` is set correctly

### Issue: 401 after successful login
**Solution:** Check that namespace matches between login and API requests

## API Response Examples

### Valid Key Response
```json
{
  "namespace": "acme",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@acme.com",
  "role": "owner",
  "permissions": ["read", "write"]
}
```

### Legacy Key Response
```json
{
  "namespace": "acme",
  "user_id": null,
  "email": null,
  "role": null,
  "permissions": []
}
```

### Invalid Key Response (401)
```json
{
  "error": "Invalid or expired API key"
}
```

## Sign-Off Checklist

Before marking as complete:

- [ ] All 15 manual tests pass
- [ ] Automated tests pass
- [ ] No console errors in normal flow
- [ ] No linter errors
- [ ] User email displays correctly
- [ ] Error messages are user-friendly
- [ ] Documentation is complete
- [ ] Code is committed and pushed

## Done! 🎉

If all tests pass, the API key validation implementation is ready for production.
