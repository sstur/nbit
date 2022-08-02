# nbit

A nano-sized, zero-dependency, strongly-typed web framework for [Bun](https://bun.sh), [Node](https://nodejs.org) and [Cloudflare Workers](https://workers.cloudflare.com/).

## Objectives

- **Simplicity** - a clean, minimal _declarative_ API for routing and request handling, based on web standards
- **Type Safety** - extensively leveraging modern TypeScript features for a great developer experience and strong type safety
- **Testability** - making route handlers easy to write and easy to test
- First-class support for [Bun](https://bun.sh/), [Node](https://nodejs.org/en/) and [Cloudflare workers](https://workers.cloudflare.com/)
- [Nano-sized](https://unpkg.com/browse/@nbit/bun/) with no dependencies

<details>
  <summary><strong>Core Features</strong></summary>

- Request routing
- Body parsing
- A type-safe approach to middleware (inspired by [Apollo Server's context](https://www.apollographql.com/docs/apollo-server/data/resolvers/#the-context-argument))
- File Serving (with content-type selection and caching headers like ETag)
- JSON by default (just return a plain object)
- Extensive use of TypeScript for a great developer experience (e.g. type inference for route params)
- Based on web standards you're already familiar with

</details>

<details>
  <summary><strong>Work-in-progress / Coming Soon</strong></summary>

- Schemas and validation for JSON request body
- Additional body parsers such as multipart/form-data
- High performance trie-based (e.g. radix3) request router
- Better documentation
- Performance benchmarks and comparisons with other libraries
- Deno support

</details>

## Motivation

For various projects I've wanted a clean, declarative, type-safe approach for building web APIs that's light-weight enough to be used with [Cloudflare workers](https://workers.cloudflare.com/) and powerful enough to be a replacement for [Express](https://expressjs.com/) on Node (and now we have [Bun](https://bun.sh/)). Nothing in the ecosystem really checks all those boxes.

Does the world need another web framework? How is this different from what's out there? [Read more](https://github.com/sstur/nbit/wiki/Motivation) about the motivation behind this package (aka what's wrong with Express).

## Live Playground

Check out the [live demo on Stackblitz](https://stackblitz.com/edit/node-uekcm7?file=src/server.ts).

## Installation

```sh
bun add @nbit/bun

# -- or --

npm install @nbit/node

# -- or --

npm install @nbit/express # For Express middleware version
```

## Hello World Example

<details open>
    <summary>Bun</summary>

```ts
import { createApplication } from '@nbit/bun';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (request) => {
    return { hello: 'world' };
  }),
]);

Bun.serve({
  port: 3000,
  fetch: attachRoutes(routes),
});
```

</details>

<details>
    <summary>Node</summary>

```ts
import http from 'http';
import { createApplication } from '@nbit/node';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (request) => {
    return { hello: 'world' };
  }),
]);

const server = http.createServer(attachRoutes(routes));

server.listen(3000, () => {
  console.log(`Server running at http://localhost:3000/`);
});
```

</details>

<details>
    <summary>Express</summary>

```ts
import express from 'express';
import { createApplication } from '@nbit/express';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (request) => {
    return { hello: 'world' };
  }),
]);

const app = express();
const middleware = attachRoutes(routes);
app.use(middleware);

app.listen(3000, () => {
  console.log(`Server running at http://localhost:3000/`);
});
```

</details>

<details>
    <summary>Apollo GraphQL</summary>

```ts
// Adapted from: https://www.apollographql.com/docs/apollo-server/api/apollo-server/#framework-specific-middleware-function
import http from 'http';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createApplication } from '@nbit/express';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (request) => {
    return { hello: 'world' };
  }),
]);

async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const apolloServer = new ApolloServer({
    /* ... */
  });

  await apolloServer.start();

  // Additional middleware can be mounted at this point to run before Apollo.
  app.use(attachRoutes(routes));

  // Mount Apollo middleware here.
  apolloServer.applyMiddleware({ app });

  httpServer.listen(3000, () => {
    console.log(`Server running at http://localhost:3000/`);
  });
}
```

</details>

<details>
    <summary>Cloudflare Workers</summary>

```ts
import { createApplication } from '@nbit/cfw';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (request) => {
    return { hello: 'world' };
  }),
]);

