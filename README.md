# Apience

Type-safe Express.js routing with automatic OpenAPI 3.0 documentation.

## Installation

```bash
npm install apience express
```

## Quick Start

```typescript
import express from 'express';
import { createRouteTable, buildApienceSchemaJsonResponse } from 'apience';

const app = express();
app.use(express.json());

const routes = createRouteTable(app);

// GET /users/:id
routes.get<{ id: string; name: string }>({
  path: 'users/:id',
  doc: {
    summary: 'Get user',
    description: 'Get user by ID',
    response: {
      id: { text: 'User ID', type: 'string' },
      name: { text: 'Name', type: 'string' },
      $name: 'User',
    },
  },
  handler: async (ctx) => ({
    id: ctx.params.get('id'),
    name: 'John',
  }),
});

// POST /users
routes.post<{ name: string }, { id: string }>({
  path: 'users',
  doc: {
    summary: 'Create user',
    description: 'Create new user',
    request: { name: { text: 'Name', type: 'string' }, $name: 'CreateUserReq' },
    response: { id: { text: 'ID', type: 'string' }, $name: 'CreateUserRes' },
  },
  validator: { name: (v) => { assertTruthy(v, '400: name required'); } }, // import { assertTruthy } from 'assertic'
  handler: async (ctx) => ({ id: '123' }),
});

// OpenAPI schema endpoint
app.get('/openapi', (_, res) => res.json(JSON.parse(buildApienceSchemaJsonResponse())));

app.listen(3000);
```

## Configuration

### Optional Documentation

By default, endpoint documentation is optional. You can configure Apience to require documentation for all endpoints:

```typescript
import { configureApience } from 'apience';

// Require documentation (throws error at mount time if missing)
configureApience({ requireDocs: true });

// Optional documentation (default)
configureApience({ requireDocs: false });

// Optional documentation with warnings for missing docs
configureApience({ requireDocs: false, warnOnMissingDocs: true });
```

When `requireDocs` is `true`, any endpoint without a `doc` field will throw an error during route registration:

```typescript
// This will throw an error if requireDocs is true
routes.get({
  path: 'users',
  handler: async () => ({ users: [] }),
});
// Error: [Apience] Documentation (doc) is required for GET /users.
// Set configureApience({ requireDocs: false }) to disable this check.
```

When `warnOnMissingDocs` is `true`, endpoints without documentation will show warnings in the console:

```typescript
// This will show a warning if warnOnMissingDocs is true
routes.get({
  path: 'users',
  handler: async () => ({ users: [] }),
});
// Console: [Apience] No documentation for GET /users
```

**Use cases:**
- **Development**: Set `requireDocs: false` for rapid prototyping, optionally use `warnOnMissingDocs: true` to track missing documentation
- **Production**: Set `requireDocs: true` to ensure all endpoints are documented
- **Gradual migration**: Start with `requireDocs: false` and `warnOnMissingDocs: true`, add docs incrementally, then switch to `requireDocs: true`

## API Versioning

```typescript
// Top-level: GET /users
routes.get({ path: 'users', doc: {...}, handler: ... });

// Versioned: GET /v1/users
routes.get({ path: 'users', version: '1', doc: {...}, handler: ... });

// Versioned: GET /v2/users
routes.get({ path: 'users', version: '2', doc: {...}, handler: ... });
```

## Authentication

```typescript
import { createAuthMiddleware, BasicAuthStrategy, getAuthUser } from 'apience';

const auth = new BasicAuthStrategy(async (user, pass) =>
  user === 'admin' && pass === 'secret' ? { id: '1', role: 'admin' } : null
);

routes.get({
  path: 'profile',
  doc: {...},
  middlewares: [createAuthMiddleware(auth)],
  handler: async (ctx) => {
    const user = getAuthUser(ctx);
    return { id: user.id };
  },
});
```

## Rate Limiting

```typescript
import { createRateLimiterMiddleware } from 'apience';

app.use(await createRateLimiterMiddleware({
  points: { read: 100, write: 50 },
  duration: 60,
}));
```

## Request Logging

```typescript
import { createApienceTlsMiddleware, createApienceLoggingMiddleware } from 'apience';

app.use(createApienceTlsMiddleware());
app.use(createApienceLoggingMiddleware({ enableConsole: true }));
```

## License

MIT
