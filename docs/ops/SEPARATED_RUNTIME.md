# Independent runtime artifacts

Local implementation checkpoint, 2026-10-06. Production has not switched. Code
activation/rollback commands, Linux CMS proof and complete G6 acceptance remain pending;
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
the shared activation lock. Fixed service adapters/CLI are the next slice.

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
This is a bounded artifact proof, not the full publication/browser/failure matrix G6.

Observed final Mac arm64/Node 22.16.0 CMS build: 10.91 s wall, maximum resident set size
3,530,178,560 bytes with 11 Next workers; no swaps. Fixture archive approximately 34 MB.
These measurements do not establish Linux resource requirements. Linux builder resource
preflight and native startup proof are outstanding; do not add swap/change production
limits or build on an active service host without the concrete plan gate.

## Remaining release gate

G5 still needs code activation/rollback with shared activation locking, exact actual
process probes, immutable retained artifacts and no content/DB/history rollback.
G6 needs the full two-process and browser acceptance matrix on the final exact candidate.
G7 needs fresh deployed SHA, resource/backup/parity evidence, exact service/proxy/OS
permissions delta and separately approved concrete transition. No sandbox data enters
canonical content, Git or production. See the durable separation plan for stop-lines.