export default {
  fetch: attachRoutes(routes),
};
```

</details>

Honestly, this might seem a bit boilerplatey for a hello world, but there's some important ergonomic design decisions with the `defineRoutes()` and `attachRoutes()` paradigm, so stick with me here.

## Extensively Typed

Everything from middleware (which we call context) to body parsers to request params is fully typed, out of the box, using TypeScript's powerful type inference so you don't need to write type annotations everywhere.

```ts
const routes = defineRoutes((app) => [
  app.get('/users/:username', async (request) => {
    const username = request.params.username.toLowerCase(); // <-- ✅ TypeScript knows this is a string
    const foo = request.params.foo; // <-- 🚫 Type Error: foo does not exist on params
    const body = await request.json(); // <-- 🚫 Type Error: GET request doesn't have a body
    if (!isValidUsername(username)) {
      throw new HttpError({ status: 403 }); // <-- Throw from any level deep
    }
    const user = await db.getUserByUsername(username);
    if (!user) {
      return; // <-- Will proceed to the next handler, or send 404 if there are no more handlers
    }
    return user; // <<-- Automatically converted to JSON
  }),
]);
```

Note that in the above code we're defining an _array_ of route handlers.

```ts
const routes = defineRoutes((app) => [ ... ]);
```

This reflects an important principle of this framework; we don't mutate a shared `app` that gets passed around. We instead `declare` or `define` a set of route handlers. The result is simply an array (which can be passed into `attachRoutes()` or used for tests).

From a route handler you can `return new Response(string)` or `return new Response(stream)` or you can use a helper like `return Response.json({...})` or return just a plain object and it will be converted to JSON.

`Response` follows [the web standard](https://developer.mozilla.org/en-US/docs/Web/API/Response) for the most part, but there's an extra `Response.file(path)` to serve a static file, and there might be additional non-standard helpers in future.

You can `import { Response } from '@nbit/node'` or from `@nbit/bun`, etc.

In Bun and Cloudflare workers (which have a built-in Response), the `Response` object is a sub-class of the built-in Response.

Similarly the `request` object that is passed in to each route handler follows [the web standard](https://developer.mozilla.org/en-US/docs/Web/API/Request) for the most part, but it has an additional `.params` for route params as well as whatever custom context methods you define (see below).

## Splitting routes into multiple files

This approach to declarative route handlers scales nicely if we want to split our routes into different files as our application grows:

```ts
// routes/foo.ts
export default defineRoutes((app) => [
  app.get('/', async (request) => { ... }),
  app.post('/foo', async (request) => { ... }),
]);

// routes/bar.ts (note the optional destructuring below)
export default defineRoutes(({ get, post }) => [
  get('/', async (request) => { ... }),
  post('/bar', async (request) => { ... }),
]);

// routes/index.ts
export { default as foo } from './foo';
export { default as bar } from './bar';

// server.ts
import * as handlers from './routes';

Bun.serve({
  port: 3000,
  fetch: attachRoutes(...Object.values(handlers)),
});
```

See full examples for [Bun](https://github.com/sstur/nbit/blob/master/examples/bun-app/src/server.ts), [Node](https://github.com/sstur/nbit/blob/master/examples/node-app/src/server.ts) or [Express](https://github.com/sstur/nbit/blob/master/examples/express-app/src/server.ts).

## Context (aka middleware)

The design choice for extensibility is influenced by the way [Apollo Server](https://www.apollographql.com/docs/apollo-server/data/resolvers/#the-context-argument) does things; this allows us to maximize type safety while still providing an ergonomic experience for developers.

Essentially you create a context object which will be passed to each route handler. This context object can have helpers for authentication, body parsing, etc.

Example:

```ts
import { createApplication, HttpError } from '@nbit/bun';

const { defineRoutes, attachRoutes } = createApplication({
  getContext: (request) => ({
    // We can provide async functions here that can be easily called within our route handlers
    authenticate: async () => { ... },
    someOtherHelper: () => {
      // We can throw a special HttpError from here
      if (!request.headers.get('foo')) {
        throw new HttpError({ status: 403 });
      }
    },
  }),
});

const routes = defineRoutes((app) => [
  app.get('/users/me', (request) => {
    const user = await request.authenticate(); // <-- This is fully typed; TS knows this method is available on `request` because we defined it above
    const foo = request.foo(); // <-- 🚫 Type Error: foo() does not exist on request or context
    return user.someDetails; // <-- We can be sure
  }),
]);

export { defineRoutes, attachRoutes };
```

Note in the above that whatever we return as part of `context` gets merged onto the request object. This has been convenient, but I'm not sure if it's too magical, so there's a possibility this might change to `request.context` in a future version.

Importantly, the context methods, e.g. `.authenticate()` can throw a special HttpError (or any error really, but HttpError will ensure the right response status, vs a generic error will result in a 500). This ensures we can do something like `const { userId } = await request.authenticate()` from within a route handler since it will _always_ result in a valid user.

## Benchmarks

// TODO

## Testing route handlers

// TODO

## Project Status

It is still early days, and some parts of the API will likely change (I will follow semver and a breaking change will be a major version bump). This is adapted from an internal set of tooling that has been used in production, but that doesn't mean this is stable. Please do try it out and leave feedback, criticisms and thoughts on the design choices and implementation. I know there's still a number of missing pieces, missing examples and missing documentation (file uploads, cors helpers, etc) but I wanted to get this out to gather early feedback. I hope you find this useful, even if merely as something fun to [poke around with](https://stackblitz.com/edit/node-uekcm7?file=src/server.ts)!
