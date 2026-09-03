# Planning rules

**Version:** 2.0
**Role:** Project planning standard that extends the active `AGENTS.md`.

This file governs structured implementation plans. It does not replace task-specific requirements or repeat repository, Git, safety, production, approval, risk, review, or model-routing rules already defined elsewhere.

## 1. Applicability and control

Follow the active instruction hierarchy and authorization boundaries. Surface a material conflict instead of silently weakening either rule.

Apply this file when:

- Plan Mode is active;
- the user explicitly requests a structured implementation plan;
- a plan will be approved before implementation;
- a durable ExecPlan is created or updated;
- a plan is used for a Goal;
- a plan is handed to another executor, model, session, or context.

Do not apply the full process to private sequencing, a short checklist, progress reporting, completed-work summaries, or a local diagnostic sequence.

Planning creates no new approval gate.

- If implementation is already authorized, plan, review, and continue without asking for separate approval.
- If the user requested planning only, return the plan and stop; do not add a ritual approval question.
- Ask the user only for a material unresolved product/architecture decision, a new authorization, a material change to scope/contract/risk/acceptance, or an action protected by existing approval rules.
- If explicit approval occurred, it locks the outcome, boundaries, acceptance criteria, explicit decisions, and material implementation commitments—not incidental technical details.

Inherit `OPTIMIZED/FULL`, size, risk, and model routing from `AGENTS.md`; do not create another classification. A triggered `SMALL + LOW` task uses the compact `OPTIMIZED` form; without a trigger it remains in the normal micro-flow. Planning alone does not justify a more expensive model.

First meet the inherited quality and safety floor. Among plans that meet it, prefer the lower expected total cost across planning, execution, user intervention, failure risk, and rework. Spend more only when it materially reduces a named risk or expected rework.

## 2. Discovery, context, and readiness

Use a **Discovery Plan** only when a material unknown may change scope, architecture, behavior, risk, acceptance criteria, source of truth, migration, or another material decision. A harmless local unknown does not require Discovery.

A Discovery Plan contains:

- **Question / outcome**;
- **Confirmed baseline and material unknowns**;
- **Targeted investigation**;
- **Decision and exit criteria**.

Discovery ends when the unknowns capable of changing the result are resolved. Do not continue only for unspecified extra confidence. A plan grants no new permissions; investigation must stay within existing authorization.

Use an **Execution Plan** when material facts and decisions are sufficiently confirmed and the intended executor can proceed without inventing unowned product or architecture decisions.

Start from the stated target, nearest likely implementation boundary, active instructions, and nearest relevant source of truth. Expand context only while a material unknown, dependency, approval boundary, or blast-radius question remains.

For shared/reused behavior, a public contract, schema, persistence, permissions, or an unconfirmed boundary, perform one high-signal disconfirmation check using the most informative nearby consumer, producer, test, reference, or contract. Do not inspect all categories by default. Expand further only if that check reveals a material contradiction or wider blast radius.

Planning is ready to stop when:

- outcome and scope are bounded;
- material unknowns are resolved or assigned to Discovery;
- acceptance criteria are observable;
- material decisions, dependencies, approval boundaries, and stop-lines are clear where applicable;
- the intended executor can proceed without unowned decisions;
- remaining choices are local and cannot materially change behavior, scope, architecture, risk, or verification.

Do not add detail, reads, sections, or review passes unless they reduce a concrete ambiguity, dependency, blast-radius uncertainty, approval issue, or execution risk.

## 3. Execution Plan contract

Do not output empty sections or repeat general `AGENTS.md` rules. Include only task-specific content.

### OPTIMIZED

Use the shortest form that remains executable:

- **Outcome**;
- **Confirmed target / baseline**;
- **Scope / non-scope**;
- **Ordered steps**;
- **Acceptance and checks**;
- **Stop-line** or **Handoff notes** only when applicable.

### FULL

Include the applicable core:

- outcome and confirmed source of truth;
- scope, required adjacent impact, and non-scope;
- material assumptions, residual non-blocking unknowns, and explicit decisions;
- ordered steps and material dependencies;
- observable acceptance criteria and verification;
- approval boundaries.

