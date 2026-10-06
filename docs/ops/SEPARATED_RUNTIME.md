# Independent runtime artifacts

Local implementation checkpoint, 2026-10-06. Production has not switched. Fixed code activation/rollback commands and service templates are implemented locally.
Linux CMS proof and complete G6 acceptance remain pending;
this file is not permission to change services, proxy, accounts or real data.

## Build and verify

From the exact clean target checkout:

```sh
npm run portfolio:build
npm run portfolio:package
npm run cms:build
npm run cms:package
npm run cms:verify -- /absolute/unpacked/cms-release
```

CMS release packaging requires a clean exact built HEAD on Linux. Its manifest binds
source SHA/hash, schema hash, producer capabilities, platform/architecture/Node major/libc,
native binary headers, all regular file bytes/modes and confined relative dependency
links. The public artifact has its own independent build identity. No CMS build invokes
the Portfolio compiler or reads canonical content, authoring data or a live secret.

Source `.env` and all `.env.*` files are refused before Next loads them. Artifact
verification refuses environment files, `.local*`, USERSPACE, authoring DB/secret paths,
special files and escaping/absolute links. Runtime configuration belongs outside code.

Extract into a new retained directory using `tar -xzpf <archive> -C <directory>`.
Preserve signed file modes and relative links; ordinary extraction under a different
umask can change modes and correctly fail verification. Do not replace an active
artifact directory. Verify before switching a descriptor or starting a process.

The packaged CMS verifies itself without Git/build tooling:

```sh
node /absolute/cms-release/tools/payload-admin/scripts/artifact-start.mjs verify
```

Starting that same entry with no arguments requires explicit server/fixture mode,
private data root, external delivery paths, a loopback Portfolio origin and a current
compatible authoring schema/public generation. It reads the existing protected secret
only under lifetime ownership; it never prepares/migrates/bootstrap-publishes data.
Runtime children receive a whitelist environment. Public code receives no CMS secret.

Mac packaging is available only with `--fixture`; it is not production eligible. A
Linux artifact must be built and tested on its actual target architecture/libc. Do not
transfer or strip Mac native modules to make a Linux artifact.

## Lifetime ownership and health

A visible `<data-root>-lock` always has a durable owner. A separate empty coordination
SQLite file `<data-root>-lock.maintenance.db` serializes short ownership transitions;
it is not the authoring DB or part of its schema. OS locks release after a crash.

The child PID is durably installed before Payload imports. Supervisor IPC disconnect
terminates the writer; finished maintenance does not stay alive because of IPC. Dev
starts the installed Next server directly so the tracked PID is the actual writer.
Explicit shutdown prevents a config/memory restart from starting another writer.
Release never removes a lock containing a live child. Explicit `storage -- unlock`
refuses live/unknown owners or a listening server and retires a verified dead lock.

`/api/internal/cms-health` is loopback only, with exact transport Host/proxy checks.
It reports actual CMS build ID, actual read-only schema hash, producer capabilities
and confirmed lifetime writer identity, plus the captured code activation sequence. Next normalizes Request.url; URL origin is
not used in place of the transport Host. Proxy denial remains part of the G7 gate.
Public health reports actual serving build/renderer separately from the renderer that
validated the active content. A code conflict never causes content rollback.

## Selected code launchers

Each artifact includes a source-independent launcher: public `ops/active-start.mjs`
and CMS `tools/payload-admin/scripts/active-start.mjs`. They read an explicit absolute
`PORTFOLIO_ACTIVE_RELEASE` / `PAYLOAD_ACTIVE_RELEASE` descriptor. Optional adjacent
`<descriptor>.state.json` contains confirmed and selected releases with monotonic
activation sequences and operation IDs. Launchers verify selected immutable code;
preview/publication accept only fully confirmed matching Portfolio state. Malformed
metadata and unrelated crash-state pointers fail closed. Legacy absent metadata is
initial epoch zero only.

The CMS launcher retains its lifetime root owner across SIGUSR2 reload. It stops only
its owned writer, waits for actual exit, checks the selected artifact/schema/public
compatibility and existing secret under the retained lock, then registers the new
writer before importing Payload. Supervisor PID and lock token remain unchanged;
writer PID and code epoch change. SIGINT/SIGTERM suppress pending reload. This signal
is a mechanism, not an activation command: the journaled controller selects, verifies actual health and confirms a release under
the shared activation lock. Fixed service adapters/CLI are included in both packages.

