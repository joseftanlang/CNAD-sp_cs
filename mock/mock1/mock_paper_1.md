# ET0745 Mock Assessment 1
## Cloud Native and Microservices

- **Assessment type:** Practical (Git and Node.js) plus theory
- **Suggested practice time:** 2 hours 30 minutes
- **Total:** 100 marks
- **Parts:** 5
**Instructions:** Complete the practical tasks in order. Use the model answers only after attempting the paper. Keep your work in the specified branches and do not commit secrets, `.env` files, or `node_modules`.

- **Name:** ______________________________
- **Date:** ______________________________
**Lecturer sign-off:** ______________________________

### Scenario and assumptions

You are given a starter Git repository containing a small Node.js/Express application. It has a monolithic `app.js` with Service 1 (Users) and Service 2 (Products) routes. For this paper, use these example endpoints:

- `GET /api/service1/users`
- `GET /api/service2/products`
- `POST /api/service2/products`
- `GET /api/service3/products/:id` (to be added)

The starter repository may use different filenames or route names; inspect it first and adapt the commands to the actual project. The mock expects `main` as the base branch. If the repository uses `master`, consistently substitute `master` for `main`.

For Part 3 and the single-port final verification, Service 3 is implemented as a router mounted by the starter application. In a production microservice deployment, Service 3 would normally run as a separate process and an API Gateway or reverse proxy would route requests to it. Be prepared to explain this distinction.

---

# Question Paper

## Part 1 — Environment Setup and Monolith Demo
**15 marks**

**Objective:** Clone the starter repository, run the base application, and demonstrate both existing services.

1. Create a new GitHub repository with a unique name, for example `ET0745-Microservices-YourName`.
2. Connect to your assigned VM and clone your repository:

   ```bash
   git clone <your-repository-url>
   cd ET0745-Microservices-YourName
   ```

3. Inspect the repository and current branch before changing anything:

   ```bash
   git status
   git branch --show-current
   find . -maxdepth 3 -type f -not -path '*/node_modules/*' | sort
   ```

4. Install dependencies and start the monolith from the directory containing its `package.json` and `app.js`:

   ```bash
   npm install
   node app.js
   ```

   Keep the server running. In a second terminal, call the Service 1 and Service 2 list endpoints:

   ```bash
   curl -i http://localhost:3000/api/service1/users
   curl -i http://localhost:3000/api/service2/products
   ```

   If the app uses another port or route prefix, use the values in the starter code.

5. Show the running application and successful responses to the lecturer.

**Lecturer sign-off:** ______________________________

**Marking guide**

- Repository created, cloned, and correct project identified: **4**
- Dependencies installed and application started: **4**
- Both service endpoints tested with appropriate responses: **5**
- Clear demonstration and sign-off: **2**

## Part 2 — Git Branching and Service 2 Identifier Bug
**20 marks**

**Objective:** Create a feature branch, fix an ID-generation bug in Service 2, test the fix, and push the branch.

1. Confirm the working tree is clean, then create a branch:

   ```bash
   git status
   git switch -c fix-service2-bug
   ```

2. Inspect the Service 2 create-product route. The starter may use a hard-coded ID, `Date.now()`, or `Math.random()`. Explain why hard-coded IDs collide, why timestamps can collide when requests occur within the same millisecond, and why random-number IDs only make collisions less likely rather than impossible.
3. Replace the ID generation with a UUID. Node.js provides `crypto.randomUUID()` without an additional dependency:

   ```javascript
   const { randomUUID } = require('node:crypto');

   // Inside the create route:
   const newProduct = {
       id: randomUUID(),
       name,
       price
   };
   ```

   Adapt the fields to the starter application. Keep input validation and the response status code intact. A UUID collision is extremely unlikely, not mathematically impossible; persistent storage should still enforce a unique constraint.
4. Restart the application and send two create requests:

   ```bash
   curl -i -X POST http://localhost:3000/api/service2/products \
     -H 'Content-Type: application/json' \
     -d '{"name":"Test Product A","price":10}'

   curl -i -X POST http://localhost:3000/api/service2/products \
     -H 'Content-Type: application/json' \
     -d '{"name":"Test Product B","price":20}'
   ```

   Show that the returned IDs differ. If the starter requires an API key, add its required header using the local development secret; never paste the secret into this paper or commit it.
5. Review and push only the relevant source changes:

   ```bash
   git status
   git diff
   git add service2/routes/
   git commit -m "fix: resolve unique identifier bug in Service 2"
   git push -u origin fix-service2-bug
   ```

   If the actual route file is elsewhere, stage that file instead. Do not use `git add .` if it could stage secrets, generated files, or unrelated work.

**Marking guide**

- Correct branch and inspection of the bug: **4**
- Appropriate unique-ID implementation and explanation: **7**
- Validation/status behavior preserved: **2**
- Two create requests demonstrate different IDs: **3**
- Relevant changes committed and branch pushed: **4**

## Part 3 — Add Service 3
**20 marks**

**Objective:** Create a product-query route on a feature branch and integrate it with the starter application.

