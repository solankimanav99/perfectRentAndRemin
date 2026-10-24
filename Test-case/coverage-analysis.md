# Perfect Rent & Remind – Structural Complexity and Test Coverage Analysis
**Course:** Advanced Web Technologies (AWT) – Practical 9  
**Application:** Perfect Rent & Remind – Smart Clothing Rental Management System  
**Analysis Engine:** McCabe Cyclomatic Complexity & Jest / Istanbul Coverage Engine  
**Execution Timestamp:** October 23, 2026 (Updated with Dynamic Date Fixtures)  

---

## 1. Principles of Structural Complexity

### 1.1 McCabe's Cyclomatic Complexity Theory
Developed by Thomas J. McCabe in 1976, **Cyclomatic Complexity ($V(G)$)** is a software metric used to indicate the structural complexity of a program. It directly measures the number of linearly independent paths through a program's source code.

A linearly independent path is any path through the program that introduces at least one new edge that is not part of any other independent path. In software testing, McCabe's complexity defines the theoretical upper bound for the minimum number of test cases required to achieve **Basis Path Testing** (100% branch/decision coverage).

### 1.2 Mathematical Formulations

For a general control flow graph $G$ with multiple connected components or subroutines:
$$V(G) = E - N + 2P$$

Where:
- **$E$** = Number of edges in the control-flow graph (flow of control between instructions).
- **$N$** = Number of nodes in the control-flow graph (sequential procedural statements or blocks).
- **$P$** = Number of connected components (subroutines or independent entry points; $P = 1$ for a single function).

For a single connected control-flow graph representing a single method or function ($P = 1$):
$$V(G) = E - N + 2$$

Alternatively, by counting predicate/decision nodes:
$$V(G) = P_{\text{pred}} + 1$$

Where:
- **$P_{\text{pred}}$** is the total number of binary decision points in the function.

### 1.3 Counting Convention for Javascript / Node.js
To ensure absolute mathematical consistency and reproducibility, the following counting convention is strictly applied to the source code:
1. **Base Complexity:** Every function begins with a baseline complexity of $1$.
2. **Conditional Statements:** Each `if`, `else if`, and ternary operator (`condition ? expr1 : expr2`) increments complexity by $+1$. (A simple `else` is the complementary edge of an `if` and does not add a new predicate node).
3. **Compound Boolean Operators:** Short-circuit logical operators (`&&`, `||`) within conditional expressions represent implicit decision branching and increment complexity by $+1$ for each operator.
4. **Looping Constructs:** Each `while`, `for`, `for...in`, `for...of`, and `do...while` loop increments complexity by $+1$.
5. **Switch Statements:** Each explicit `case` block increments complexity by $+1$; the `default` case is the complementary path and does not increment.
6. **Exception Handling:** Each `catch` block that introduces conditional error-handling branches (e.g., checking `err.code === 11000`) increments complexity for each predicate evaluated.

### 1.4 Risk Classification Thresholds
Based on standard software engineering benchmarks (NIST Special Publication 500-235):
- **$1 \le V(G) \le 10$ (Low Risk):** Simple, well-structured, easy to understand, test, and maintain.
- **$11 \le V(G) \le 20$ (Moderate Risk):** Moderate complexity, multiple decision branches, requires disciplined basis path testing.
- **$21 \le V(G) \le 50$ (High Risk):** Highly complex, difficult to test exhaustively, candidate for refactoring.
- **$V(G) > 50$ (Very High / Untestable Risk):** Extremely complex, high probability of defect escapes.

---

## 2. Empirical Source Code Complexity Analysis

The following table presents the exact cyclomatic complexity calculations for core backend functions across the controllers, services, middleware, and utility modules of the **Perfect Rent & Remind** codebase.