CMS restart/reload invalidates existing in-memory private preview capabilities;
reload the preview to issue a new capability. Portfolio-only releases keep CMS PID
and its issued snapshot capabilities; retained old renderer artifacts remain required.
No capability persistence format or preview TTL behavior has changed.

Code controller requests bind a unique operation ID, app, exact expected confirmed
slot and verified target descriptor. Pending state gates new public authority. Retries
reconcile known pointer/process combinations, while unrelated build/epoch identities
fail closed. Explicit abort of a selected failed operation returns to its prior
confirmed artifact using a new epoch. Every retry/rollback checks current content;
content descriptors, DB/history and secret are never restored from a code receipt.
Receipt recovery finishes an earlier confirmed operation before a newer selection
can consume its slot. Historical completed requests return only their receipt.

All referenced artifact directories are retained; descriptors are recorded by full
path/identity under private delivery `retained-code`. There is no garbage collection.
Keep the current code, at least two previous compatible artifacts and every renderer
referenced by issued preview capabilities. Do not remove/replace artifact directories.
Private readiness requests close connections and consume response bodies: repeated
keepalive polling can delay Next graceful HTTP shutdown. Closed HTTP port alone never
proves writer exit or permits releasing/replacing lifetime ownership.

## Fixed service controller CLI

Both artifacts include `code-cli.mjs`: public `ops/code-cli.mjs`, CMS
`tools/payload-admin/scripts/code-cli.mjs`. Invoke a verified immutable package entry:

```sh
node /absolute/portfolio-release/ops/code-cli.mjs /absolute/controller.json state portfolio
node /absolute/portfolio-release/ops/code-cli.mjs /absolute/controller.json state cms
node /absolute/portfolio-release/ops/code-cli.mjs /absolute/controller.json apply /absolute/intent.json
```

`state` reads descriptors/selected/confirmed slots without running systemctl. `apply`
requires Linux-eligible verified packages. An intent has exactly `version: 1`, a new
unique `operationId`, `app` (`portfolio` or `cms`), `expected` (the complete current
confirmed slot from `state`), `target` (the complete verified retained release
descriptor) and `aborts: null`. Persist this exact intent outside code before applying;
retry the same bytes/ID after an uncertain response. Never substitute a later expected
slot into an existing operation. Ordinary rollback is a new intent targeting a retained
compatible descriptor. To explicitly abort a pending selection, use its prior confirmed
release as target and its operation ID as `aborts`, with a new operation ID.

