# Linux x86-64: сборка и локальная проверка

Проверенный clean source: `bc0883f5d84812b36463e0427f3aa144c60a892a`.
От `7d6767607d12dd3e0b4d42f9a02ee54fc00ec66f` отличаются только checkpoint/evidence
документы; application code не менялся. Этот отчёт не утверждает проверку
последующего documentation HEAD. Production не переключён.

## Среда и provenance

Docker Desktop на Mac, explicit local `desktop-linux` context, Linux x64 через
`--platform linux/amd64`, Node 22.16.0, glibc 2.36. Official Node image:
`node@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716`.
Source взят из Git bundle clean HEAD; dependencies установлены по lockfiles внутри
нового Linux volume. Host node_modules, local drafts и credentials не копировались.

Read-only VPS preflight: x86_64, glibc 2.39, Node 22.23.2, systemd 255, cgroup v2.
RAM 1967 MiB, available 1147 MiB; swap 511 MiB, free 146 MiB; disk free около 15 GiB.
Это observation, а не резервирование ресурсов или разрешение release.
Docker build memory limit 6 GiB; действующий VPS не использовался для сборки.

## Code-only артефакты

| Значение | Portfolio | CMS |
| --- | --- | --- |
| artifactSha256 | `b643360eb92a558e415604d8aca2967237588044ad1796a4f56468cf8b9ae689` | `45ce60340734cda3a7ba81a397a9c0ad0da6a9778392d8ae2d8975f636e5bef1` |
| Archive SHA-256 | `b331489773ec777c7ec4dc54d9ec889b3bf38f63f4764f1cfcc6fe3d1d95f636` | `ee3dcb150cfbff430d8e44cf851c60cd5618abbb5768003da70fed6c4193522d` |
| Archive bytes | 28,269,674 | 47,015,942 |
| Extracted Linux disk KiB (`du -sk`) | 31,444 | 144,736 |

Renderer: `e4ceea6c47ad3ea86db69bc125cd2a1506236d5497371a4f0361d510356f31b6`.
CMS package verifier: Linux/x64/glibc/Node22, `productionEligible: true`.
Это eligibility package verifier, не итоговая production acceptance или deployment.
Архивы локально: `/private/tmp/des-art-payload-test-linux-amd64-qylb49c2/portfolio.tar.gz`
и `cms.tar.gz`; OS-temp retention не гарантируется. Только code, без sandbox store.

## Проверки

- Обе независимые source builds и штатные package/verify: PASS.
- Payload artifact/writer lifecycle + service adapter matrix: 19/19.
- Actual SQLite publication rejection/durability confirmation/explicit retry: PASS.
- Полный `separation:test`: PASS, container exit 0, OOM false. Реальные два процесса,
  публикация/приватность/HTTP response loss/concurrency, новые source builds каждого
  приложения, independent reload/rollback/startup failure abort, receipt replay после
  CMS restart, public cold restart при stopped CMS и retained asset hashes проверены.
- Сохранённые exact archives отдельно распакованы/запущены на новом disposable root:
  readiness и code identities совпали с таблицей; штатный stop, container exit 0.
- Linux filesystem isolation: реальный UID CMS может писать public/private roots;
  другой UID читает public 0644/0755, не пишет public и не входит в private 0700.
  Это standalone DAC probe, не установленные production service users или units.
- Exact tracked service templates: `systemd-analyze verify` на systemd 252 PASS.
  Exact proxy location template в disposable server block: `nginx -t` 1.22.1 PASS.
  Это syntax verification; реальные systemd lifecycle/cgroup команды не выполнялись.

## Ресурсы builder и fixture

| Измерение | Portfolio | CMS |
| --- | --- | --- |
| Build wall time | 15.65 s | 28.11 s |
| GNU time maximum RSS | 518,196 KiB | 3,023,316 KiB |
| Warm idle process-tree RSS | 96,904 KiB | 344,180 KiB |

Build RSS — reported GNU time maximum, не сумма одновременных процессов. Idle —
10 samples с интервалом 1 s после initialization, с проверенными PID/build identity;
не длительный soak/load test. Измерено в эмулируемом Docker x64 на Mac, не на VPS;
время/RSS не доказывают production capacity. Build fixtures завершились exit 0.

## Оставшиеся условия

Actual systemd service lifecycle/cgroup/UID/closed-port proof пока отсутствует.
Установка split users/units/proxy на VPS относится к отдельно разрешаемому G7.
Для полного локального proof нужна подходящая изолированная systemd-среда;
обычный Docker container не заменяет этот proof.

Physical Experience acceptance открыта: пользователь сообщил слишком быструю
прокрутку трекпадом, мышь пока недоступна. Настройки реально загруженного JS и
baseline совпадают (`smoothWheel: true`, `lerp: 0.1`, `wheelMultiplier: 1`, travel
`9690/1.1`); Lenis enabled. Причина субъективной скорости пока не установлена,
физическое прохождение не считается PASS. Application parameters не менялись.
G7/A12 не выполнялись. Полная G1–G6 приёмка остаётся INCOMPLETE.
