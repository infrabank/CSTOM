# Authentication Flow

## Overview
JWT-based authentication using djangorestframework-simplejwt.

## Flow Diagram
```
1. User submits credentials
2. Frontend calls /api/token/ (login) or /api/users/ (signup)
3. Django validates and returns JWT (access + refresh tokens)
4. Frontend stores tokens (localStorage or httpOnly cookie)
5. Subsequent requests include Authorization header
6. Django validates token via simplejwt
```

## Token Management
- Access token: 5 minutes (configurable)
- Refresh token: 1 day (configurable)
- Refresh via POST /api/token/refresh/

## Protected Routes
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

## Frontend Integration
```typescript
// API client with auth
const api = {
  headers: () => ({
    Authorization: `Bearer ${getAccessToken()}`
  })
}
```
