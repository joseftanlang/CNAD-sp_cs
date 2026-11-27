# ET0745 Chapter 2: Core Design Principles

> **Exam focus:** Explain why the Twelve-Factor App practices exist, apply microservice design principles to an architecture, and justify the trade-offs.

## 1. The Twelve-Factor App

The Twelve-Factor App is a language-agnostic methodology for building portable, cloud-ready applications. The factors support reliable deployment, scaling, and operations across development, test, and production environments.

### Code, dependencies, and configuration

1. **Codebase — one tracked codebase, many deployments.** Keep application source in version control and deploy it to development, staging, and production. A microservice should be independently buildable and deployable; teams may use separate repositories or a monorepo, provided service boundaries remain clear.
2. **Dependencies — declare and isolate them.** Specify required packages in a manifest such as `package.json` or `requirements.txt`. Do not rely on software that happens to be installed globally on a machine.
3. **Config — keep environment-specific settings out of code.** Supply database URLs, ports, and other settings through environment configuration. Store secrets in a managed secret store, not in source control. The same build can then run in different environments by changing its configuration, not its code.

### Services and release pipeline

4. **Backing services — treat attached services as resources.** Databases, caches, queues, and external APIs are accessed through configuration. Replacing a local database with a managed database should not require application logic to change.
5. **Build, release, run — keep the stages separate.**
   - **Build:** turn source code and declared dependencies into an executable artifact.
   - **Release:** combine that artifact with environment configuration; identify each release uniquely and do not modify it after creation.
   - **Run:** execute a release as one or more processes.

### Execution and scaling

6. **Processes — keep application processes stateless.** Do not rely on local memory or a local filesystem for durable state or user sessions. Store durable data in backing services so a process can be restarted or replaced safely.
7. **Port binding — let the application serve its own interface.** The app exposes a network service by listening on a configured port, rather than depending on a web server being injected into its runtime. In containers, it commonly listens on `0.0.0.0` so the container network can reach it.
8. **Concurrency — scale by running more processes.** Run separate process types for distinct workloads when appropriate (for example, HTTP workers and background workers). Add instances to handle more demand; do not assume that a single larger machine is the only scaling option.

### Operations and robustness

9. **Disposability — start quickly and stop gracefully.** Processes should be easy to start, replace, and shut down. Finish or safely abandon in-flight work during shutdown so crashes and scaling events do not corrupt state.
10. **Dev/prod parity — reduce environment differences.** Keep development, testing, and production environments similar in tools, services, and deployment process. Smaller differences mean fewer “works on my machine” failures.
11. **Logs — emit event streams.** Write logs to standard output/error. Let the platform collect, route, and retain them centrally instead of having each application manage log files and rotation.
12. **Admin processes — use the same release environment.** Run one-off tasks such as migrations and maintenance scripts using the same code, dependencies, and configuration model as the application.

**Memory aid:** codebase, dependencies, config; backing services, build/release/run; processes, port binding, concurrency; disposability, parity, logs, admin processes.

## 2. Microservice Design Principles

Microservices organize a system as small, cohesive services that can be changed and deployed independently. Independence is the goal; splitting an application into many networked components also introduces operational and data-consistency costs.

### The 12 principles

1. **Organize around business capabilities.** Model services around business responsibilities such as Catalog, Orders, Billing, or Shipping—not technical layers such as “database service” and “UI service.” This aligns service boundaries with how the business changes.
2. **Use bounded contexts and high cohesion.** In Domain-Driven Design (DDD), a bounded context defines where a domain model and its terms have a consistent meaning. “Customer,” for example, may represent different data in Sales and Support. Keep closely related rules together and minimize dependencies between contexts.
3. **Give services independent ownership and governance.** Teams should be able to make appropriate implementation choices and deliver changes without coordinating every release with every other team. Shared standards can help, but should not force all services into one technology or release cycle.
4. **Keep service data private.** Each service owns its data and exposes it through an API or events; other services should not query its tables directly. This avoids schema-level coupling and allows a service to select a suitable persistence technology (**polyglot persistence**). “Database per service” means ownership and access boundaries; it does not necessarily require a separate physical database server for every service.
5. **Choose communication deliberately.** Synchronous HTTP/REST or gRPC is useful when a caller needs an immediate response, but it couples availability and latency: the caller waits for the callee. Asynchronous messaging is useful for workflows that can complete later and reduces direct runtime coupling, but requires handling delayed delivery, duplicates, and eventual consistency.
6. **Use events for decoupled workflows where appropriate.** A producer publishes a fact such as `OrderPlaced`; interested services consume it independently. Brokers such as Kafka or RabbitMQ can buffer work and help absorb traffic spikes. Events should describe meaningful business facts, not expose another service’s internal database structure.
7. **Design for failure.** Network calls can time out and services can become unavailable. Set timeouts, use bounded retries with backoff where safe, and apply a **circuit breaker** to stop repeatedly calling a failing dependency. Resilience patterns limit the impact of failure; they do not make a failing dependency healthy.
8. **Make retried operations safe.** An **idempotent** operation can be repeated without causing the intended effect more than once. This matters when a client cannot tell whether a timed-out request succeeded. For example, payment creation can accept an idempotency key and return the existing result for a duplicate request rather than charging again.
9. **Coordinate cross-service work with a Saga.** A distributed business transaction is a sequence of local transactions, each committed by its owning service. If a later step fails, a **compensating transaction** attempts to counteract earlier work (for example, release a reservation); it is not necessarily a literal rollback.
   - **Choreography:** services react to events without a central controller. It suits short, simple flows but can make a long workflow hard to follow.
   - **Orchestration:** a workflow coordinator directs the steps and tracks outcomes. It improves visibility for complex flows, but adds a component that must be operated and kept reliable.
   - Traditional **two-phase commit (2PC)** coordinates a distributed commit by holding resources while participants decide. Across independent services this can reduce availability and increase coupling, so Sagas are often preferred for long-running business workflows.
