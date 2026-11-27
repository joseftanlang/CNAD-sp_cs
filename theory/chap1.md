# ET0745 Chapter 1: Introduction to Cloud Native and Microservices

> **Exam focus:** Define cloud-native and microservices, explain the seven core cloud-native principles, compare monoliths with microservices, and evaluate the real-world benefits and costs.

## 1. Foundational Definitions

### What is cloud-native?

**Cloud-native** is an approach to building and operating software that uses automation, elastic infrastructure, and resilient design to deliver applications reliably and frequently. Cloud-native applications are often composed of independently deployable services, but cloud-native is broader than microservices: architecture should suit the problem and the team.

Cloud-native systems can run in public, private, hybrid, or multicloud environments. Common technologies and practices include:

- **Containers:** Package an application and its runtime requirements into a portable unit.
- **Orchestration:** Schedule and manage containers, including deployment, scaling, networking, and health checks.
- **Declarative APIs and infrastructure as code:** Describe the desired infrastructure state so it can be provisioned consistently and reviewed.
- **Immutable infrastructure:** Replace an instance or image to make a change rather than modifying a running instance by hand.
- **Service meshes:** An optional infrastructure layer for service-to-service traffic, security, and telemetry.

### What are microservices?

**Microservices** are an architectural style in which an application is divided into small, cohesive services organized around business capabilities. Each service runs as an independent process, owns its behavior and data boundary, and communicates with other services over a network.

Common characteristics:

- **Independent deployability:** A service can be changed and released without rebuilding the entire application, assuming its interfaces remain compatible.
- **Business-aligned boundaries:** Services represent capabilities such as Catalog, Orders, or Billing, rather than technical layers.
- **Decentralized data ownership:** A service controls its data and exposes it through interfaces or events. Other services should not depend directly on its internal tables.
- **Network communication:** Services use protocols such as HTTP/REST, gRPC, or asynchronous messaging.

### How cloud-native and microservices relate

Microservices describe an **architectural style**; cloud-native describes a broader **way to build, deploy, and operate software**. Microservices can benefit from cloud-native capabilities such as automated deployment, elastic scaling, and orchestration. However, microservices also add network, data, and operational complexity, so they are not automatically the best choice for every application.

## 2. The Seven Core Principles of Cloud-Native Applications

### 1. Microservices-centric architecture

Decompose the system into **loosely coupled, highly cohesive** services around business capabilities. Teams can own and deliver their services with more autonomy. Different services may use different languages or databases (**polyglot architecture**) when there is a good reason, but every additional technology increases the skills and operations burden.

### 2. Containerization and orchestration

- **Containers** package the application and its runtime so it behaves consistently across environments.
- **Immutable images** are replaced with new versions rather than patched in place, improving repeatability and rollback.
- **Orchestrators** such as Kubernetes automate deployment, scheduling, scaling, networking, and health checks.

Orchestration can restart or replace unhealthy instances when configured with appropriate health checks. It cannot automatically fix faulty application logic or guarantee that the whole service is healthy.

### 3. Stateless processes and elasticity

Application instances should not keep durable user or business state in local memory or on local disk. Store durable state in a database or another backing service. Stateless instances can then be added, removed, or replaced more easily, enabling **horizontal scaling** and reducing dependence on a particular instance.

### 4. Automation and DevOps

- **Continuous Integration (CI):** Frequently integrate changes and run automated builds and tests.
- **Continuous Delivery/Deployment (CD):** Automate packaging and release steps; delivery keeps changes ready to deploy, while deployment may release them automatically.
- **Infrastructure as Code (IaC):** Define and provision infrastructure declaratively using tools such as Terraform.

Automation reduces manual errors and makes releases repeatable. It does not replace testing, review, monitoring, or rollback planning.

### 5. Resilience and self-healing

Assume that processes, machines, and network dependencies can fail. Design the system to limit the effect of those failures and recover safely.

- **Load balancing:** Distribute requests across healthy instances.
- **Circuit breaking:** Temporarily stop calls to a failing dependency to avoid repeated futile requests and cascading failure.
- **Rate limiting:** Bound request volume to protect a service from overload.
- **Health checks and restart policies:** Let an orchestrator replace instances that fail configured checks.

These patterns improve fault tolerance but do not eliminate failures; applications still need sensible timeouts, safe retries, and clear error handling.

### 6. Observability

**Observability** is the ability to understand a system’s internal behavior from its external outputs. In a distributed system, operators need to connect events across services.

- **Logs:** Records of events, ideally structured and centrally collected.
- **Metrics:** Numeric measurements over time, such as request rate, error rate, latency, CPU, and memory.
- **Distributed traces:** Show how a request travels through multiple services and where time or errors accumulate.

These signals complement one another. For example, a metric may reveal rising latency, a trace can identify the slow service, and logs can provide details about the failing request.

### 7. Twelve-Factor App practices

The Twelve-Factor App is a set of practices for building portable, deployable applications. Chapter 2 covers all twelve factors in detail. Key examples include:

