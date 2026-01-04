# Apience

A lightweight Express.js framework extension with built-in OpenAPI 3.0 documentation and validation, designed for building robust REST APIs with TypeScript.

## Features

- **Type-Safe Routing**: Fully typed handler definitions with automatic OpenAPI documentation generation
- **Database-Agnostic**: No built-in database coupling - integrate with your database of choice for authentication or rate limiting
- **Modular Architecture**: Core framework + optional plugins for auth, rate-limiting, and logging
- **Extensible Middleware**: Generic middleware hooks for adding cross-cutting concerns
- **Automatic OpenAPI Docs**: Type-driven OpenAPI 3.0.1 schema generation
- **Request Context**: Generic, type-safe request context with extensible storage

## Installation

```bash
npm install apience
```

## Quick Start

```typescript
import express from 'express';
import { createRouteTable, buildApienceSchemaJsonResponse, ApienceRequestContext } from 'apience';

// Define your response type
interface User {
  id: string;
  name: string;
  email: string;
}

// Create Express app
const app = express();
app.use(express.json());

// Create route table
const routes = createRouteTable(app);

// Define a GET endpoint
routes.get<User | User[]>({
  path: 'users/:userId',
  doc: {
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their ID',
    response: {
      id: { text: 'User ID', type: 'string' },
      name: { text: 'User name', type: 'string' },
      email: { text: 'User email', type: 'string', format: 'email' },
      $name: 'User',
    },
  },
  handler: async (context: ApienceRequestContext): Promise<User> => {
    const userId = context.params.get('userId');
    // Your business logic here
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };
  },
});

// Define a POST endpoint
routes.post<{ name: string }, User>({
  path: 'users',
  doc: {
    summary: 'Create user',
    description: 'Create a new user',
    request: {
      name: { text: 'User name', type: 'string', isRequired: true },
      email: { text: 'User email', type: 'string', format: 'email', isRequired: true },
      $name: 'CreateUserRequest',
    },
    response: {
      id: { text: 'User ID', type: 'string' },
      name: { text: 'User name', type: 'string' },
      email: { text: 'User email', type: 'string', format: 'email' },
      $name: 'User',
    },
  },
  handler: async (context: ApienceRequestContext<{ name: string }>): Promise<User> => {
    return {
      id: '123',
      name: context.request.name,
      email: 'john@example.com',
    };
  },
});

// Get OpenAPI schema
app.get('/v1', (_req, res) => {
  res.json(JSON.parse(buildApienceSchemaJsonResponse()));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('OpenAPI docs: http://localhost:3000/v1');
});
```

## Adding Authentication

```typescript
import { createAuthMiddleware, BasicAuthStrategy, getAuthUser } from 'apience';

// Create Express app and route table
const app = express();
app.use(express.json());
const routes = createRouteTable(app);

// Define Basic Auth strategy
const basicAuth = new BasicAuthStrategy(async (username: string, password: string) => {
  // Your validation logic
  if (username === 'admin' && password === 'secret') {
    return { id: 'admin-1', username, role: 'admin' };
  }
  return null;
});

// Add authentication to an endpoint
routes.get<User>({
  path: 'profile',
  doc: {
    summary: 'Get user profile',
    description: 'Returns the authenticated user profile',
    response: {
      id: { text: 'User ID', type: 'string' },
      username: { text: 'Username', type: 'string' },
      $name: 'UserProfile',
    },
  },
  middlewares: [createAuthMiddleware(basicAuth)],
  handler: async (context: ApienceRequestContext): Promise<User> => {
    const user = getAuthUser(context);
    return { id: user.id, username: user.username, email: 'admin@example.com' };
  },
});
```

## Adding Rate Limiting

```typescript
import { createRateLimiterMiddleware } from 'apience';

const app = express();

// Add rate limiting middleware
app.use(
  createRateLimiterMiddleware({
    points: 100, // 100 requests per window
    duration: 60, // 60 second window
  }),
);
```

## Adding Request Logging

```typescript
import { createApienceTlsMiddleware, createApienceLoggingMiddleware } from 'apience';

const app = express();

// Initialize thread-local storage for request tracking
app.use(createApienceTlsMiddleware());

// Add logging middleware
app.use(
  createApienceLoggingMiddleware({
    enableConsole: true,
    sensitiveFields: ['password', 'secret'],
  }),
);
```

## Architecture

Apience follows a modular plugin architecture:

1. **apience** - The foundation providing routing, validation, and OpenAPI docs
2. **Middleware Hooks** - Handlers can include optional middleware for auth, logging, transactions, etc.
3. **Extensible Context** - A generic key-value context Map for middleware to share data
4. **No Database Coupling** - Your handler logic connects to any database

This design keeps the framework lightweight while remaining flexible and powerful.

## License

MIT

## Support

For issues, questions, or contributions, please visit the repository.
