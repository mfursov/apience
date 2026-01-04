# Apience

A database-agnostic Express.js framework with built-in OpenAPI 3.0 documentation, designed for building robust REST APIs with TypeScript.

## Features

- **Type-Safe Routing**: Fully typed handler definitions with automatic OpenAPI documentation generation
- **Database-Agnostic**: No built-in database coupling - integrate with your database of choice
- **Modular Architecture**: Core framework + optional plugins for auth, rate-limiting, and logging
- **Extensible Middleware**: Generic middleware hooks for adding cross-cutting concerns
- **Automatic OpenAPI Docs**: Type-driven OpenAPI 3.0.1 schema generation
- **Request Context**: Generic, type-safe request context with extensible storage

## Packages

- **@apience/core** - Core routing, validation, and OpenAPI documentation
- **@apience/auth** - Pluggable authentication strategies
- **@apience/rate-limit** - Rate limiting with Redis, MongoDB, or in-memory backends
- **@apience/logging** - Request logging and thread-local storage

## Installation

```bash
npm install @apience/core express
```

## Quick Start

```typescript
import express from 'express';
import { mountGet, ApienceGetHandler, registerApienceObjectDoc, ApienceObjectDoc } from '@apience/core';

// Define your response type
interface User {
  id: string;
  name: string;
  email: string;
}

// Define OpenAPI documentation
const userDoc = registerApienceObjectDoc<User>({
  $name: 'User',
  id: { type: 'string', format: 'uuid', text: 'Unique user identifier' },
  name: { type: 'string', text: 'User full name', minLength: 1, maxLength: 255 },
  email: { type: 'string', format: 'email', text: 'User email address' },
});

// Define a GET endpoint
const getUser: ApienceGetHandler<User> = {
  path: 'users/:userId',
  doc: {
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their ID',
    response: userDoc,
  },
  async handler({ params, req }) {
    const userId = params.get('userId');
    // Your business logic here
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };
  },
};

// Create Express app and mount routes
const app = express();
mountGet(app, getUser, 'object');

// Get OpenAPI schema
app.get('/v1', (req, res) => {
  const { buildApienceSchemaJsonResponse } = require('@apience/core');
  res.json(JSON.parse(buildApienceSchemaJsonResponse()));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('OpenAPI docs: http://localhost:3000/v1');
});
```

## Adding Authentication

```typescript
import {createAuthMiddleware, AuthStrategy} from '@apience/auth';

// Define your auth strategy
const myAuthStrategy: AuthStrategy<{key: string}, {userId: string}> = {
  extractCredentials(req) {
    const key = req.header('X-API-Key');
    if (!key) throw new Error('401 UNAUTHORIZED: No API key provided');
    return {key};
  },

  async validateCredentials({key}) {
    const userId = await validateApiKey(key); // Your logic
    if (!userId) throw new Error('401 UNAUTHORIZED: Invalid API key');
    return {userId};
  },
};

// Add auth middleware to your handlers
const getUser: ApienceGetHandler<User> = {
  path: 'users/:userId',
  doc: {...},
  middlewares: [createAuthMiddleware(myAuthStrategy)],
  async handler({params, context, req}) {
    const {userId: authUserId} = context.context.get('authUser') as {userId: string};
    // Your logic here
  },
};
```

## Adding Rate Limiting

```typescript
import { createRateLimiterMiddleware } from '@apience/rate-limit';

const app = express();

// Add rate limiting middleware
app.use(
  await createRateLimiterMiddleware({
    backend: 'memory', // or 'redis', 'mongo'
    points: {
      read: 100, // 100 requests per window
      write: 10, // 10 write requests per window
    },
    duration: 60, // 60 second window
  }),
);
```

## Adding Request Logging

```typescript
import { createApienceTlsMiddleware, createApienceLoggingMiddleware } from '@apience/logging';

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

## Documentation

- [Core Concepts](./packages/core/README.md)
- [Authentication](./packages/auth/README.md)
- [Rate Limiting](./packages/rate-limit/README.md)
- [Logging](./packages/logging/README.md)

## Architecture

Apience follows a modular plugin architecture:

1. **@apience/core** - The foundation providing routing, validation, and OpenAPI docs
2. **Middleware Hooks** - Handlers can include optional middleware for auth, logging, transactions, etc.
3. **Extensible Context** - A generic key-value context Map for middleware to share data
4. **No Database Coupling** - Your handler logic connects to any database

This design keeps the framework lightweight while remaining flexible and powerful.

## License

MIT

## Support

For issues, questions, or contributions, please visit the repository.
