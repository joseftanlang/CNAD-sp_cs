# ET0745 Chapter 3: Design Patterns in Microservices

> **Exam focus:** Identify the five pattern categories, choose a pattern for a scenario and justify its trade-offs, and explain a safe migration from a monolith.

## 1. What Are Microservices Design Patterns?

Design patterns are reusable architectural approaches to recurring problems. They are not copy-and-paste code: a pattern describes a structure or strategy, and the team adapts it to the system’s constraints.

| Category | Main question |
|---|---|
| **Decomposition** | How should the system be split into services? |
| **Integration** | How should services communicate and route requests? |
| **Data management** | How is data owned, queried, and coordinated? |
| **Observability** | How can teams understand behavior across services? |
| **Cross-cutting** | How should concerns such as resilience and security be applied across services? |

Migration patterns are also important: they help apply decomposition and integration incrementally while a monolith and new services coexist.

## 2. Decomposition Patterns

Decomposition is about finding boundaries with strong internal cohesion and minimal dependencies across services. Splitting by technical layer (for example, putting every database operation in one service) often creates tightly coupled services rather than useful business boundaries.

### By business capability

Organize services around business functions such as Sales, Inventory, or Payments. A service boundary should own the behavior and data needed for its capability. This can let teams release and scale parts of the system independently, provided those parts are not tightly coupled at runtime.

### By DDD subdomain

**Domain-Driven Design (DDD)** helps identify the business model and its boundaries:

- **Core subdomain:** The capability that differentiates the business; typically deserves focused investment.
- **Supporting subdomain:** Necessary to the business but not its main differentiator; build or adapt it as appropriate.
- **Generic subdomain:** Common functionality that may be available as a commodity or third-party product.

What counts as core, supporting, or generic depends on the business. Payment or authentication can be generic in one context and a core capability in another.

A **bounded context** is a boundary within which a domain model and its terms have a consistent meaning. For example, “Customer” may refer to a buyer in Sales and a person receiving help in Support. Separate contexts can use different models and integrate through explicit contracts.

## 3. Integration Patterns

### API Gateway

An API gateway is an entry point for external clients. It can route requests to internal services and centralize cross-cutting edge concerns such as TLS termination, authentication, and rate limiting.

- **Useful when:** Clients should not need to know internal service addresses or call many internal endpoints directly.
- **Trade-offs:** It adds a hop and can become a bottleneck or failure point if poorly designed. Run it with sufficient capacity and high availability. Avoid placing all business logic in the gateway.

### API Aggregator

An aggregator gathers data from multiple services and returns a response shaped for a client. For example, a mobile screen might need product, inventory, and delivery information.

- **Useful when:** A client would otherwise make several requests or combine several responses itself.
- **Trade-offs:** Parallel calls can reduce wait time, but the aggregator depends on its downstream services. It must handle timeouts, partial results, and response size. It also adds a service to maintain.

### Asynchronous messaging (publish/subscribe)

A producer publishes a message or business event to a broker; consumers process it independently. This is useful for background work, such as starting video encoding after upload or sending an `OrderPlaced` event after checkout.

- **Benefits:** Producer and consumer do not need to be available at the same time; a broker can buffer work and help absorb traffic spikes.
- **Trade-offs:** The producer and consumer still depend on agreed message contracts and delivery semantics. Consumers must account for delayed or duplicate messages, failures, and eventual consistency. “Fire and forget” does not mean delivery or successful processing is guaranteed.

### Branch and chained calls

- **Branch (parallel):** A service calls independent downstream services at the same time. Total wait time is approximately the slowest call, plus coordination overhead, if all results are required.
- **Chained (sequential):** Service A calls B, which calls C. Latency and failure dependencies accumulate along the chain.

Keep synchronous chains short where possible. If a chain becomes long-running, consider whether asynchronous messaging or a workflow pattern fits better.

## 4. Data Management Patterns

### Database per service

Each service owns its data and controls access to it. Other services use an API, events, or a read projection rather than querying its tables directly.

- **Why:** Direct database sharing creates schema and deployment coupling.
- **Polyglot persistence:** Different services may choose different storage technologies when the data and access patterns justify it (for example, relational storage for transactional records or Redis for cache data).
- **Clarification:** Ownership is the key boundary; it does not always require a separate physical database server for every service.

### CQRS (Command Query Responsibility Segregation)

CQRS separates the model used to change data from the model used to read it:

- **Command side:** Handles writes and business rules, often using transactional consistency.
- **Query side:** Provides read-optimized views, which may be denormalized and updated from events.