1. Return to the base branch and create the new feature branch:

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c feature-service3
   ```

2. Create the files:

   ```text
   service3/
   ├── app.js
   └── routes/
       └── products.js
   ```

3. Implement `GET /:id` in `service3/routes/products.js`. Use mock data with string IDs so the URL parameter can be compared consistently:

   ```javascript
   const express = require('express');
   const router = express.Router();

   const items = [
       { id: '1', name: 'Laptop', price: 1000 },
       { id: '2', name: 'Phone', price: 500 }
   ];

   router.get('/:id', (req, res) => {
       const item = items.find((product) => product.id === req.params.id);
       if (!item) {
           return res.status(404).json({ error: 'Item not found' });
       }
       return res.status(200).json(item);
   });

   module.exports = router;
   ```

4. Create `service3/app.js` as a standalone runner:

   ```javascript
   const express = require('express');
   const productsRouter = require('./routes/products');

   const app = express();
   const port = process.env.PORT || 3003;

   app.use('/api/service3/products', productsRouter);
   app.listen(port, () => {
       console.log(`Service 3 listening on port ${port}`);
   });
   ```

   Run it from the `service3` folder (or use the corresponding relative path):

   ```bash
   cd service3
   node app.js
   ```

   Test the standalone service:

   ```bash
   curl -i http://localhost:3003/api/service3/products/1
   curl -i http://localhost:3003/api/service3/products/999
   ```

   The first request should return `200`; the second should return `404`.

5. To support the paper’s single-port final test, mount the same router in the root monolith/gateway `app.js`:

   ```javascript
   const service3Products = require('./service3/routes/products');
   app.use('/api/service3/products', service3Products);
   ```

   Restart the root application and test `http://localhost:3000/api/service3/products/1`. Do not run both applications on the same port.

6. Commit and push the feature branch:

   ```bash
   git status
   git diff
   git add service3/ app.js
   git commit -m "feat: add Service 3 product query"
   git push -u origin feature-service3
   ```

**Marking guide**

- Correct branch and folder/file structure: **4**
- Route returns the matching item: **5**
- Missing ID returns JSON `404`: **3**
- Standalone service starts and works: **3**
- Router is mounted and works through the main application: **3**
- Relevant changes committed and branch pushed: **2**

## Part 4 — Theory
**25 marks**

Answer in your own words. For each answer, explain the mechanism and at least one limitation or trade-off.

### Question 1 — Data Management and Migration
**12 marks**

During migration from a legacy monolithic database to a microservices architecture, a team proposes a dual-write/tracer-write transition. Explain:

1. The stages of the migration, including which database serves reads during each stage.
2. How the team verifies that the new database is sufficiently synchronized.
3. What can go wrong when one of the two writes succeeds and the other fails.
4. How rollback can remain safe after reads are switched.

### Question 2 — Integration and Resilience
**13 marks**

During a flash sale, the Payment Service is timing out. The Order Service keeps waiting, exhausts its request threads, and starts failing unrelated requests.

**A.** Which cross-cutting pattern should be applied around calls to the Payment Service? **(3 marks)**

**B.** Explain the Closed, Open, and Half-Open states and how they reduce cascading failure. **(7 marks)**

**C.** Name one complementary protection and explain why it helps. **(3 marks)**

## Part 5 — Merge, Final Verification, and Demonstration
**20 marks**

**Objective:** Merge both feature branches into the base branch and demonstrate that all three routes work together.

1. Confirm both branches have been pushed and the working tree is clean:

   ```bash
   git status
   git branch -a
   ```

2. Merge the bug-fix branch and the Service 3 branch into `main`:

   ```bash
   git switch main
   git pull --ff-only origin main
   git merge --no-ff fix-service2-bug
   git merge --no-ff feature-service3
   ```

   If there are conflicts, inspect them, edit the affected files, run the tests, then complete the merge:

   ```bash
   git status
   # Resolve conflict markers in the listed files, then:
   git add <resolved-file>
   git commit
   ```

3. Push the merged base branch:

   ```bash
   git push origin main
   ```

4. Start the integrated application:

   ```bash
   npm install
   node app.js
   ```

5. Demonstrate the following from a second terminal:

   ```bash
   # Service 1 list route
   curl -i http://localhost:3000/api/service1/users

   # Service 2 list route
   curl -i http://localhost:3000/api/service2/products

   # Service 3 query route
   curl -i http://localhost:3000/api/service3/products/1

   # Service 3 missing item
   curl -i http://localhost:3000/api/service3/products/999
   ```

6. Create two Service 2 products and compare their returned IDs. Include the required API-key header if the starter protects POST.
7. Show the lecturer the running server, successful responses, branch/merge history, and final repository status.

**Lecturer sign-off:** ______________________________

**Marking guide**

- Both branches merged without losing work: **6**
- Integrated application starts: **3**
- Service 1 and Service 2 routes work: **3**
- Service 2 creates records with distinct IDs: **3**
- Service 3 returns `200` for an item and `404` for a missing ID: **3**
- Changes pushed and demonstration is clear: **2**

