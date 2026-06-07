#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sdkUrl = pathToFileURL(
  path.join(root, "packages/qvacs/node_modules/@qvac/sdk/dist/index.js"),
).href;

const {
  completion,
  getLoadedModelInfo,
  loadModel,
  loggingStream,
  profiler,
  QWEN3_600M_INST_Q4,
  SDK_LOG_ID,
  unloadModel,
} = await import(sdkUrl);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const files = {
  run: path.join(root, "artifacts/logs", `m8-qvac-run-${stamp}.json`),
  log: path.join(root, "artifacts/logs", `m8-logging-stream-${stamp}.log`),
  profilerJson: path.join(root, "artifacts/profiler", `m8-profiler-${stamp}.json`),
  profilerTable: path.join(root, "artifacts/profiler", `m8-profiler-${stamp}.txt`),
  profilerSummary: path.join(root, "artifacts/profiler", `m8-profiler-${stamp}.summary.txt`),
  loadedInfo: path.join(root, "artifacts/hardware", `m8-loaded-model-info-${stamp}.json`),
  hardware: path.join(root, "artifacts/hardware", `m8-system-${stamp}.json`),
};

for (const dir of ["artifacts/logs", "artifacts/profiler", "artifacts/hardware"]) {
  await mkdir(path.join(root, dir), { recursive: true });
}

function run(cmd, args, options = {}) {
  try {
    return execFileSync(cmd, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: options.timeout ?? 10000,
    }).trim();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      stderr: error?.stderr?.toString?.().trim?.(),
    };
  }
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      /serial|uuid|udid/i.test(key) ? "[redacted]" : redact(entry),
    ]),
  );
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function simplifyEvent(event) {
  if (!event || typeof event !== "object") return event;
  if (event.type === "contentDelta" || event.type === "thinkingDelta" || event.type === "rawDelta") {
    return { type: event.type, seq: event.seq, chars: event.text?.length ?? 0 };
  }
  if (event.type === "completionStats") return { type: event.type, seq: event.seq, stats: event.stats };
  if (event.type === "completionDone") return { type: event.type, seq: event.seq, stopReason: event.stopReason };
  return event;
}

async function collectLogs(id, timeoutMs = 8000, max = 80) {
  const logs = [];
  const stream = loggingStream({ id });
  let timedOut = false;
  const timer = new Promise((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve("timeout");
    }, timeoutMs);
  });

  const pump = (async () => {
    try {
      for await (const log of stream) {
        logs.push(log);
        if (logs.length >= max) return "max";
      }
      return "ended";
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })();

  const reason = await Promise.race([pump, timer]);
  await stream.return?.().catch(() => undefined);
  return { id, reason, timedOut, count: logs.length, logs };
}

