# ET0745 Mock Assessment 2
## Cloud Native and Microservices

- **Assessment type:** Practical (Git, Node.js, Express, and curl) plus theory
- **Suggested practice time:** 2 hours 30 minutes
- **Total:** 100 marks
**Parts:** 5

- **Name:** ______________________________
- **Date:** ______________________________
**Lecturer sign-off:** ______________________________

> This is a practice paper, not an official exam. Try the questions before reading the model answers near the end.

## Candidate instructions and assumptions

- Use the exact folder and file capitalization in the exam starter. Linux paths are case-sensitive (`Service3` and `service3` are different names).
- The starter repository has a monolithic root `app.js` containing Service 1 and Service 2 routes. For this paper, example monolith endpoints are `GET /api/service1/users` and `GET /api/service2/products`.
- The starter also contains Service 1 and Service 2 folders with an `App.js` and route files. Inspect the repository; adjust example paths to the actual starter rather than creating duplicate files.
- The mock assumes the base branch is `main`. If it is named `master`, use `master` consistently.
- The final check starts the extracted services independently: Service 1 on port `3001`, Service 2 on `3002`, and Service 3 on `3003`. If your starter specifies other ports or route paths, use those instead.
- Never stage or push `.env`, API keys, `node_modules`, or generated files.

---

# Question Paper

## Part 1 — Repository Setup and Monolith Demonstration
**15 marks**

**Objective:** Create and clone your individual repository, run the supplied monolith, and demonstrate both services.

1. In GitHub, create a unique repository, for example `ET0745-CNAD-YourName`.
2. Connect to your assigned VM and clone the repository:

   ```bash
   git clone <your-repository-url>
   cd ET0745-CNAD-YourName
   ```

3. Inspect the working tree, branch, project files, and package scripts:

   ```bash
   git status
   git branch --show-current
   find . -maxdepth 4 -type f -not -path '*/node_modules/*' | sort
   ```

4. From the directory containing the monolith's `package.json` and `app.js`, install dependencies and start the application:

   ```bash
   npm install
   node app.js
   ```

5. In another terminal, test both services through the monolith:

   ```bash
   curl -i http://localhost:3000/api/service1/users
   curl -i http://localhost:3000/api/service2/products
   ```

   If the starter uses different paths or a different port, use the actual values.

6. Show the running application and successful responses to the lecturer and obtain a sign-off.

**Lecturer sign-off:** ______________________________

**Marking guide**

- Unique repository created and cloned into the VM: **4**
- Correct dependencies installed and monolith started: **4**
- Service 1 and Service 2 routes demonstrated: **5**
- Clear explanation and lecturer sign-off: **2**

## Part 2 — Service 2 Refactor and Unique Identifier Fix
**20 marks**

**Objective:** Create a bug-fix branch, identify an unsafe identifier generator in Service 2, fix it, test it, and push the branch.

1. Start from the base branch and check for uncommitted changes:

   ```bash
   git checkout main
   git status
   git checkout switch -c fix-service2-identifier
   ```

2. Inspect `Service2/App.js` and the files under `Service2/routes/`. Find the route that creates a product/item. The starter bug may use a fixed ID, a random small number, or `Date.now()`.
3. Explain why the current ID is unsafe:
   - A fixed ID is reused.
   - `Date.now()` may return the same value for requests in the same millisecond.
   - A random number has a non-zero collision probability.
4. Use Node's built-in UUID generator. Add this once near the top of the route file:

   ```javascript
   const { randomUUID } = require('node:crypto');
   ```

   Generate the ID when creating the new resource:

   ```javascript
   const newProduct = {
       id: randomUUID(),
       name,
       price
   };
   ```

   Keep the starter's existing validation and response format. A UUID collision is extremely unlikely, not impossible; persistent storage should still enforce a unique constraint.
5. Restart Service 2 and create two products. Use the actual Service 2 port and route:

   ```bash
   curl -i -X POST http://localhost:3002/api/products \
     -H 'Content-Type: application/json' \
     -d '{"name":"Revision Notebook","price":5.5}'

   curl -i -X POST http://localhost:3002/api/products \
     -H 'Content-Type: application/json' \
     -d '{"name":"Exam Pen","price":1.2}'
   ```

   Show that the responses contain different IDs. If the route is protected, include the required authentication header without exposing its value.
6. Review, stage only the intended file(s), commit, and push:

   ```bash
   git status
   git diff
   git add Service2/routes/
   git commit -m "fix: generate unique Service 2 identifiers"
   git push -u origin fix-service2-identifier
   ```

   If the changed file is elsewhere, stage that file explicitly.

**Marking guide**

- Correct base branch and bug location identified: **4**
- Appropriate UUID implementation and explanation: **7**
- Existing validation and API response preserved: **2**
- Two successful creations show distinct IDs: **3**
- Relevant changes committed and pushed on the bug-fix branch: **4**

