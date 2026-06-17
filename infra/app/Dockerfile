# LeClerc full PWA + in-process QVAC on Railway.
#
# Unlike the Vercel deploy (UI + /api/qvac proxy only), this image runs the
# native @qvac/sdk in-process, so the SDK-backed Route Handlers work online:
#   - /api/rag    (HyperDB RAG: ingest + grounded recall)
#   - /api/brief  (multi-agent analyst desk)
#   - /api/capture, /api/chat, /api/document, /api/wallet, /api/drop
#
# Base + native deps mirror infra/qvac/Dockerfile (proven on Railway): a software
# Vulkan ICD (lavapipe) gives the llama.cpp / whisper.cpp addons a device on a
# CPU-only container. Inference is CPU-bound here (no GPU) — correct but slow.
FROM node:22-bookworm-slim

WORKDIR /app

# QVAC native worker deps + ffmpeg (audio) + toolchain (fallback if a @qvac/*
# subpackage lacks a linux-x64 prebuild and builds from source).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     libatomic1 libgomp1 libvulkan1 mesa-vulkan-drivers ffmpeg \
     ca-certificates curl unzip git python3 build-essential cmake \
  && rm -rf /var/lib/apt/lists/*

# Pin Bun (repo packageManager) so the workspace install matches bun.lock.
RUN npm i -g bun@1.3.10

# Install deps against the committed lockfile. Copy the whole context (Railway
# .railwayignore already drops node_modules/.next/.git) so workspace packages
# resolve. @qvac/sdk pulls native llama.cpp/whisper.cpp/onnx addons here.
COPY . .
RUN bun install --frozen-lockfile

# Build the Next.js app (route handlers are NOT executed at build time, and
# @qvac/sdk stays serverExternalPackages, so the native worker never loads here).
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
RUN cd apps/app && bun run build

# Persistent model cache: QVAC's registry-client downloads models on FIRST run.
# Mount a Railway volume at /data so the ~GB cache survives restarts.
ENV REGISTRY_STORAGE=/data/qvac
RUN mkdir -p /data/qvac

EXPOSE 7001
# Shell form so $PORT expands. Bind 0.0.0.0 for Railway's proxy.
CMD sh -c 'cd apps/app && bunx next start -p "${PORT:-7001}" -H 0.0.0.0'