- **Codebase:** Track an application in version control and deploy it to multiple environments.
- **Dependencies:** Declare and isolate dependencies rather than relying on globally installed packages.
- **Config:** Keep environment-specific configuration and secrets out of source code.
- **Backing services:** Treat databases, caches, and queues as attached, replaceable resources.
- **Processes:** Keep application processes stateless and externalize durable state.
- **Disposability:** Support fast startup and graceful shutdown.
- **Logs:** Emit event streams for the platform to collect.

## 3. Monolithic vs. Microservices Architecture

| Feature | Monolithic architecture | Microservices architecture |
|---|---|---|
| **Structure** | Most application capabilities are packaged and run as one deployable unit. | Capabilities are split across independently running services. |
| **Deployment** | A change often requires deploying the whole application, even if only one area changed. | A service can be released independently when its interfaces and dependencies allow it. |
| **Data** | Often uses one database, though internal module boundaries are still possible. | Services own their data boundaries; cross-service access uses APIs or events rather than direct table access. |
| **Communication** | Components often call one another in-process. | Services communicate over a network, introducing latency and partial failure. |
| **Scaling** | Scale the application as a whole or use internal techniques supported by its design. | Scale the services experiencing demand, if they are independently deployable and stateless. |
| **Technology** | Usually shares a runtime and technology stack. | Services may choose different technologies, with extra integration and operational costs. |
| **Failure impact** | A process failure can affect the whole deployed application; well-modularized monoliths may still isolate many logic errors. | Service boundaries can limit some failures, but dependencies and shared infrastructure can still cause cascading outages. |

Neither architecture is universally superior. A well-structured monolith can be simpler and faster to develop for a small team or domain. Microservices are most useful when independent scaling, ownership, or release cadence justifies their distributed-systems costs.

## 4. Advantages of Microservices

1. **Independent delivery:** Teams can release a service without coordinating a whole-application deployment.
2. **Targeted scaling:** Add capacity to a high-demand capability rather than scaling every part equally.
3. **Fault containment:** A failure may be limited to a service boundary if dependencies and failure handling are designed well.
4. **Technology choice:** Teams can select technologies suited to a service, while accepting the cost of supporting them.
5. **Focused code and ownership:** Smaller service boundaries can be easier for a team to understand and maintain.
6. **Organizational autonomy:** Service ownership can align teams with business capabilities and reduce release coordination.

These are potential benefits, not guarantees. They depend on sound boundaries, automation, and operational maturity.

## 5. Challenges and Trade-offs

> **Exam point:** Microservices do not remove complexity; they move much of it from in-process code into the network, data coordination, and operations.

### System and operational complexity

- **Network latency and partial failure:** A remote call is slower and less reliable than an in-process call. One user request may depend on several services.
- **Operational overhead:** Many independently deployed services require robust CI/CD, monitoring, infrastructure, and on-call practices.
- **Debugging:** A failure may involve several services, so teams need correlated logs, metrics, and distributed tracing.

### Data and security complexity

- **Distributed data:** A transaction that spans multiple service-owned databases cannot generally use one local ACID transaction. Patterns such as Sagas coordinate local work and compensating actions.
- **Consistency:** Asynchronous updates may be eventually consistent, so different views of the system can briefly disagree.
- **Security surface:** More APIs and network boundaries require authentication, authorization, encryption, and secure configuration at each relevant boundary.
- **Technology diversity:** Polyglot choices can improve fit but increase training, tooling, and maintenance costs.

## 6. Live Application: Applying Chapter 1 to the Lab Product API

The lab’s Express product API is a small example of a service boundary. It exposes routes for reading and changing products, reads settings such as the port and API secret from environment variables, and uses an in-memory array as sample data. The later lab separates product routes and request logging from the server entry point.

### Applying the cloud-native ideas

1. **Define the business capability.** Treat product catalog behavior as the responsibility of a Catalog service. Keep product rules and data ownership together rather than splitting routes, business logic, and storage into unrelated network services.
2. **Package and configure consistently.** Declare Express and other packages in the service manifest. Supply the port and secrets through the environment or a secret manager, not hard-coded values or committed credentials.
3. **Make the service stateless and replaceable.** The current in-memory array disappears when the process restarts and is not shared between instances. A real Catalog service would persist products in storage it owns, allowing any healthy instance to serve a request.
4. **Run multiple instances safely.** Put instances behind a load balancer or orchestrator and use health checks. Since all instances should use the same persistent backing service, adding or replacing an instance should not lose product data.
5. **Automate delivery.** Build, test, and package the service through CI/CD. Deploy a new image rather than changing a running container, and use a staged rollout with monitoring and a rollback path.
6. **Observe requests.** Collect the existing request logs centrally; add metrics for request rate, errors, and latency. If another service calls Catalog, propagate a trace or correlation ID to follow the request across both services.
7. **Design dependencies deliberately.** If an Order service needs product details, it may call Catalog for current information or consume a Catalog event to maintain its own read view. It should not directly query Catalog’s database.

**What the lab illustrates:** a small HTTP service, environment-based settings, route organization, and basic request logging. **What it does not yet demonstrate:** durable product storage, container orchestration, automated delivery, distributed tracing, or multiple independently deployed services. These are natural next steps for evolving the lab toward a cloud-native system, not features to assume are already implemented.