## Part 3 — Create Service 3 and Query a Product
**20 marks**

**Objective:** Add a third service on a separate feature branch, create the requested folder/files, implement a query route, and push the branch.

1. Return to the base branch and create a separate branch (do not create this branch from the Part 2 branch):

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c feature-service3-query
   ```

2. Create the following structure:

   ```text
   Service3/
   ├── App.js
   └── routes/
       └── products.js
   ```

3. In `Service3/routes/products.js`, create a router with mock product data and `GET /:id`. Return `404` JSON if no product matches:

   ```javascript
   const express = require('express');
   const router = express.Router();

   const products = [
       { id: '1', name: 'Laptop', price: 1000 },
       { id: '2', name: 'Phone', price: 500 }
   ];

   router.get('/:id', (req, res) => {
       const product = products.find((item) => item.id === req.params.id);
       if (!product) {
           return res.status(404).json({ error: 'Product not found' });
       }
       return res.status(200).json(product);
   });

   module.exports = router;
   ```

4. In `Service3/App.js`, mount the router and listen on port `3003`:

   ```javascript
   const express = require('express');
   const productRoutes = require('./routes/products');

   const app = express();
   const port = process.env.PORT || 3003;

   app.use('/api/products', productRoutes);

   app.listen(port, () => {
       console.log(`Service 3 listening on port ${port}`);
   });
   ```

5. From `Service3/`, start the service and test an existing and a missing product:

   ```bash
   cd Service3
   node App.js
   ```

   In another terminal:

   ```bash
   curl -i http://localhost:3003/api/products/1
   curl -i http://localhost:3003/api/products/999
   ```

   Expected results: `200` with the laptop JSON, then `404` with an error JSON.

6. Commit and push only Service 3's files:

   ```bash
   git status
   git add Service3/
   git commit -m "feat: add Service 3 product query"
   git push -u origin feature-service3-query
   ```

**Marking guide**

- Separate feature branch and correct folder structure: **4**
- Query returns the matching product: **5**
- Missing product returns a correct `404`: **3**
- Service starts on the configured port and both requests are verified: **4**
- Changes committed and pushed to the correct branch: **4**

## Part 4 — Theory Questions
**25 marks**

Answer both questions. Define the relevant terms, apply them to the scenario, and discuss at least one trade-off.

### Question 1 — Decomposition, Data Ownership, and Checkout
**13 marks**

An online shop is being split from a monolith into Catalog, Inventory, Order, and Payment services.

1. Explain how DDD business capabilities and bounded contexts can guide the service boundaries. **(3 marks)**
2. Explain why each service should own its data and how other services can obtain information without querying another service's tables. **(3 marks)**
3. After an order is submitted, Inventory reserves stock and Payment authorizes the charge. Explain how a Saga can coordinate this workflow and what should happen if payment fails. **(4 marks)**
4. State one reason to use asynchronous messaging here and one trade-off it introduces. **(3 marks)**

### Question 2 — Safe Migration and Cloud-Native Operation
**12 marks**

A team plans to extract a capability from a legacy monolith while keeping the application available to users.

1. Explain the Strangler Fig approach and the role of an Anti-Corruption Layer. **(4 marks)**
2. The team proposes writing each update independently to both the old and new databases. Identify a failure risk and describe a safer verification/cutover/rollback plan. **(4 marks)**
3. Name two Twelve-Factor or cloud-native practices that support a reliable migration and explain how they help. **(4 marks)**

## Part 5 — Merge, Run, and Final Verification
**20 marks**

**Objective:** Merge both feature branches into the base branch and prove that the monolith/services work after integration.

1. Check that the feature branches are pushed and the working tree is clean:

   ```bash
   git status
   git branch -a
   ```

2. Merge both branches into `main`:

   ```bash
   git switch main
   git pull --ff-only origin main
   git merge --no-ff fix-service2-identifier
   git merge --no-ff feature-service3-query
   ```

   Resolve any conflicts carefully. Inspect the affected files, remove conflict markers, run the checks, stage the resolved files, and complete the merge commit.

3. Push the updated base branch:

   ```bash
   git push origin main
   ```

4. Start the final services. Open one terminal for each running process:

   ```bash
   # Terminal 1: original monolith, if required for its base endpoints
   node app.js
   ```

   ```bash
   # Terminal 2: Service 1 (use the actual folder and port)
   cd Service1
   node App.js
   ```

   ```bash
   # Terminal 3: Service 2
   cd Service2
   node App.js
   ```

   ```bash
   # Terminal 4: Service 3
   cd Service3
   node App.js
   ```

   If the refactored Service 1 and Service 2 are mounted into the root app rather than independently started, start the root app and use its route prefixes instead. Do not start two processes on the same port.

5. Demonstrate all three services with `curl` (adjust paths to the starter):

   ```bash
   # Service 1
   curl -i http://localhost:3001/api/users

   # Service 2
   curl -i http://localhost:3002/api/products

   # Service 3: existing product and missing product
   curl -i http://localhost:3003/api/products/1
   curl -i http://localhost:3003/api/products/999
   ```

6. Send two Service 2 create requests and show that the returned IDs differ. Add required JSON and authentication headers where applicable.
7. Show the lecturer the successful responses, merged branch history, running applications, and final Git status.

**Lecturer sign-off:** ______________________________

**Marking guide**

- Both branches merged and pushed to the base branch: **6**
- Services start without port conflicts: **4**
- Service 1, Service 2, and Service 3 routes return the expected responses: **5**
- Service 2 demonstrates distinct IDs after creation: **3**
- Clear final demonstration and clean working tree: **2**

---

# Model Answers and Revision Guide

## Part 2 — Identifier bug

A constant ID will be reused. A timestamp can repeat when multiple requests happen during the same millisecond, and a random integer can collide because its possible values are limited. `crypto.randomUUID()` creates a UUID with an extremely low collision probability without requiring a shared counter across service instances. It does not mathematically guarantee uniqueness, so persistent storage should still enforce a unique constraint and the application should handle conflicts safely.

## Part 3 — Query route

`req.params.id` contains the ID from the URL as a string. The router searches its data for a matching product. If found, it returns JSON with `200`; if no product matches, it returns a clear `404` error. The route `router.get('/:id', ...)` mounted at `/api/products` becomes `GET /api/products/:id`.

## Part 4 — Sample answer: service boundaries and checkout

1. Define boundaries around capabilities such as Catalog, Inventory, Order, and Payment. Use bounded contexts so each service can own its own business vocabulary and rules; avoid splitting by technical layer.
2. Each service owns and changes its own schema. Other services call its API, subscribe to its events, or maintain a read projection rather than querying its tables directly. This reduces schema coupling but makes cross-service queries and transactions more involved.
3. A Saga coordinates local transactions: Order records the order, Inventory reserves stock, then Payment attempts authorization. If payment fails, a compensating action can release the stock reservation and mark the order as failed. Compensation is not always a literal rollback, and the system may expose an intermediate state.
4. An event such as `OrderPlaced` can let Inventory and Payment process work without keeping the user's HTTP request open. Messaging decouples runtime availability and can buffer load, but introduces delayed processing, duplicate delivery, retries, and eventual consistency. Consumers should be idempotent.

## Part 4 — Sample answer: migration and operations

1. With **Strangler Fig**, route selected capabilities to the new service while the remaining functionality continues to use the monolith. After behavior and data are verified, remove the replaced legacy code. An **Anti-Corruption Layer** translates legacy formats and concepts so they do not spread into the new service's domain model.
2. Independent writes to old and new databases are not one atomic transaction. One write may succeed while the other fails, leaving the stores inconsistent; retries may duplicate work. Monitor and reconcile writes, compare data before cutover, switch reads only after verification, and keep a tested recovery plan. Do not disable the old write path until rollback data freshness is addressed. An outbox or change-data-capture mechanism may be safer than application-level dual writes.
3. Examples:
   - **Config:** Keep environment-specific database URLs and secrets outside code, making a release portable without embedding credentials.
   - **Build/release/run:** Build an immutable artifact and deploy it with an identifiable release so rollback is controlled.
   - **Disposability/stateless processes:** Allow instances to restart or be replaced without losing durable state.
   - **Logs/observability:** Central logs, metrics, and traces help compare old and new behavior and diagnose migration failures.

## Part 4 — Marking guide

Award marks for accurate application, not just naming terms:

- Question 1: bounded context/capability boundaries **3**; service-owned data and API/event access **3**; Saga sequence and compensation **4**; asynchronous benefit and trade-off **3**.
- Question 2: Strangler Fig and ACL **4**; dual-write failure risk and safe transition **4**; two correctly explained operational practices **4**.

## Part 5 — Final checks

Before sign-off:

```bash
git status
git log --oneline --graph --decorate -8
git branch --show-current
```

Confirm that the base branch contains both feature changes, expected services are running, each route returns the right status code, and no secret or generated dependency folder was committed.

## Self-assessment checklist

- [ ] I can clone my repository and run the original monolith.
- [ ] I can find and fix the identifier bug on a separate branch.
- [ ] I can create a second feature branch for Service 3 and query an item by ID.
- [ ] I can push branches, merge them into `main` (or `master`), and verify the result.
- [ ] I can explain bounded contexts, database-per-service, Saga, and asynchronous messaging.
- [ ] I can explain Strangler Fig, ACL, and why dual writes can become inconsistent.
- [ ] I can connect Twelve-Factor practices to configuration, deployment, and operations.
- [ ] I can demonstrate successful and not-found requests with `curl`.