`tools/portfolio-runtime/ops` contains templates, not installed configuration. They
propose fixed separate units/users, immutable launcher copies, external environment
files and loopback ports. The controller checks loaded unit paths, exact executable
and arguments, empty lifecycle hooks and execution privilege flags, restrictive
service settings, actual process UID and PID-correlated health before mutations.
Public releases restart only the public unit; CMS releases signal only its stable
supervisor with SIGUSR2. A stopped service must have no remaining cgroup processes and
an explicitly refused loopback connection. Unknown ownership/profile fails closed.
Linux target requires systemd 252 or newer, cgroup v2 and compatible Node 22; confirm
these in the actual preflight. Systemd property/command references:
[systemctl documentation](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html)
and [v252 show serializer](https://github.com/systemd/systemd/blob/v252/src/systemctl/systemctl-show.c).

Code descriptors/state are explicitly mode 0644 even under umask 077; private journals
remain 0600 in 0700 directories. Actual shared parent traversal/ownership and private
root denial must be verified using both service users on Linux. CMS needs write access
to the derived published root; public gets only read access and cannot access the
private authoring root. Proxy templates route `/payload-assets` (including preview
fonts) and private preview to CMS, public pages to Portfolio, and deny both internal
health namespaces. Installing users/units/proxy, assigning filesystem ownership and
choosing actual ports is the concrete G7 delta; templates are not fresh production proof.

## Packaged lock maintenance

The CMS package includes `tools/payload-admin/scripts/artifact-maintenance.mjs`.
Use the verified immutable package, explicit server runtime/data root/port environment,
and a stopped CMS. It verifies package eligibility before lock changes:

```sh
node /absolute/cms-release/tools/payload-admin/scripts/artifact-maintenance.mjs unlock
node /absolute/cms-release/tools/payload-admin/scripts/artifact-maintenance.mjs recover-activation
```

`unlock` retires an existing CMS root lock only when its local parent and child are
proven dead and the configured loopback port is closed. `recover-activation` first
acquires exclusive CMS root ownership. It can retire only a regular recovery-claim
directory containing exactly a valid `owner.json` for a proven dead local PID; live,
foreign, unknown or malformed claims remain. It then takes/releases the ordinary
activation lock, safely recovering a dead activation owner or refusing a concurrent
live controller. A competing code controller can cause a safe failure; retry only after
checking its actual status. The command never reads the secret/authoring database,
changes content pointers or performs schema/bootstrap/data restore. Existing restore
journals block maintenance rather than being interpreted as authorization to restore.
If CMS root ownership itself is stale, explicitly run `unlock` first. These operational
commands do not authorize production mutations before the G7 gate.

## Disposable proof

With current independent public and CMS builds:

```sh
npm run separation:test
node --test tests/payload-artifact.test.mjs tests/payload-writer-lifecycle.test.mjs
node tools/payload-admin/scripts/test-writer-dev.mjs
```

The harness uses a fresh whitelist child environment and disposable roots. It packs,
extracts/verifies CMS, starts two artifact processes, initializes a synthetic empty
public generation, registers a fixture account, saves a draft and restarts CMS. It
checks stable reload token/parent/actual writer exit/epoch and session/data/secret/content preservation and stops only its own processes.
It also exercises actual saved-revision HTTP headers and native target-only Publish, private draft/preview and raw-file/API
guards, completed retry, Unpublish/Delete empty delivery and old asset hashes while CMS
is stopped. Distinct sourceDirty synthetic host-byte artifacts prove code-only update/rollback
and explicit abort after failed public/CMS startup using real processes. They do not
prove independent source builds or renderer fidelity. Full browser/failure matrix on
the exact final clean candidate and Linux native/systemd proof are still pending.

Observed final Mac arm64/Node 22.16.0 CMS build: 10.91 s wall, maximum resident set size
3,530,178,560 bytes with 11 Next workers; no swaps. Fixture archive approximately 34 MB.
These measurements do not establish Linux resource requirements. Linux builder resource
preflight and native startup proof are outstanding; do not add swap/change production
limits or build on an active service host without the concrete plan gate.

## Remaining release gate

G5 still needs actual Linux native/service/resource proof. Code controller and fixed service adapters are implemented;
actual distinct-artifact rollback/failure acceptance remains part of G6.
G6 needs the full two-process and browser acceptance matrix on the final exact candidate.
G7 needs fresh deployed SHA, resource/backup/parity evidence, exact service/proxy/OS
permissions delta and separately approved concrete transition. No sandbox data enters
canonical content, Git or production. See the durable separation plan for stop-lines.

## Existing verification entry points

After building both artifacts, `npm --prefix tools/payload-admin run test:smoke`
and `node tools/payload-admin/scripts/release-proof.mjs` run the same disposable
two-process acceptance harness as `npm run separation:test`. They no longer start
the combined app, publish directly through native REST, or export snapshots from
an inherited authoring root. They accept no arguments (`--keep` is rejected).
The harness uses generated artifacts, fresh temporary fixture data and approved
synthetic media, verifies owned process/build health before authenticated writes,
and stops only its own processes. It also compiles committed synthetic source edits
in disposable copies to prove public-only and Admin-only updates. Existing dependency
versions are reused; the CMS copy requires about 1.4 GB for dependencies plus temporary
build/package output. Git/build tools are used only in the fixture builder, never
in the isolated serving processes. Baseline working-checkout artifacts must already
exist. No production settings are read; Linux eligibility and final browser parity
remain separate acceptance gates.

CMS release build checks its source/runtime import graph with a generated TypeScript
config. Run `npm --prefix tools/payload-admin run typecheck` separately for the full
source/tests/OPS graph. The release build itself does not require Portfolio test or
exporter sources.
