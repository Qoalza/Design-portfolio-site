import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PublishCommandError } from "./admin-errors.mjs";

const SECRET_PATTERNS = [
  [/\b(?:gh[opsu]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, "[REDACTED]"],
  [/(authorization\s*:\s*(?:bearer|token)\s+)[^\s]+/gi, "$1[REDACTED]"],
  [/(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi, "$1[REDACTED]@"],
  [/((?:password|passwd|token|secret|private[_-]?key)\s*[=:]\s*)[^\s]+/gi, "$1[REDACTED]"],
];

export function sanitizeDiagnosticText(value) {
  let result = String(value ?? "");
  for (const [pattern, replacement] of SECRET_PATTERNS) result = result.replace(pattern, replacement);
  return result;
}

export function classifyCommandFailure(error) {
  const source = `${error?.message ?? ""}\n${error?.stderr ?? ""}`;
  if (/authentication failed|could not read username|bad credentials|http basic: access denied/i.test(source)) {
    return { failureCode: "AUTHENTICATION_FAILED", retryable: false };
  }
  if (/permission denied|repository not found|remote: write access.*not granted|403 forbidden/i.test(source)) {
    return { failureCode: "PERMISSION_DENIED", retryable: false };
  }
  if (/could not resolve host|name or service not known|nodename nor servname/i.test(source)) {
    return { failureCode: "DNS_UNAVAILABLE", retryable: true };
  }
  if (/http\/2|rpc failed|curl 92|stream .* was not closed cleanly/i.test(source)) {
    return { failureCode: "HTTP2_RPC_RESET", retryable: true };
  }
  if (/timed? out|connection reset|connection refused|network is unreachable|temporary failure|unexpected disconnect|remote end hung up unexpectedly/i.test(source)) {
    return { failureCode: "NETWORK_UNAVAILABLE", retryable: true };
  }
  return { failureCode: "COMMAND_FAILED", retryable: false };
}

export async function recordPublishCommandFailure({ diagnosticRoot, jobId, failedOperation, command, args = [], error, attempt = 1 }) {
  const diagnosticId = randomUUID();
  const { failureCode, retryable } = classifyCommandFailure(error);
  const exitCode = Number.isInteger(error?.code) ? error.code : null;
  const lines = [
    `jobId=${sanitizeDiagnosticText(jobId)}`,
    `operation=${sanitizeDiagnosticText(failedOperation)}`,
    `attempt=${attempt}`,
    `command=${sanitizeDiagnosticText([command, ...args].join(" "))}`,
    `exitCode=${exitCode ?? "unknown"}`,
    `failureCode=${failureCode}`,
    "stderr:",
    sanitizeDiagnosticText(error?.stderr ?? error?.message ?? "No diagnostic output."),
  ];
  await mkdir(diagnosticRoot, { recursive: true, mode: 0o700 });
  await writeFile(path.join(diagnosticRoot, `${diagnosticId}.log`), `${lines.join("\n")}\n`, { mode: 0o600 });
  throw new PublishCommandError({ failedOperation, failureCode, exitCode, retryable, attempt, diagnosticId, cause: error });
}

export function createPublishCommandRunner({ diagnosticRoot, jobId, execImpl }) {
  if (typeof execImpl !== "function") throw new TypeError("execImpl is required.");
  return async function runPublishCommand(failedOperation, command, args, options = {}, attempt = 1) {
    try {
      return await execImpl(command, args, options);
    } catch (error) {
      return recordPublishCommandFailure({ diagnosticRoot, jobId, failedOperation, command, args, error, attempt });
    }
  };
}