---

# Model Answers and Revision Notes

> Attempt the questions before reading this section. The code and routes shown above are examples; adapt them to the starter repository and be ready to explain your choices.

## Part 2 — Why use UUIDs?

A hard-coded ID will be reused. `Date.now()` can repeat when two requests occur in the same millisecond, and a random integer can collide because it is selected from a finite range. A UUID generated with `crypto.randomUUID()` has an extremely low collision probability without requiring a central ID counter, which is useful when independent service instances create records.

UUIDs are not a mathematical guarantee of uniqueness. Enforce uniqueness in persistent storage and handle a conflict if one occurs. For a single-process in-memory exercise, the UUID is a simple demonstration; it does not make the rest of the data store durable or concurrency-safe.

## Part 3 — Query route behavior

The route reads the requested ID from `req.params.id`, finds a matching item, returns JSON with `200` when found, and returns a JSON error with `404` otherwise. A `404` is preferable to returning an empty object or a success-shaped response for a missing resource.

In the paper’s integrated route, `app.use('/api/service3/products', productsRouter)` combined with `router.get('/:id', ...)` produces `GET /api/service3/products/:id`.

## Part 4 — Model answer: dual-write/tracer-write migration

1. Identify and isolate the data boundary to migrate. Initially, the legacy database remains the read source while the application begins writing the same logical change to both the legacy and new stores.
2. Compare the stores using appropriate checks, such as record counts, sampled or full data comparisons, checksums, and reconciliation of changes. Monitor write failures and lag; do not switch reads based on a single successful test.
3. A dual write is not automatically atomic. The old write may succeed while the new write fails, or vice versa. Retries can also create duplicate operations unless they are idempotent. Record, retry, reconcile, and alert on partial failures.
4. Once the new store is sufficiently validated, switch reads to it while maintaining a known recovery path. Before disabling old writes, establish how changes made after cutover could be recovered if rollback is needed—such as continued replication, reverse synchronization, or a tested restore/replay plan. Only retire the old path after an agreed observation period and data verification.

**Why it helps:** A phased migration avoids a single “big bang” cutover and allows the team to validate data and behavior incrementally. It can reduce downtime risk, but it does **not** guarantee zero downtime or automatic reversibility. Dual writes add consistency and operational hazards; an outbox or change-data-capture (CDC) approach may be safer where suitable.

### Suggested marking points

- Correctly describes dual-write stage and old-read/new-write phase: **3**
- Explains validation and monitoring before read cutover: **3**
- Identifies partial-write and duplicate/retry risks: **3**
- Explains a realistic rollback/old-data freshness plan and avoids claiming guaranteed zero downtime: **3**

## Part 4 — Model answer: Circuit Breaker

**A.** Apply a **Circuit Breaker** around calls from Order to Payment. When Payment is failing, the breaker prevents every Order request from waiting through another long timeout.

**B.**

- **Closed:** Calls are allowed. The breaker measures failures or timeouts against a configured threshold.
- **Open:** After the threshold is crossed, calls fail fast or take a defined safe fallback path. This avoids repeatedly consuming Order threads and adding load to an unhealthy Payment Service.
- **Half-Open:** After a cooldown, a limited number of probe requests are allowed. If they succeed, the breaker closes; if they fail, it reopens.

The breaker limits the effects of repeated downstream failure; it does not fix Payment or prove that a payment succeeded. Do not treat a failed payment call as a successful charge.

**C.** A **Bulkhead** can reserve a bounded pool of connections/threads for Payment calls so they cannot consume all Order capacity. A strict timeout and carefully bounded retries are also useful; retries should not amplify an outage.

### Suggested marking points

- Correct pattern and placement at the caller/dependency boundary: **3**
- Closed/Open/Half-Open described accurately: **6** (2 each)
- Explains fail-fast and recovery probe behavior: **1**
- Names and justifies a complementary pattern: **3**

## Part 5 — Example verification sequence

Run the GET checks first, then test Service 2 creation twice with valid JSON and the required API key if configured. Compare the IDs in the `201` responses. Verify Service 3 with both an existing and a missing ID. The expected results are `200` for existing resources, `404` for a missing resource, and `201` for successful creation.

At the end, check the repository:

```bash
git status
git log --oneline --graph --decorate -8
git branch --show-current
```

The working tree should be clean after all intended work is committed. Confirm the active branch is the base branch and the feature branches are visible on the remote.

## Final self-marking checklist

- [ ] I can clone the repository, install dependencies, and start the app.
- [ ] I can explain which services are in the starter monolith and demonstrate their routes.
- [ ] I created and pushed separate branches for the bug fix and new service.
- [ ] Two create requests return distinct IDs, and I can explain collision risk accurately.
- [ ] Service 3 returns the expected item and a proper `404` for a missing one.
- [ ] I can explain dual-write failure modes, validation, cutover, and rollback.
- [ ] I can explain all Circuit Breaker states and name a complementary resilience pattern.
- [ ] I merged, tested, and pushed the final work without committing secrets or generated files.
