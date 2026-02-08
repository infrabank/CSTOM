# API Specification

## Authentication

### POST /auth/signup
Create new user account.
```typescript
Request: { email: string, password: string, name?: string }
Response: { user: User, token: string }
```

### POST /auth/login
Authenticate existing user.
```typescript
Request: { email: string, password: string }
Response: { user: User, token: string }
```

### POST /auth/logout
Invalidate current session.
```typescript
Response: { success: boolean }
```

## REST Endpoints

### GET /api/[collection]
List collection items with pagination.
```typescript
Query: { page?: number, limit?: number, filter?: object }
Response: { data: Item[], total: number, page: number }
```

### POST /api/[collection]
Create new item.
```typescript
Request: Item (without id)
Response: Item
```

### GET /api/[collection]/:id
Get single item.
```typescript
Response: Item
```

### PUT /api/[collection]/:id
Update item.
```typescript
Request: Partial<Item>
Response: Item
```

### DELETE /api/[collection]/:id
Delete item.
```typescript
Response: { success: boolean }
```

## Error Responses
```typescript
{
  error: string
  code: string
  details?: object
}
```