Add risks, rollback, migration, production stop-lines, durable version/baseline, or portable handoff material only when required.

Keep scope narrow but complete. Include direct requirements and only the confirmed adjacent consumers, producers, contracts, states, tests, schemas, or paths needed for correctness within the material blast radius. Exclude speculative hardening, unrelated cleanup, optional refactoring, broad audits, and “while we are here” work.

Each substantial step must state:

`Target → Change → Expected result → Verification`

Add `Preserve` only for a specific critical invariant that is easy to violate; put shared invariants once at plan level. Add rationale or extra detail only when it removes real ambiguity or execution risk.

Acceptance criteria describe observable outcomes. Code presence alone is not proof of completion.

## 4. Plan review, approval, and versioning

Plan-review depth follows inherited size and risk:

- **SMALL + LOW, isolated and deterministic:** no separate review pass; ensure outcome, scope, and checks remain internally consistent while drafting.
- **MEDIUM or ELEVATED:** one bounded plan review.
- **LARGE, HIGH, FULL, shared/public contract, migration, production, or material handoff:** one adversarial plan review.
- **Junior handoff:** plan review and suitability checking are mandatory.

Review for missing requirements, invented facts, ambiguity, hidden decisions, unnecessary scope, unconfirmed blast radius, weak acceptance criteria, unsafe assumptions, and work the selected executor would have to redesign. Fix confirmed defects and recheck only the corrected parts. Do not keep improving after readiness is met.

Review is silent by default. Do not emit a ritual review trace. For a durable or transferred plan, expose one actionable state:

- `Ready for discovery`;
- `Ready for execution`;
- `Blocked`.

Mention corrections only when they materially change something the user needs to know.

If explicit approval occurred, a material change to the locked outcome, boundaries, acceptance, explicit decisions, risk, or commitments requires an updated plan and renewed approval. Local adaptations that preserve them do not.

Use plan IDs, versions, status, repository/branch, or baseline commit only for durable, revised, transferred, long-running, or otherwise ambiguous plans.

## 5. Goal, portability, and handoff

Create a Goal only when explicitly requested or required by the active workflow. A plan or approval alone does not require a Goal.

Use the actual Goal mechanism. Preserve at least the authorized outcome and a verifiable completion condition; add material constraints, boundaries, iteration policy, or blocked stop-condition only when relevant. Do not copy detailed plan steps into the Goal.

Reference an exact accessible plan version/location only when needed. If the execution context cannot reliably access the plan, provide a compact portable handoff instead of relying on an inaccessible reference.

In the same repository and instruction context, inherit `AGENTS.md` and include only task-specific autonomy, deviations, stop-lines, checks, and handoff notes. If inheritance is uncertain, include a compact self-contained contract: outcome, scope boundaries, acceptance criteria, critical invariants, authorized autonomy, deviation/stop conditions, applicable review depth, required checks, and completion condition.

Before junior or cross-context handoff, verify that the executor will not need to choose product behavior, architecture, source of truth, migration policy, risk acceptance, or acceptance criteria.

A failed suitability check is first a planning defect:

1. make the plan more concrete within the authorized scope;
2. close decisions the planner can safely own;
3. clarify targets, dependencies, results, invariants, and checks;
4. recheck suitability.

If it still fails because of task complexity, missing authority, or a genuinely unowned decision, do not hand it off. Continue Discovery, retain a stronger executor, or request only the specific user decision or authorization required.

## 6. Execution inheritance and prohibitions

Execution Plans inherit the implementation-review and completion floor from `AGENTS.md`. Add only task-specific review targets, checks, evidence requirements, and any justified increase in review depth. A portable handoff must carry the applicable review depth when the executor cannot inherit the same instructions.

Never:

- create approval merely because planning occurred;
- trigger the full process for private sequencing;
- create Discovery for a harmless local unknown;
- scan broadly for the appearance of completeness;
- broaden scope with speculative work;
- leave material product or architecture choices to a junior executor;
- duplicate general rules or copy the full plan into a Goal;
- escalate model cost solely because planning is active;
- emit empty sections, ritual traces, or evidence theatre;
- run planning-policy A/B tests or fixtures during normal task execution;
- claim readiness before the inherited review depth and final affected checks are complete.