async function main() {
  const hardwareProfiler = parseJsonMaybe(
    run("system_profiler", ["SPHardwareDataType", "SPDisplaysDataType", "-json"], {
      timeout: 20000,
    }),
  );
  const hardware = {
    capturedAt: new Date().toISOString(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().map((cpu) => cpu.model),
    totalMemoryBytes: os.totalmem(),
    node: run("node", ["-v"]),
    bun: run("bun", ["-v"]),
    macos: run("sw_vers", []),
    cpuBrand: run("sysctl", ["-n", "machdep.cpu.brand_string"]),
    logicalCpu: run("sysctl", ["-n", "hw.logicalcpu"]),
    arm64: run("sysctl", ["-n", "hw.optional.arm64"]),
    hardwareProfiler: redact(hardwareProfiler),
  };
  await writeFile(files.hardware, JSON.stringify(hardware, null, 2));

  const progress = [];
  const events = [];
  let modelId = null;
  let loadedInfo = null;
  let completionText = "";
  let final = null;
  const errors = [];

  profiler.clear();
  profiler.enable({
    mode: "verbose",
    includeServerBreakdown: true,
  });

  const sdkLogs = collectLogs(SDK_LOG_ID, 12000);
  let modelLogs = Promise.resolve({
    id: null,
    reason: "not-started",
    timedOut: false,
    count: 0,
    logs: [],
  });

  try {
    modelId = await loadModel({
      modelSrc: QWEN3_600M_INST_Q4,
      modelConfig: { ctx_size: 2048 },
      onProgress: (p) => {
        progress.push({
          status: p.status,
          percentage: Number(p.percentage?.toFixed?.(2) ?? p.percentage ?? 0),
          downloadedBytes: p.downloadedBytes,
          totalBytes: p.totalBytes,
        });
      },
    });

    modelLogs = collectLogs(modelId, 10000);
    loadedInfo = await getLoadedModelInfo({ modelId });

    const runResult = completion({
      modelId,
      history: [
        {
          role: "system",
          content:
            "Return exactly the sentence supplied by the user, with no markdown and no extra words. /no_think",
        },
        {
          role: "user",
          content: "LeClerc is a local QVAC field station for voice, finance, intel, and P2P.",
        },
      ],
      stream: true,
      captureThinking: true,
      generationParams: {
        predict: 48,
        temp: 0.2,
        seed: 7,
        reasoning_budget: 0,
      },
    });

    for await (const event of runResult.events) {
      events.push(simplifyEvent(event));
      if (event.type === "contentDelta") completionText += event.text;
    }
    final = await runResult.final;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    if (modelId) {
      await unloadModel({ modelId, clearStorage: false, autoClose: true }).catch((error) => {
        errors.push(`unloadModel: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  }

  const profilerJson = profiler.exportJSON({ includeRecentEvents: true });
  const profilerTable = profiler.exportTable();
  const profilerSummary = profiler.exportSummary();
  profiler.disable();

  const logs = await Promise.all([sdkLogs, modelLogs]);
  const runArtifact = {
    capturedAt: new Date().toISOString(),
    sdk: {
      package: "@qvac/sdk",
      verifiedAgainst: [
        "packages/qvacs/node_modules/@qvac/sdk/dist/client/api/completion-stream.d.ts",
        "packages/qvacs/node_modules/@qvac/sdk/dist/client/api/load-model.d.ts",
        "packages/qvacs/node_modules/@qvac/sdk/dist/client/api/logging-stream.d.ts",
        "packages/qvacs/node_modules/@qvac/sdk/dist/client/api/get-loaded-model-info.d.ts",
        "packages/qvacs/node_modules/@qvac/sdk/dist/examples/profiling/basic.js",
        "packages/qvacs/node_modules/@qvac/sdk/dist/examples/logging-streaming.js",
      ],
    },
    model: {
      descriptor: QWEN3_600M_INST_Q4.name,
      modelType: "llamacpp-completion",
      modelId,
      progressSamples: progress.slice(-12),
    },
    completion: {
      ok: errors.length === 0,
      text: completionText.trim(),
      final: final
        ? {
            contentText: final.contentText?.trim?.(),
            thinkingChars: final.thinkingText?.length ?? 0,
            stats: final.stats,
            rawChars: final.raw?.fullText?.length ?? 0,
          }
        : null,
      events,
    },
    artifacts: files,
    errors,
  };

  await writeFile(files.run, JSON.stringify(runArtifact, null, 2));
  await writeFile(files.loadedInfo, JSON.stringify(loadedInfo, null, 2));
  await writeFile(files.profilerJson, JSON.stringify(profilerJson, null, 2));
  await writeFile(files.profilerTable, profilerTable);
  await writeFile(files.profilerSummary, `${profilerSummary}\n`);
  await writeFile(
    files.log,
    logs
      .map((group) => {
        const lines = [`# loggingStream id=${group.id ?? "(none)"} reason=${JSON.stringify(group.reason)} count=${group.count}`];
        for (const log of group.logs) {
          lines.push(
            `${new Date(log.timestamp).toISOString()} [${log.level}] [${log.namespace}] ${log.message}`,
          );
        }
        return lines.join("\n");
      })
      .join("\n\n"),
  );

  console.log(JSON.stringify({ ok: errors.length === 0, files, text: completionText.trim(), errors }, null, 2));
  if (errors.length > 0) process.exitCode = 1;
}

await main();