CQRS can help when read and write patterns differ substantially. It adds synchronization and operational complexity, and the read view may be stale. It is not required for every service and does not guarantee unlimited scaling.

### Event sourcing

Event sourcing stores state changes as an ordered, append-only sequence of events instead of persisting only the latest state. Current state can be reconstructed by replaying events, and the event history can support audit or temporal queries.

- **Useful when:** The history of changes is important, such as in some financial or compliance domains.
- **Trade-offs:** Event schemas must evolve carefully; replay and projections add complexity; storage and operations are more involved. An append-only event log is not automatically tamper-proof—access control, integrity checks, and retention policies still matter.

Event sourcing is different from ordinary event-driven messaging. A system can publish events without using those events as its source of truth.

### Saga

A Saga coordinates a business operation across services as a sequence of local transactions. If a later step fails, **compensating transactions** attempt to counteract completed work—for example, releasing reserved stock after a payment failure. Compensation is not always a literal rollback.

- **Choreography:** Services react to each other’s events. It avoids a central controller and can work well for short, simple flows; complex workflows can be difficult to trace.
- **Orchestration:** A coordinator directs the steps and tracks outcomes. It improves visibility for complex flows but adds a component that must be operated and made reliable.

Compared with traditional two-phase commit, a Saga avoids holding distributed locks across a long-running workflow, but it accepts intermediate states and requires explicit failure and compensation handling.

## 5. Observability Patterns

Distributed requests cross process and network boundaries, so logs from a single service are often insufficient. Combine:

- **Centralized structured logs** for event details.
- **Metrics** for request volume, errors, latency, and resource use.
- **Distributed tracing** to follow a request across service boundaries.

Propagate trace or correlation IDs through HTTP requests and messages. Ensure logs and traces avoid exposing secrets or sensitive data. This category is an ongoing design concern, not just a monitoring tool installed after deployment.

## 6. Cross-Cutting Patterns

### Circuit breaker

A circuit breaker limits repeated calls to a dependency that is failing or too slow.

- **Closed:** Calls flow normally; failures are measured.
- **Open:** Calls fail fast or use a defined fallback rather than continuing to overload the dependency.
- **Half-open:** A limited number of probe calls test whether the dependency has recovered.

Fallbacks must be safe and meaningful; returning stale or incomplete data may be preferable to failure for some features, but not for operations such as charging a payment.

### Bulkhead

The bulkhead pattern isolates resource pools so that one workload cannot consume all capacity. For example, batch jobs can use a separate, bounded connection pool from interactive web requests. If batch work overloads its pool, customer-facing requests can retain their own resources.

### Sidecar and service mesh

A **sidecar** is a helper process or container deployed alongside an application instance, often in the same pod. A proxy sidecar can handle network-related tasks such as traffic policy, encryption, or telemetry.

A **service mesh** coordinates these proxies across services and can provide features such as mutual TLS (mTLS), traffic management, retries, and telemetry. A mesh can reduce duplicated networking code, but it introduces configuration, resource use, and operational complexity. It does not replace application-level business rules or safe retry behavior.

## 7. Migration Strategy: Monolith to Microservices

### Assess before splitting

Map business capabilities, bounded contexts, dependencies, and data ownership before choosing service boundaries. The **6 Rs** are a migration-planning aid:

- **Re-host:** Move the application with minimal changes.
- **Re-platform:** Make limited platform changes without redesigning the application.
- **Re-factor / re-architect:** Change the application to use a different architecture or capabilities.
- **Re-purchase:** Replace functionality with a product or SaaS offering.
- **Retire:** Remove functionality that is no longer needed.
- **Retain:** Keep functionality as it is for now.

Avoid extracting modules that are tightly coupled in behavior and data. A distributed monolith—many services that must be changed and deployed together—keeps much of the old coupling while adding network and operational costs.

### Strangler Fig

The Strangler Fig pattern replaces a monolith incrementally instead of relying on a risky “big bang” rewrite:

1. **Transform:** Build a new service for a clearly bounded capability.
2. **Coexist:** Route the relevant requests to the new service while remaining functionality continues to use the monolith.
3. **Eliminate:** After verifying behavior and data, remove the replaced functionality from the monolith.

An API gateway or routing layer can help direct traffic during coexistence. Monitor behavior and define rollback steps at each stage.

### Anti-Corruption Layer (ACL)

An ACL translates between a legacy system’s model or protocol and the cleaner model used by a new service. For example, it can map a legacy SOAP response into a new service’s domain model.

- **Benefit:** Keeps legacy naming, formats, and assumptions from spreading into the new service.
- **Trade-off:** Adds code and another place to test and operate; keep the translation boundary explicit.

