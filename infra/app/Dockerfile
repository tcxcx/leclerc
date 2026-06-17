# LeClerc full PWA + in-process QVAC on Fly (multi-stage to fit the 8GB rootfs).
#
# Runs the native @qvac/sdk in-process so the SDK-backed Route Handlers work
# online: /api/rag (HyperDB RAG), /api/brief (multi-agent), /api/wallet,
# /api/chat, /api/document. CPU-only here (software Vulkan / lavapipe) — correct
# but slow.

# ---- builder: toolchain + full install + next build (discarded after) ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
# No compiler toolchain: @qvac ships linux-x64 prebuilds (the QVAC server image
# installs none either), so bun install just downloads binaries — far less peak
# memory than a from-source build (which was OOM-killing the shared builder).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git \
  && rm -rf /var/lib/apt/lists/*
RUN npm i -g bun@1.3.10
COPY . .
RUN bun install --frozen-lockfile
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
RUN cd apps/app && bun run build
# Prune devDependencies (tailwind, eslint, typescript, babel, types) now that
# the build is done — shrinks the node_modules copied into the runtime stage.
# Done here (toolchain present) so any native prod dep stays prebuilt, not rebuilt.
RUN bun install --production \
  && rm -rf /root/.bun/install/cache /root/.npm

# ---- runtime: minimal — only the QVAC native worker's shared libs ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
# Vulkan loader + software ICD (lavapipe) so llama.cpp/whisper.cpp addons get a
# device on a CPU-only box; ffmpeg for audio; libatomic/libgomp for the addons.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     libatomic1 libgomp1 libvulkan1 mesa-vulkan-drivers ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Built app + node_modules (native @qvac addons intact) from the builder stage.
# No bun in the runtime stage (it added concurrent build-memory pressure that
# OOM-killed the shared builder); start Next with plain node instead.
COPY --from=builder /app /app

ENV NODE_ENV=production REGISTRY_STORAGE=/data/qvac
RUN mkdir -p /data/qvac

EXPOSE 7001
# npm (bundled with the node base) resolves the `next` bin from any ancestor
# node_modules/.bin regardless of bun's hoisting. The app's start script binds
# 7001, matching fly.toml internal_port — no $PORT juggling needed.
CMD sh -c 'cd apps/app && npm run start'
