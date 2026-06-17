# LeClerc full PWA + in-process QVAC on Fly (multi-stage to fit the 8GB rootfs).
#
# Runs the native @qvac/sdk in-process so the SDK-backed Route Handlers work
# online: /api/rag (HyperDB RAG), /api/brief (multi-agent), /api/wallet,
# /api/chat, /api/document. CPU-only here (software Vulkan / lavapipe) — correct
# but slow.

# ---- builder: toolchain + full install + next build (discarded after) ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates curl git python3 build-essential cmake \
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
RUN npm i -g bun@1.3.10

# Built app + node_modules (native @qvac addons intact) from the builder stage.
COPY --from=builder /app /app

ENV NODE_ENV=production REGISTRY_STORAGE=/data/qvac
RUN mkdir -p /data/qvac

EXPOSE 7001
CMD sh -c 'cd apps/app && bunx next start -p "${PORT:-7001}" -H 0.0.0.0'
