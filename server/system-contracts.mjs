// Authoritative v3 contracts. Earlier staged contracts stay archived for history.
export const systemContracts={
 checkout:`Request data: tenant identifies the store; actor.tenant identifies the caller. catalog lists product id and authoritative integer price in cents. stock maps product IDs to available quantities. requests contains checkout key, items (id and qty), and optional discount cents.

Authorization: reject each request from another tenant with status "denied". Do not trust client-supplied item prices. Product IDs may be arbitrary strings.

Validation: require nonempty items, known catalog and stock IDs, and integer item quantities from 1 to 99. Aggregate repeated products before checking stock. Invalid requests return status "invalid"; insufficient stock returns "unavailable". Neither may change stock or reserve an idempotency key.

Idempotency: canonicalize aggregate quantities by sorted product ID. A successful key binds to those quantities and the discount. Replay the same payload as status "replayed" with its original total BEFORE checking current stock. A changed payload using that key returns "conflict".

Commit: discount defaults to zero and must be an integer from zero through subtotal. Validate the entire request before deducting any stock. Success returns status "created" and total after discount. Return the final stock object and ordered results array.`,
 policy:`Request data: actor has tenant and roles; resource has tenant and path; action names the operation; now is the current integer time. Each rule supplies effect (allow or deny), role, action, path and optional expires.

Tenant boundary: an actor can never access another tenant. Default to false. Reject resource paths containing a ".." segment, backslash or percent sign, including for administrators.

Rule matching: actor roles contain the rule role; the rule action equals the requested action or "*". An exact path matches exactly. A "*" path matches any valid path. A segment wildcard such as "/orders/*" matches descendants, including deeper descendants, but not "/orders" or "/orders-evil/x".

Expiry and precedence: ignore a rule when expires is supplied and now is greater than or equal to expires. Zero is a meaningful expiry. Any matching deny overrides all matching allows, across all roles. Duplicates do not change the decision. Return a boolean.`,
 limiter:`Request data: limit is a nonnegative integer quota; window is a positive duration. requests arrive in nondecreasing integer time order. Each request identifies tenant and user, with time, cost and optional id. A reset request instead has reset=true.

Quota: count only accepted costs in the interval strictly after time-window and through time. Accept a positive integer cost only when the current sum plus cost is at most limit. Rejects consume no quota. Tenant/user identity is a pair, so delimiter-containing names cannot collide.

Retry identity: remember accepted request IDs separately for each tenant/user. The same ID, time and cost replays true without consuming quota. A changed payload returns false. Rejected IDs remain reusable; accepted IDs remain remembered after the quota window expires.

Reset: clear the current quota window for that tenant/user, preserve accepted ID history and return true. Other namespaces are unaffected. Return an ordered array of booleans. Arbitrary string IDs and exact expiry boundaries must be safe.`,
 cache:`Request data: capacity is a nonnegative integer. Chronological events are put, get or delete. Each identifies tenant, key and time. Put also supplies value, nonnegative integer ttl and optional ifVersion.

Expiry and capacity: before every event purge ALL entries with expiry less than or equal to event time. Namespaces are tenant/key pairs. Successful gets and puts refresh global LRU recency. Evict the globally least recently used live entry when needed.

Reads and deletes: a missing get returns null. Stored false, zero, empty string and null are real hits and refresh recency. Delete returns whether a live entry existed and never affects another tenant.

Writes: ifVersion, when supplied, must equal the live entry version, or zero when absent. A failed condition returns false without changing data or recency. A successful put increments the prior live version, starting at one when absent, and returns true. ttl=0 deletes the key and stores nothing. Capacity zero stores nothing, while a successful put still returns true. Return one result per event.`,
 routing:`Request data: servers is an ordered list of unique IDs, positive integer weights, healthy flags and nonnegative capacities. events requests a route, changes a server's health/configuration, or releases one in-flight request. All scores and in-flight counts start at zero.

Routing: eligible means healthy AND in-flight count below capacity. Add each eligible server's weight to its current score; choose the highest score, breaking ties by original server order. Subtract the total eligible weight from the winner, increment its in-flight count and return its ID. No eligible server returns null. Ineligible servers retain their scores.

Release: decrement the named server's count, clamped at zero, even if unhealthy. Return null.

Health/configuration updates: apply the supplied healthy flag and any supplied weight or capacity. Reset only that server's score to zero; preserve its in-flight count. A reduced capacity blocks new assignments until count falls below it. Unknown server IDs do nothing. Health/release events return null. Return results in event order.`,
 pipeline:`Request data: jobs have unique string IDs, dependency IDs, positive integer cpu, integer priority, and optional mutex/exclusive fields. budget is a positive integer CPU budget per wave. There are at most 500 jobs.

Validation: a missing dependency, dependency cycle or any job whose cpu exceeds budget makes the entire plan null. Duplicate dependencies count once. Dependencies must complete in earlier waves, never the current wave.

Scheduling: sort all ready jobs by descending priority, then lexicographic ID. Scan that order greedily, admitting each job that fits the remaining CPU budget and mutex constraints. Skip a non-fitting job and continue scanning. Unselected ready jobs remain eligible for the next wave.

Isolation: two jobs with the same nonempty mutex cannot share a wave. An exclusive=true job must run alone: skip it when a wave already contains a job; if chosen first, end that wave immediately.

Return arrays of accepted job IDs, one array per execution wave, preserving selection order. An empty job list returns an empty array.`,
 retrieval:`Request data: tenant selects the namespace; query is a finite numeric vector; documents have id, tenant, vector, revision and optional deleted/tags. k is a nonnegative integer result limit. Vector dimensions match. Optional request tags are an AND filter.

Version resolution: filter to the requested tenant first. For each document ID choose the greatest revision, breaking revision ties by earliest original position. Remove a winning deleted version. Never resurrect an older version after deletion or tag filtering.

Tag filtering: require every requested tag to appear in the winning document's tags, treating missing tags as empty. Duplicate requested tags do not alter the result.

Ranking: cosine similarity descending, with zero-vector similarity defined as zero. Round similarity to eight decimal places for comparisons. Break ranking ties by the winning version's original position. Return up to k document IDs. k=0 returns an empty array.`,
 journal:`Request data: tenant and an arrival-ordered event list. Events have eventId, tenant, paymentId, nonnegative integer version, status (pending, paid or refunded), and amount cents.

Identity: filter the tenant first. Within that tenant, the first eventId occurrence consumes the ID even if stale, invalid or rejected by transition rules. An event from another tenant does not consume an ID here.

Versions: each payment accepts strictly newer versions only; version zero is valid for an initial event. An initial amount must be a nonnegative safe integer. Rejected events do not advance the payment version.

Transitions: an initial event may have any permitted status. Once paid, reject a later pending state. Once refunded, reject later pending or paid states. For an existing payment, reject an event that changes amount. A rejected transition still consumes its eventId.

Return the current paymentId, version, status and amount for each accepted payment, ordered lexicographically by paymentId.`
};
