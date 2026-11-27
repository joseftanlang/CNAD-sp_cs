# ET0745 Master Revision and Practical Exam Guide

This guide combines the theory and practical exercises in `prac1/`. It is based on the code currently in this repository. Where a starter file is incomplete or contains a bug, the guide calls that out instead of pretending the example is production-ready.

## Contents

- [Exam approach](#exam-approach)
- [Part A — Theory revision](#part-a--theory-revision)
  - [Chapter 1 — Cloud native and microservices](#chapter-1--cloud-native-and-microservices)
  - [Chapter 2 — Core design principles](#chapter-2--core-design-principles)
  - [Chapter 3 — Design patterns and migration](#chapter-3--design-patterns-and-migration)
- [Part B — Practical lab guide](#part-b--practical-lab-guide)
  - [Command-line setup](#command-line-setup)
  - [Lab 1 — Bootstrap a User service](#lab-1--bootstrap-a-user-service)
  - [Lab 2 — REST API and API-key security](#lab-2--rest-api-and-api-key-security)
  - [Lab 3 — REST routes, middleware, and observability](#lab-3--rest-routes-middleware-and-observability)
  - [Troubleshooting](#troubleshooting)
- [Final exam checklist](#final-exam-checklist)
- [Related chapter notes](#related-chapter-notes)

---

# Exam approach

For theory answers, use this structure:

1. **Name the problem or requirement.**
2. **Choose the principle or pattern** that addresses it.
3. **Explain how it works** in this scenario.
4. **State a trade-off or failure mode.**
5. **Say how you would verify or monitor it.**

Example: “Use asynchronous messaging for order confirmation because email delivery should not block checkout. The order service publishes an event and a worker sends the email. Delivery may be delayed or duplicated, so the consumer should be idempotent and failures should be retried or sent to a dead-letter queue.”

For practical answers, first identify the project folder, dependencies, environment variables, port, routes, expected status codes, and how to inspect logs. Run one service per terminal and test it with `curl` before changing code.

# Part A — Theory revision

## Chapter 1 — Cloud native and microservices

### Definitions

- **Cloud native** describes how software is designed, built, deployed, and operated to take advantage of automation, elastic infrastructure, and resilient cloud platforms. It can use public, private, hybrid, or multicloud environments. It is broader than microservices; not every cloud-native application must be split into microservices.
- **Microservices** are independently running, cohesive services organized around business capabilities. They communicate over network interfaces and own their behavior and data boundaries.
- **Relationship:** Microservices are an architectural style; cloud native is a broader engineering and operating approach. Containers, orchestration, automation, and observability can support microservices, but also introduce complexity.

### Seven core cloud-native principles

1. **Microservices-centric architecture:** Organize cohesive services around business capabilities. Independent teams and releases are possible when service boundaries are well chosen.
2. **Containerization and orchestration:** Package applications in containers; orchestrators such as Kubernetes schedule, scale, network, and restart instances. Health checks and restart policies help recover, but cannot repair faulty business logic.
3. **Stateless processes and elasticity:** Keep durable state outside replaceable processes. Stateless instances can be added or removed without depending on a particular machine’s memory.
4. **Automation and DevOps:** CI builds and tests changes; CD automates the path to release; Infrastructure as Code makes infrastructure repeatable and reviewable.
5. **Resilience and self-healing:** Expect failures. Use health checks, load balancing, timeouts, safe retries, rate limits, and circuit breakers to limit impact. These reduce failure propagation; they do not prevent every outage.
6. **Observability:** Combine logs, metrics, and distributed traces to understand behavior. Metrics show trends, traces show request paths, and logs provide event details.
7. **Twelve-Factor practices:** Keep configuration external, dependencies explicit, processes stateless, logs as event streams, and applications disposable. Chapter 2 has the full twelve-factor list.

### Monolith and microservices

| Concern | Monolith | Microservices |
|---|---|---|
| Deployment unit | Most capabilities are released together | Services may be released independently |
| Calls | Usually in-process | Network calls introduce latency and partial failure |
| Data | Often one database; internal module boundaries are still possible | Each service owns its data boundary; access is through APIs/events |
| Scaling | Scale the application or its components within the monolith | Scale the services with the greatest demand |
| Technology | Usually one shared stack | Polyglot choices are possible but cost more to support |
| Failure | Process failure can affect the whole deployed application | Boundaries may contain failures, but dependencies can still cascade |

**Advantages:** independent delivery, targeted scaling, capability-aligned teams, focused codebases, and technology choice when justified.

**Challenges:** network latency, distributed data consistency, operational overhead, harder debugging, security at more network boundaries, and a risk of creating a distributed monolith.

**Exam nuance:** Microservices do not guarantee that one failure cannot affect other services. Shared dependencies, long synchronous chains, or a failing gateway can still create broad outages. A well-modularized monolith may be the better starting point for a small system.

## Chapter 2 — Core design principles

### Twelve-Factor App: all twelve

1. **Codebase:** Track an application in version control and deploy it to multiple environments. A service can be independently deployable in a monorepo or its own repository; the important point is clear ownership and release boundaries.
2. **Dependencies:** Declare and isolate packages; do not rely on globally installed software.
3. **Config:** Keep environment-specific configuration and secrets out of source code.
4. **Backing services:** Treat databases, caches, queues, and external APIs as attached resources configured separately from application logic.
5. **Build, release, run:** Build an artifact, combine it with configuration into an identifiable release, then run that release. Do not edit a release in place.
6. **Processes:** Keep processes stateless; put durable state in backing services.
7. **Port binding:** Let the application expose its service by listening on a configured port.
8. **Concurrency:** Scale with additional processes or workers; separate different workload types where appropriate.
9. **Disposability:** Support fast startup and graceful shutdown.
10. **Dev/prod parity:** Keep development, test, and production environments as similar as practical.
11. **Logs:** Emit event streams to standard output/error for platform collection.
12. **Admin processes:** Run migrations and one-off tasks with the same code and dependency environment as the application.

### Microservice design principles

- Model services around **business capabilities** and DDD **bounded contexts**; keep each service cohesive.
- Give each service ownership of its data. A database boundary does not always mean a physically separate database server.
- Use **synchronous REST/gRPC** when an immediate response is required; the caller then depends on the callee’s availability and latency.
- Use **asynchronous messaging/events** for decoupled or long-running work; account for delay, duplicates, retries, and eventual consistency.
- Use **CQRS** only when read and write models genuinely need different shapes or scaling. It adds synchronization work and may make reads briefly stale.
- Use **Sagas** for long-running business workflows across services. Compensating actions counteract work; they are not always literal rollbacks.
- Make retried commands **idempotent**. Use timeouts, bounded retries with backoff, and circuit breakers to limit failure propagation.
- Use **service discovery** for changing service instances and an **API gateway** for external routing and edge policies. Keep business logic out of the gateway.
- Use logs, metrics, and **distributed tracing** together; propagate trace/correlation IDs across services.
- Automate tests and independent deployments. Blue-green and canary rollouts reduce release risk but still require health checks and rollback plans.
- A **service mesh/sidecar** can manage network functions such as mTLS and traffic policy, at the cost of more infrastructure to operate.

## Chapter 3 — Design patterns and migration

### Five categories

| Category | Purpose | Examples |
|---|---|---|
| **Decomposition** | Find service boundaries | Business capability, DDD subdomain |
| **Integration** | Route requests and exchange data | API Gateway, Aggregator, messaging, branch/chain |
| **Data management** | Own, read, and coordinate data | Database per service, CQRS, Event Sourcing, Saga |
| **Observability** | Understand distributed behavior | Central logs, metrics, distributed tracing |
| **Cross-cutting** | Apply resilience/security across services | Circuit Breaker, Bulkhead, Sidecar/Service Mesh |

### Pattern selection and trade-offs

- **Business capability / bounded context:** Split around business meaning, not technical tiers. Core, supporting, and generic subdomains depend on the business context.
- **API Gateway:** One external entry point for routing and edge concerns. Deploy redundantly; it adds a hop and can become a bottleneck.
- **API Aggregator:** Combines results from multiple services for a client. Handle timeouts and partial responses.
- **Pub/Sub:** Brokered asynchronous delivery. Producer and consumer are decoupled at runtime, but still need compatible message contracts and robust delivery handling.
- **Branch vs. chain:** Parallel independent calls wait approximately for the slowest required result; sequential chains accumulate latency and availability dependencies.
- **Database per service:** Prevent direct cross-service table access. Use APIs, events, or projections to share information.
- **CQRS:** Read/write model separation; trade-off is additional synchronization and possible staleness.
- **Event Sourcing:** Store state-changing events as the source of truth. Useful when history matters, but adds schema evolution, replay, and storage complexity. Append-only does not by itself make data tamper-proof.
- **Saga:** Coordinate local transactions; compensate when later steps fail. Choreography is decentralized; orchestration makes complex workflows easier to track but adds a coordinator.
- **Circuit Breaker:** Closed passes calls; Open fails fast; Half-Open probes recovery. Fallbacks must be valid for the operation—never fake a successful payment.
- **Bulkhead:** Isolate resource pools so one workload cannot consume all capacity.
- **Sidecar/mesh:** Centralize some network behavior; introduces resource and operational costs.

### Monolith migration

- Assess business contexts, dependencies, data ownership, and operational readiness before extraction.
- The **6 Rs:** Re-host, Re-platform, Re-factor/Re-architect, Re-purchase, Retire, Retain.
- **Strangler Fig:** Build a new capability, route selected traffic to it while the old system remains, then remove the replaced legacy code after verification.
- **Anti-Corruption Layer (ACL):** Translate legacy models/protocols so new services do not inherit legacy assumptions.
- **Database migration:** Avoid assuming independent writes to old and new databases will stay consistent. Validate/reconcile data; use controlled cutover, monitoring, and rollback. Consider an outbox or change-data-capture strategy.
- Avoid a **distributed monolith**: many network services that still require coordinated changes and share tightly coupled data.

### Decision matrix

| Scenario | Pattern to consider | Trade-off |
|---|---|---|
| Extract a legacy capability gradually | Strangler Fig | Temporary coexistence and routing |
| Reads and writes need different models | CQRS | Eventual consistency and synchronization |
| Workflow spans service databases | Saga | Compensation and intermediate states |
| Dependency failures are cascading | Circuit Breaker | Needs safe fallback and monitoring |
| One stable client entry point is needed | API Gateway | Added hop; needs high availability |
| Mobile client makes many related calls | API Aggregator | Partial failures and downstream coupling |
| Legacy schema must not leak into new code | ACL | Translation logic to maintain |
| Full state-change history is required | Event Sourcing | Replay, schema evolution, storage complexity |
| Batch tasks starve interactive requests | Bulkhead | Resource pools require sizing |

# Part B — Practical lab guide

The practical code is under `prac1/lab1/`, `prac1/lab2/`, and `prac1/lab3/`. These are separate Node/Express exercises, not one combined application.

## Command-line setup

### Requirements and basic commands

Use a terminal in the repository root. Check the installed tools:

```bash
node --version
npm --version
curl --version
```

Install dependencies inside the individual lab directory (each lab has its own `package.json`):

```bash
cd prac1/lab1/user-serivce
npm install
npm install express dotenv
npm init -y
```

Repeat `npm install` in `prac1/lab2/product-service` and `prac1/lab3` if needed. Do not run `npm install` from the repository root; there is no root package manifest.

Start a lab with `node app.js` from that lab’s folder. The package manifests do not currently define a useful `start` script, and their test scripts are placeholders; use `node app.js` rather than expecting `npm start` or `npm test` to work.

### Ports and terminals

Run each server in its own terminal and leave that terminal open to read logs. Lab 1 defaults to port `3000`, Lab 2 defaults to `3001`, and Lab 3 defaults to `3000`. The `.env` setting can override the default. Lab 1 and Lab 3 therefore conflict if started simultaneously with the same port.

To override a port in Bash/Linux/macOS:

```bash
PORT=3010 node app.js
```

In PowerShell:

```powershell
$env:PORT = "3010"
node app.js
```

Use `curl.exe` instead of `curl` in PowerShell if its `curl` alias causes problems. The examples below use Bash-style commands.

### HTTP command patterns

```bash
# GET: inspect headers and status as well as the response body
curl -i http://localhost:3001/health

# POST JSON: include Content-Type and a JSON request body
curl -i -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk Lamp","price":35.5,"category":"Home"}'
```

Useful options:

- `-i` includes HTTP response headers (useful for status codes and `X-Request-ID`).
- `-v` shows request/connection details when debugging.
- `-H` adds a request header.
- `-d` sends a request body; specify `Content-Type: application/json` for JSON.
- `-X PUT` and `-X DELETE` select those methods.

## Lab 1 — Bootstrap a User service

**Folder:** `prac1/lab1/user-serivce/`

**Concepts:** Express server, environment variables, health endpoint, JSON parsing, basic user routes, and request logging.

### Important: starter-code defects to fix

The current `app.js` contains multiple errors that prevent the intended API from working. Before testing the user routes, identify and fix these:

| Current issue | Intended correction |
|---|---|
| `app.use(express.json)` | Call the middleware factory: `app.use(express.json())` |
| Health endpoint uses `new Data()` | Use `new Date().toISOString()` |
| Array declared as `user`, later referenced as `users` | Use one name consistently, e.g. `const users = []` |
| `new Date().toISOString` is not called | Use `new Date().toISOString()` |
| `user.push(userUser)` references the wrong names | Use `users.push(newUser)` |
| Logger is registered after routes that send responses | Register the logger before routes |

For middleware order, the usual pattern is: load configuration, create app, register JSON parsing and logging, register routes, register error/404 handling, then listen. The app should not rely on a logger registered after a route has already completed its response.

The `.env` file provides `PORT` and `SERVICE_NAME`; do not copy secret values into notes or command history. If the file is absent, use defaults in the app or create local settings with no real credentials.

### Run

```bash
cd prac1/lab1/user-serivce
npm install
node app.js
```

Check the health endpoint in a second terminal:

```bash
curl -i http://localhost:3000/health
```

Expected after the code defects are fixed: HTTP `200` and JSON containing status `UP`, uptime, and an ISO timestamp. Test user listing:

```bash
curl -i http://localhost:3000/api/users
```

Create a user:

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ari Tan","email":"ari@example.com"}'
```

Expected: HTTP `201` and the created user, including an ID and creation timestamp. Check required-field validation:

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ari Tan"}'
```

Expected: HTTP `400` with an error indicating both name and email are required. The sample array is in memory; created records disappear when the process restarts.

### What to explain in an exam

- `express.json()` parses a JSON request body and populates `req.body`; it must run before routes that read JSON.
- `process.env.PORT` and `process.env.SERVICE_NAME` are environment configuration.
- A health endpoint supports basic liveness checks; production systems may distinguish liveness from readiness.
- The in-memory array is not durable, shared, or suitable for multiple instances.
- Middleware order matters: a logger placed before routes can observe the requests handled by those routes.

## Lab 2 — REST API and API-key security

**Folder:** `prac1/lab2/product-service/`

**Concepts:** REST endpoints, JSON, validation, status codes, environment configuration, and API-key middleware.

### Current endpoints

| Method | Path | Purpose | Expected result |
|---|---|---|---|
| `GET` | `/health` | Health/status and service name | `200` |
| `GET` | `/api/products` | List products | `200` with array |
| `GET` | `/api/products/:id` | Find one product | `200`, or `404` |
| `POST` | `/api/products` | Create product; requires `x-api-key` | `201`, `400`, or `403` |

Only product creation is protected by the API-key middleware in this example; the GET routes are public. Do not describe this as complete production authentication.

### Run and smoke-test

```bash
cd prac1/lab2/product-service
npm install
node app.js
```

Use the port configured in the local `.env` file; the app’s fallback is `3001`.

```bash
curl -i http://localhost:3001/health
curl -i http://localhost:3001/api/products
curl -i http://localhost:3001/api/products/1
curl -i http://localhost:3001/api/products/999
```

Expected: health and existing product return `200`; an unknown product returns `404`.

### Test API-key protection

Send a create request without a key; expect `403`:

```bash
curl -i -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk Lamp","price":35.5,"category":"Home"}'
```

For a successful local test, enter the value of your own local `API_SECRET` without printing it:

```bash
read -rsp 'Enter local API_SECRET: ' PRODUCT_API_KEY
printf '\n'
curl -i -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $PRODUCT_API_KEY" \
  -d '{"name":"Desk Lamp","price":35.5,"category":"Home"}'
```

Expected with the correct key: HTTP `201`. A missing or incorrect key returns `403`. Do not put an actual key in this README or commit it.

### Test validation

With the correct API key, test a missing field:

```bash
curl -i -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $PRODUCT_API_KEY" \
  -d '{"name":"Desk Lamp"}'
```

Expected: HTTP `400`. Test a non-positive or non-numeric price:

```bash
curl -i -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $PRODUCT_API_KEY" \
  -d '{"name":"Desk Lamp","price":-1}'
```

Expected: HTTP `400`, because the handler requires a positive numeric price. The `PRODUCT_API_KEY` variable remains set for these commands; remove it from the shell when finished:

```bash
unset PRODUCT_API_KEY
```

### Security and design notes

- The API key is read from `process.env.API_SECRET`; the secret should never be hard-coded or returned in an error.
- The lab’s existing `prac1/lab2/product-service/.env` is tracked by Git. If `API_SECRET` is a real or reused credential, treat it as exposed: rotate it and move local secrets out of tracked files. Use an ignored `.env` and a sanitized `.env.example` for documentation.
- A static API key is a teaching example, not a complete user-authentication system. Production requires secure transport, key rotation, authorization, rate limiting, secret management, and careful logging.
- Products are held in memory and IDs use array length; this is only demonstration storage and can produce ID collisions after deletion/restart.

## Lab 3 — REST routes, middleware, and observability

**Folder:** `prac1/lab3/`

**Concepts:** Separating routes from app setup, request middleware, request IDs, response headers, error handling, and CRUD status codes.

### Project layout

```text
prac1/lab3/
├── app.js
├── middleware/
│   ├── errorHandler.js
│   └── logger.js
├── product-service/
│   └── config/
│       └── database.js
└── routes/
    └── products.js
```

`app.js` mounts the product router at `/api/products` and installs the request logger. The `database.js` and `errorHandler.js` files are currently empty; the routes use an in-memory array, and the error handler is currently inline in `app.js`.

### Run

```bash
cd prac1/lab3
npm install
node app.js
```

The default port is `3000`.

### Test CRUD routes

List products and get an existing product:

```bash
curl -i http://localhost:3000/api/products
curl -i http://localhost:3000/api/products/1
```

Expected: HTTP `200`. The response headers should include an `X-Request-ID` UUID generated by the logger.

Get a missing product; expect `404`:

```bash
curl -i http://localhost:3000/api/products/999
```

Create a product; expect `201`:

```bash
curl -i -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Notebook","price":4.5,"category":"Stationery"}'
```

Update product `1`; expect `200` and the updated object:

```bash
curl -i -X PUT http://localhost:3000/api/products/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Product","price":12.5,"category":"Office"}'
```

Delete product `1`; expect `204` with no response body:

```bash
curl -i -X DELETE http://localhost:3000/api/products/1
```

Then confirm it is gone; expect `404`:

```bash
curl -i http://localhost:3000/api/products/1
```

### Test request logging and errors

For every request, inspect the server terminal for a line with a generated request ID, method, and URL. Inspect the response headers:

```bash
curl -i http://localhost:3000/api/products
```

The response should include `X-Request-ID`. The ID can be used to connect a client request with a server log entry. Try invalid JSON or a missing required field to see how Express and the route respond. The current error middleware returns a generic `500` for unhandled errors; production logging should avoid exposing secrets or sensitive request data.

### What to explain in an exam

- Middleware runs in registration order. `express.json()` must run before the route reads `req.body`; the logger is mounted before the router.
- `app.use('/api/products', productRoutes)` mounts the router, so the router’s `/` becomes `/api/products`.
- `X-Request-ID` is correlation metadata. A request ID alone is not full distributed tracing; it must be propagated to downstream services and paired with trace data to map a distributed call path.
- `200` means success with a response; `201` means a resource was created; `204` means success without a response body; `400` means invalid input; `404` means not found; `500` means an unexpected server failure.
- The error-handler file and database config file are empty; do not claim Lab 3 currently uses a database or a shared error handler.
- The PUT handler requires name, price, and category and rejects negative/non-numeric prices. The POST handler is less strict, so know the difference if asked to test validation.

## Troubleshooting

| Symptom | Likely cause | What to check |
|---|---|---|
| `Cannot find module 'express'` or `dotenv` | Dependencies were not installed in that lab | `cd` into the lab folder and run `npm install` |
| `EADDRINUSE` | Another service is using the port | Stop the other server with `Ctrl+C` or set `PORT` to a free port |
| `curl: connection refused` | Server is not running or URL/port is wrong | Check the terminal, startup output, and `.env` port |
| `req.body` is undefined | JSON parser missing, not invoked, or registered after routes | Use `app.use(express.json())` before route handlers; send `Content-Type: application/json` |
| Lab 1 health request returns an error | `Data` typo in starter code | Replace with `Date` and call `.toISOString()` |
| Lab 1 user endpoint throws `users is not defined` | Starter code declares `user` but uses `users` | Rename consistently and fix `userUser` to `newUser` |
| Lab 2 POST returns `403` | Missing/wrong `x-api-key` | Use the local `API_SECRET`; do not print or commit it |
| Lab 3 returns `404` for `/health` | Lab 3 does not define a health route | Test `/api/products` instead |
| Request seems to hang | Incorrect middleware signature or no response/`next()` | Check that middleware is invoked correctly and every branch ends a response or calls `next()` |
| Changes disappear after restart | Sample data is stored in memory | This is expected; no persistent database is implemented |
| `npm start` or `npm test` fails | Scripts are placeholders/not defined | Run `node app.js` from the lab directory |

# Final exam checklist

## Theory

- [ ] Define cloud-native and microservices and explain their relationship.
- [ ] Name and explain all seven cloud-native principles.
- [ ] Compare monoliths and microservices without claiming either is always superior.
- [ ] Explain all twelve Twelve-Factor practices and the reason for at least three.
- [ ] Describe bounded contexts, database-per-service ownership, and polyglot persistence.
- [ ] Choose synchronous or asynchronous communication and explain the consistency/failure trade-off.
- [ ] Explain CQRS, Event Sourcing, and Sagas—and distinguish their purposes.
- [ ] Explain Circuit Breaker states, Bulkheads, API Gateways, Aggregators, and Sidecars.
- [ ] Explain Strangler Fig, ACL, and the risks of shared-database or dual-write migrations.
- [ ] For any chosen pattern, state a benefit, a cost, and a failure mode.

## Practical

- [ ] Check Node/npm versions and install dependencies in the correct lab folder.
- [ ] Start the service using `node app.js` and identify its configured port.
- [ ] Test health/list/get routes with `curl -i`.
- [ ] Send valid and invalid JSON with the correct `Content-Type`.
- [ ] Test `201`, `400`, `403`, `404`, and `204` behavior where applicable.
- [ ] Explain middleware order, `req.body`, route mounting, and `next()`.
- [ ] Verify Lab 3’s `X-Request-ID` header and correlate it with the console log.
- [ ] Identify Lab 1’s starter defects before claiming its endpoints work.
- [ ] State clearly that the sample arrays are in-memory and that Lab 3’s database file is empty.
- [ ] Keep API keys out of code, screenshots, command history, and Git.

## Related chapter notes

- [Chapter 1 — Foundations and architecture comparison](theory/chap1.md)
- [Chapter 2 — Core design principles](theory/chap2.md)
- [Chapter 3 — Design patterns and migration](theory/chap3.md)