| Function / Method | Source File | Decision Points / Predicate Nodes ($P_{\text{pred}}$) | $V(G)$ | Risk Level | Testing Implications & Basis Paths |
|:---|:---|:---|:---:|:---:|:---|
| `normalizeUtcDate` | `src/utils/calculateRental.js` | 2: `if (typeof === 'string')`, `if (parts.length === 3)` | **3** | Low Risk | 3 basis paths: valid string formatted as YYYY-MM-DD, non-split string, and Date object. |
| `calculateRentalDuration` | `src/utils/calculateRental.js` | 0: Pure arithmetic calculation | **1** | Low Risk | 1 path: linear formula `Math.round((ret - start)/86400000)`. |
| `calculateFine` | `src/utils/calculateFine.js` | 0: (uses `Math.max(0, dayDiff)` without explicit branching) | **1** | Low Risk | 1 path: computes UTC difference and linear multiplication. |
| `protect` | `src/middleware/auth.middleware.js` | 4: `if (headers && startsWith)`, `if (!token)`, `if (!req.user)`, `catch (error)` | **5** | Low Risk | 5 basis paths: Bearer token valid, missing header, malformed token, deleted user, expired token. |
| `admin` | `src/middleware/auth.middleware.js` | 2: `if (req.user && req.user.role === 'ADMIN')` (1 `if` + 1 `&&`) | **3** | Low Risk | 3 basis paths: User is admin, user exists but role is CUSTOMER, req.user is undefined. |
| `calculateReservedQuantity`| `src/services/booking.service.js` | 1: Ternary `session ? { session } : {}` | **2** | Low Risk | 2 basis paths: query with transaction session, query without session. |
| `createBooking` | `src/services/booking.service.js` | 13: `if (normStart >= normEnd)`, `if (normStart < todayUtc)`, `if (duration < 1)`, `if (!clothing)`, `if (status !== 'AVAILABLE' || qty <= 0)` (+2), `if (qty > clothing.qty)`, `while (attempt < MAX_RETRIES)`, `if (session)`, `if (matchedCount === 0)`, `if (availableQty < qty)`, `if (err.code === OVERLAP || UNAVAILABLE)` (+2), `if (!isTransient && err !== 112 && err !== 11000)` (+3), `if (attempt >= MAX_RETRIES)` | **16** | Moderate Risk | 16 basis paths required to cover date validation, availability checks, retry loops, transient write conflicts, and overlap rejections. |
| `cancelBooking` | `src/services/booking.service.js` | 4: `if (!booking)`, `if (role !== 'ADMIN' && custId !== user._id)` (+2), `if (!['PENDING', 'CONFIRMED'].includes)` | **5** | Low Risk | 5 basis paths: Booking not found, customer owns booking, admin cancels, forbidden customer, non-cancellable status. |
| `updateBookingStatus` | `src/controllers/booking.controller.js` | 18: `if (!booking)`, `if (['RETURNED','COMPLETED'])`, `if (status === 'CANCELLED')`, `if (!PENDING/CONFIRMED)`, `if (PENDING -> CONFIRMED)`, `if (!Payment)`, `if (!payment || method !== 'COP' || status !== 'PENDING')` (+3), `if (CONFIRMED -> PICKED_UP)`, `if (!Payment)`, `if (!payment)`, `if (method in [UPI, CARD])`, `if (status !== 'PAID')`, `if (method === 'COP')`, `if (status !== 'PENDING')` | **19** | Moderate Risk | 19 basis paths required. High branching due to state-machine orchestration across electronic vs. cash-on-pickup lifecycles. |
| `createPayment` | `src/services/payment.service.js` | 17: `if (!Booking)`, `if (!booking)`, `if (role !== ADMIN && custId !== user._id)` (+2), `if (!payable)`, `if (existingPayment)`, `if (isSimulatedFail: NODE_ENV !== prod && (hdr === FAIL || method === FAIL))` (+3), `if (method === 'COP')`, `catch err (err.code === 11000)`, `if (status === 'PENDING')`, `if (bookingService && confirmBooking)` (+2), `if (!supportsTx && createdPaymentDoc)` (+2), `if (err.code === 11000)` | **18** | Moderate Risk | 18 basis paths covering electronic settlement, cash on pickup, duplicate key collisions, simulated failures, and rollback branches. |
| `refundPayment` | `src/services/payment.service.js` | 6: `if (!payment)`, `if (status === 'REFUNDED')`, `if (status !== 'PAID')`, `if (Booking)`, `if (booking && status !== 'CANCELLED')` (+2), `if (reason)` | **7** | Low Risk | 7 basis paths covering not found, double refund, uncollected cash, eligible cancelled booking, and non-cancelled booking. |
| `processReturn` | `src/controllers/return.controller.js` | 9: `if (!Booking)`, `if (!booking)`, `if (existingReturn)`, `if (!PICKED_UP/OVERDUE)`, `if (actDate < rentStart)`, `if (condition === 'DAMAGED')`, `if (lateDays > 0)`, `catch err (err.code === 11000)` | **10** | Low Risk | 10 basis paths covering return eligibility, late fine assignment, damaged status, and duplicate return prevention. |
| `settleReturn` | `src/controllers/return.controller.js` | 6: `if (!returnRecord)`, `if (returnRecord.settled)`, `if (Booking)`, `if (damageCharge > securityDeposit)`, `if (supportsTx)` | **7** | Low Risk | 7 basis paths covering idempotency (409), deposit damage deduction, and atomic completion transition. |
| `getClothing` | `src/controllers/clothing.controller.js` | 13: `if (startDate || endDate)` (+2), `if (search)`, `if (category)`, `if (match ObjectId)`, `if (categoryDoc)`, `if (size)`, `if (color)`, `if (minPrice || maxPrice)` (+2), `if (availability !== undefined)`, `if (availability === 'true')` | **14** | Moderate Risk | 14 basis paths covering Phase 1 501 deferred date check, regex search, ObjectId vs. name category lookups, and price filtering. |