### Decomposing the database

Moving application code while leaving all services dependent on one shared database does not complete the migration. Gradually assign data ownership to services and replace cross-boundary table access with APIs, events, or projections.

Some migrations use **dual writes** to keep old and new stores synchronized, but writing to both independently can leave them inconsistent if one write succeeds and the other fails. Treat dual writing as a controlled transition, with reconciliation, monitoring, and a rollback plan. Where suitable, use an outbox or change-data-capture approach to publish changes reliably; validate data before switching reads and retiring the old path.

## 8. Case Study: Netflix Migration

Netflix is a commonly discussed example of a gradual move from a large application and data center toward cloud-based, service-oriented architecture. The migration took years and involved changes to both architecture and operations; it was not a single pattern or quick rewrite.

- **Strangler-style migration:** Capabilities were moved incrementally while the existing system continued to operate.
- **Gateway and resilience examples:** Netflix Zuul is associated with edge routing, and Hystrix popularized circuit-breaker and isolation techniques in Netflix’s stack.
- **Important context:** Hystrix is now in maintenance mode, so it is best treated as a historical example of the pattern rather than an automatic choice for a new project.

The exam lesson is to connect a pattern to the problem it addresses, and explain the operational costs and failure modes it introduces.

## 9. Architect’s Decision Matrix

| Scenario | Pattern to consider | Trade-off to mention |
|---|---|---|
| Extracting a legacy capability incrementally | Strangler Fig | Temporary coexistence and routing complexity |
| Read and write workloads need different models | CQRS | Eventual consistency and synchronization work |
| A workflow spans several service-owned databases | Saga, often orchestrated for complex flows | Compensation logic and intermediate states |
| A downstream dependency is failing repeatedly | Circuit breaker | Fallback behavior must be safe; recovery still needs monitoring |
| External clients need one stable entry point | API Gateway | Added hop and potential bottleneck; deploy with high availability |
| A client needs data from several services | API Aggregator | Downstream latency and partial-failure handling |
| New code must be isolated from a legacy schema | Anti-Corruption Layer | Extra translation logic and testing |
| Complete state-change history is a requirement | Event Sourcing | Schema evolution, replay, projection, and storage complexity |
| Batch processing must not starve interactive traffic | Bulkhead | Reserved capacity can be underused and pools need tuning |

## 10. Live Application: Evolving the Lab Product API

The lab’s Express Product API exposes routes to read and modify products. Its sample data is held in an in-memory array, so it is useful for learning HTTP routes but is not durable or shared across multiple instances. Imagine evolving it into an online shop with Catalog, Inventory, Order, and Payment capabilities.

1. **Decompose by business capability.** Keep product data and product rules in Catalog. Inventory owns stock, while Order owns checkout state. Do not create a service per technical layer or let Order update Catalog’s tables directly.
2. **Use a gateway for external traffic.** A mobile or web client calls one public entry point, which routes product requests to Catalog and checkout requests to Order. Run the gateway redundantly and monitor its health so it does not become a single-instance failure point.
3. **Add aggregation only for a client need.** If a product page needs product details and stock availability, an aggregator can call Catalog and Inventory in parallel and shape the response. It should define what to return if one dependency times out.
4. **Use a Saga for checkout.** Order starts the workflow; Inventory reserves stock; Payment authorizes payment. If payment fails, release the reservation and mark the order appropriately. An orchestrator can track this sequence if the workflow needs explicit visibility; a short event-driven flow may use choreography.
5. **Choose messaging for decoupled work.** After an order is accepted, publish `OrderPlaced` for tasks such as email confirmation or analytics. Consumers should handle duplicate delivery safely and expose failures for retry or dead-letter handling.
6. **Protect dependencies.** Use timeouts, bounded retries for safe operations, circuit breakers, and bulkheads around constrained resources. Avoid retrying payment creation without an idempotency strategy.
7. **Migrate incrementally.** Put a routing layer in front of the existing product routes, move Catalog behavior behind the new service, verify reads and writes, then remove the replaced monolith code. Keep the legacy schema behind an ACL while it is still needed.
8. **Improve data ownership carefully.** Replace the sample array with persistent Catalog-owned storage. If moving existing product data, validate and reconcile it before switching reads; avoid unmonitored dual writes.
9. **Operate the result.** Propagate trace IDs across gateway, Order, Inventory, and Payment. Use logs, metrics, and traces to diagnose failures and latency across the workflow.

**Pattern selection is contextual:** the lab does not need a gateway, CQRS, event sourcing, or a service mesh just to serve a small product list. Add each pattern only when its problem exists and the team can operate the added complexity.