10. **Use discovery and gateways for network access.** **Service discovery** lets services locate changing instances without hard-coding container addresses. An **API gateway** can provide an external entry point for routing, authentication, rate limiting, and TLS termination. A gateway should not become a home for all business logic.
11. **Observe the whole request path.** Collect structured logs, metrics, and **distributed traces**. Propagate a correlation or trace ID across service boundaries so operators can connect related work and locate latency or errors. Logs alone rarely explain the full path of a distributed request.
12. **Automate delivery and evolve safely.** Automate build, test, and deployment so services can be released independently. Use staged rollout strategies such as **blue-green** (switch traffic between two environments) or **canary** (send a small share of traffic to a new version first), with monitoring and a rollback plan. A **service mesh** with sidecar proxies can centralize network features such as mTLS, traffic policy, and telemetry, but adds infrastructure and operational complexity.

## 3. Key Trade-offs to Explain in an Exam

| Choice | Benefits | Costs / risks |
|---|---|---|
| Synchronous request/response | Immediate answer; straightforward for interactive requests | Caller depends on callee availability and latency; failures can cascade |
| Asynchronous messaging | Buffering, looser runtime coupling, useful for long-running work | Delayed results, duplicate delivery, more complex tracing, eventual consistency |
| Saga choreography | No central workflow controller; services react independently | Workflow state and failure paths can be difficult to see as the flow grows |
| Saga orchestration | Central visibility and explicit workflow control | Coordinator adds a dependency and must be maintained |
| CQRS | Read and write models can be optimized and scaled separately | More components and synchronization; read models may be stale |
| Database per service | Clear ownership, independent schema evolution, technology choice | Cross-service queries and transactions need APIs, events, or projections |

### CQRS in brief

**Command Query Responsibility Segregation (CQRS)** separates the model used to change data (commands/writes) from the model used to read it (queries). A query model may be denormalized and updated from events emitted by the write side. This can improve read performance and allow independent scaling, but adds synchronization work and often means a query briefly returns stale data. CQRS is useful when read and write needs differ; it is not automatically needed in every service and does not guarantee unlimited scaling.

### Quick scenario method

For an architecture question:

1. Identify the business capabilities and define service ownership.
2. State which service owns each piece of data.
3. Choose synchronous calls for immediate answers and events for decoupled work; explain why.
4. Describe failure handling, retries, and idempotency.
5. Explain how multi-service workflows recover (often with a Saga).
6. Include observability, deployment, and the consistency trade-offs.

## 4. Live Application: Applying the Principles to the Lab Product API

The repository’s lab examples include an Express product API with list, read, create, update, and delete routes. The Lab 2 example stores products in an in-memory array and reads settings such as the port and API secret from environment variables; the Lab 3 example separates product routes and request logging from the server entry point. This is a useful starting point for applying the chapter, but the in-memory array is a demonstration—not durable or shared storage for a production service.

### Example: an online shop

Imagine extending the product API into an online shop with **Catalog**, **Order**, **Inventory**, and **Payment** services.

1. **Set boundaries by capability.** Catalog owns product descriptions and prices; Inventory owns stock; Order owns order status; Payment owns payment records. Catalog and Inventory are not split into generic “API” and “database” services.
2. **Protect data ownership.** The Order service does not SQL-join Catalog or Inventory tables. It asks for the information it needs through an API or consumes events. Each service can change its schema without silently breaking another service.
3. **Use configuration and declared dependencies.** Keep the Express app’s port and service credentials outside source code. Declare Express and other packages in the service manifest. Use separate environment configuration and secret storage in deployed environments.
4. **Keep the service replaceable.** Replace the product array with persistent storage behind Catalog’s own service boundary. Keep request handling stateless: a new process should be able to serve a request without relying on data held by a previous process.
5. **Choose the interaction per step.** A product detail page may call Catalog synchronously because it needs product data now. After checkout, Order can publish `OrderPlaced` so Inventory and Payment can process their work without keeping the customer’s HTTP request open for the entire workflow.
6. **Handle checkout as a Saga.** Order records the request, Inventory reserves stock, and Payment attempts authorization. If payment fails, the workflow can release the stock reservation and mark the order as failed. Use orchestration if the flow needs centralized tracking; a simple event-driven flow may use choreography.
7. **Protect against retries and outages.** Give checkout/payment requests an idempotency key so a retry does not create a second order or charge. Use timeouts and a circuit breaker for unavailable dependencies; do not retry an unsafe operation blindly.
8. **Make the request traceable.** Have the gateway assign or accept a trace ID and pass it through Order, Inventory, and Payment. Central logs, metrics, and traces help identify whether checkout failed at stock reservation, payment, or another step.
9. **Release safely.** Build and test the Catalog service independently, then deploy it with a canary or blue-green rollout. Keep logs flowing to the platform, handle graceful shutdown, and run any schema migration with the same release’s dependencies and configuration.

**What the lab demonstrates today:** Express routes, basic request validation, an API-key check on product creation, environment-based settings, and route/logging separation in the later example. **What a production design would still need:** durable service-owned storage, authenticated service-to-service communication, robust validation and error handling, idempotency, deployment automation, and operational observability. This distinction helps apply the theory accurately without claiming the lab already implements every production pattern.