---

## 3. Principles of Test Coverage Metrics

### 3.1 Coverage Definitions & Mathematical Formulas

#### A. Statement Coverage
Measures the percentage of executable programming statements that have been executed at least once during test suite execution.
$$\text{Statement Coverage} = \left( \frac{\text{Total Statements Executed}}{\text{Total Executable Statements}} \right) \times 100\%$$

#### B. Branch / Decision Coverage
Measures the percentage of decision outcomes (both `true` and `false` branches of every predicate node) traversed during test suite execution.
$$\text{Branch Coverage} = \left( \frac{\text{Total Branches Traversed}}{\text{Total Branches}} \right) \times 100\%$$

#### C. Function Coverage
Measures the percentage of declared functions or subroutines that have been called at least once during test suite execution.
$$\text{Function Coverage} = \left( \frac{\text{Total Functions Executed}}{\text{Total Declared Functions}} \right) \times 100\%$$

#### D. Line Coverage
Measures the percentage of executable source code lines visited by the test runner.
$$\text{Line Coverage} = \left( \frac{\text{Total Lines Executed}}{\text{Total Executable Lines}} \right) \times 100\%$$

---

## 4. Empirical Test Coverage Results

The following coverage data was collected directly from the active Jest Istanbul coverage reporter on October 23, 2026, executing **86 tests across 10 test suites**, with all 86 tests passing successfully (**100% pass rate**).

### 4.1 Master Coverage Breakdown by Subsystem

| Subsystem / Directory | Statement Coverage (%) | Branch Coverage (%) | Function Coverage (%) | Line Coverage (%) | Uncovered Lines / Branch Explanations |
|:---|:---:|:---:|:---:|:---:|:---|
| **All Files (Repository Total)** | **76.88%** | **59.15%** | **85.22%** | **77.25%** | Comprehensive execution across all subsystems; unexercised lines reside in defensive catch blocks and deferred feature guards. |
| `src/` (Application Entry) | **88.23%** | **50.00%** | **0.00%** | **88.23%** | `app.js`: Unexercised lines (22, 27, 31, 36) represent server bootstrap and production logging configurations. |
| `src/config/` (Environment & DB) | **100.00%** | **70.83%** | **100.00%** | **100.00%** | `env.js`: Default fallback assignments for optional environment variables. |
| `src/controllers/` (Route Controllers) | **74.58%** | **55.50%** | **87.50%** | **75.41%** | Controller error catch delegates (`next(error)`), deferred 501 branches, and administrative listing edge cases. |
| `src/middleware/` (Auth & Validation) | **79.03%** | **69.38%** | **77.77%** | **80.00%** | Rate limiter IPv6 fallbacks and internal middleware error boundaries. |
| `src/models/` (Mongoose Schemas) | **91.42%** | **85.71%** | **100.00%** | **91.42%** | Virtuals, pre-save hooks, and custom query helpers. |
| `src/routes/` (Express Routers) | **95.06%** | **11.11%** | **0.00%** | **95.06%** | Route definition tables. Function coverage is 0% because router files export configured router instances without calling inline helper functions. |
| `src/services/` (Business Logic) | **64.33%** | **60.00%** | **90.47%** | **64.21%** | `booking.service.js` and `payment.service.js`: Transient MongoDB transaction error retries and standalone fallback compensation branches. |
| `src/utils/` (Calculators & Helpers) | **98.11%** | **69.23%** | **100.00%** | **98.11%** | `calculateRental.js` (100%), `calculateFine.js` (100%), `constants.js` (100%), `generateToken.js` (100%), `transactionHelper.js` (95%). |
| `src/validators/` (Joi Schemas) | **100.00%** | **50.00%** | **100.00%** | **100.00%** | Joi validation schemas executed at 100% statement and line coverage. |

### 4.2 Granular File-by-File Coverage Matrix

| File Path | Statements (%) | Branches (%) | Functions (%) | Lines (%) | Uncovered Line References |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/app.js` | 88.23% | 50.00% | 0.00% | 88.23% | Lines 22, 27, 31, 36 |
| `src/config/env.js` | 100.00% | 70.83% | 100.00% | 100.00% | Lines 4-7, 10-12 |
| `src/controllers/auth.controller.js` | 88.57% | 100.00% | 100.00% | 88.57% | Lines 43, 84, 97, 109 |
| `src/controllers/booking.controller.js` | 75.82% | 62.26% | 100.00% | 75.82% | Lines 12-15, 65, 79, 92, 116, 156, 169, 180-191, 202, 214, 234, 245, 257, 277, 303-311 |
| `src/controllers/category.controller.js` | 84.84% | 66.66% | 100.00% | 84.84% | Lines 16, 46, 58, 71, 96 |
| `src/controllers/clothing.controller.js` | 61.36% | 48.00% | 85.71% | 63.85% | Lines 30, 34-39, 45-47, 50-54, 95, 103-119, 130, 148, 159, 166-168, 199 |
| `src/controllers/payment.controller.js` | 74.46% | 55.00% | 80.00% | 74.46% | Lines 43, 57, 69, 93, 101-129 |
| `src/controllers/return.controller.js` | 74.78% | 51.42% | 72.72% | 75.43% | Lines 11-14, 49, 60, 98, 142, 149-161, 179, 187-203, 215, 226, 240, 255, 305, 327 |
| `src/controllers/user.controller.js` | 87.50% | 50.00% | 100.00% | 87.50% | Lines 10, 37 |
| `src/middleware/auth.middleware.js` | 90.47% | 91.66% | 100.00% | 90.47% | Lines 29, 40 |
| `src/middleware/error.middleware.js` | 60.86% | 70.00% | 50.00% | 63.63% | Lines 9-11, 15-17, 27-28 |
| `src/middleware/rateLimiter.middleware.js` | 77.77% | 46.66% | 50.00% | 77.77% | Lines 20, 32 |
| `src/middleware/validate.middleware.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/models/Booking.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/models/Category.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/models/Clothing.js` | 61.53% | 80.00% | 100.00% | 61.53% | Lines 67-71 |
| `src/models/Payment.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/models/Return.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/models/User.js` | 95.45% | 100.00% | 100.00% | 95.45% | Line 48 |
| `src/services/booking.service.js` | 61.78% | 57.57% | 92.85% | 61.57% | Lines 10-16, 76-79, 85-88, 93-96, 128-131, 143-145, 189, 193-196, 209-212, 217-220, 253-256, 260-263, 284-287, 291-294, 315-318, 322-325, 346-349, 353-356, 360-363 |
| `src/services/payment.service.js` | 68.29% | 63.93% | 85.71% | 68.29% | Lines 12-15, 23, 50-53, 59-62, 110-116, 137-143, 171-172, 184, 187-190, 204-207, 228-231 |
| `src/utils/calculateFine.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/utils/calculateRental.js` | 100.00% | 75.00% | 100.00% | 100.00% | Line 11 |
| `src/utils/constants.js` | 100.00% | 50.00% | 100.00% | 100.00% | Line 48 |
| `src/utils/generateToken.js` | 100.00% | 100.00% | 100.00% | 100.00% | None |
| `src/utils/transactionHelper.js` | 95.00% | 71.42% | 100.00% | 95.00% | Line 26 |
| `src/validators/*.validator.js` (7 files) | 100.00% | 100.00% | 100.00% | 100.00% | All Joi validation schemas covered |

---

## 5. Coverage Gap Analysis & Interpretation

### 5.1 Why is Branch Coverage 59.15%?
While Function Coverage is high (**85.22%**) and Statement Coverage is strong (**76.88%**), Branch Coverage sits at **59.15%**. A detailed inspection of uncovered branches reveals four distinct technical causes:

1. **Defensive Concurrency & Transaction Retries:**
   In `src/services/booking.service.js`, the retry loop contains branches for `TransientTransactionError`, `UnknownTransactionCommitResult`, and `WriteConflict (code 112)`. In the test environment using MongoMemoryReplSet, transactions commit cleanly on the first attempt, leaving the retry-exhaustion error branches (lines 193–196) unvisited.
2. **Defensive Circular Dependency Resolvers:**
   Both `booking.service.js` and `payment.service.js` use dynamic `require()` wrappers (`getPaymentModel()`, `getBookingModel()`) with fallback `try/catch` checks (lines 10–16). Because all models load normally in the test runtime, the catch fallbacks are never triggered.
3. **Phase 1 Deferred Feature Defensive Guards (HTTP 501):**
   In `clothing.controller.js`, explicit branches handle deferred capabilities:
   - Date range queries (`startDate` or `endDate`) return 501.
   - Quantity reductions on existing items return 501.
   - Deletion returns 501.
   **Crucial Architectural Distinction:** Tests verifying these HTTP 501 responses prove that the API contract protects the database against invalid operations; they do **not** represent functional implementations of those features. The underlying features remain intentionally unimplemented.
4. **Standalone Non-Transaction Compensation Branches:**
   In `payment.service.js` (lines 183–185), a compensating `deleteOne` is executed if transactions are unsupported (`!supportsTransactions()`). In modern test runs where MongoMemoryReplSet runs with replica set support, this non-transaction branch is bypassed.

### 5.2 Key Recommendations for Future Testing Iterations
1. **Fault Injection Testing:** Introduce Jest mock-injection for MongoDB sessions to simulate transaction aborts and verify the retry-exhaustion error path (`DATABASE_ERROR`).
2. **Negative Boundary Matrix for Controllers:** Add negative integration tests for controller error delegates to ensure that database connectivity drops and unexpected internal exceptions are caught and passed to `next(error)`.
3. **Formal Specification Alignment:** Maintain clear labeling in all API documentation that HTTP 501 guards represent safe deferrals, preventing developers from assuming unsupported features are active.
