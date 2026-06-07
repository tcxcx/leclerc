#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SNAP_DIR="$PROJECT_DIR/snap"
LOCAL_DIR="$SNAP_DIR/local"
BUILD_DIR="$PROJECT_DIR/build/snap"

APPIMAGE_PATH=""
UNPACKED_PATH=""
ARCH=""
VERSION=""
SNAP_OUT=""

log_info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
log_ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
log_error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") (--unpacked <dir> | --local <AppImage>) [--arch arm64|x64]

Options:
  --unpacked <dir> Path to electron-builder's linux-*-unpacked directory
                   (preferred — skips AppImage round-trip and avoids
                   mksquashfs glibc issues on newer hosts).
  --local <path>   Path to a locally-built AppImage. Used as a fallback
                   when --unpacked is unavailable.
  --arch <arch>    Target architecture (default: auto-detect)
  -h, --help       Show this help message

Examples:
  $(basename "$0") --unpacked ./out/linux-arm64-unpacked
  $(basename "$0") --local ./out/PearPass.AppImage
EOF
    exit 0
}

detect_arch() {
    local machine
    machine="$(uname -m)"
    case "$machine" in
        x86_64)  echo "amd64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) log_error "Unsupported architecture: $machine"; exit 1 ;;
    esac
}

check_prerequisites() {
    local missing=()
    command -v snapcraft >/dev/null 2>&1 || missing+=("snapcraft")

    if (( ${#missing[@]} )); then
        log_error "Missing tools: ${missing[*]}"
        log_error "Install snapcraft: sudo snap install snapcraft --classic"
        exit 1
    fi

    # snapcraft 8+ on core22 needs lxd (default) or multipass as a backend.
    if ! command -v lxd >/dev/null 2>&1 && ! command -v multipass >/dev/null 2>&1; then
        log_error "snapcraft needs an LXD or Multipass backend"
        log_error "  sudo snap install lxd && sudo lxd init --auto && sudo usermod -aG lxd \$USER"
        log_error "  (then log out and back in, or run: newgrp lxd)"
        exit 1
    fi

    log_ok "Prerequisites satisfied"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --local)    APPIMAGE_PATH="${2:?--local requires a path}"; shift 2 ;;
            --unpacked)
                # Bare --unpacked → auto-detect below. --unpacked <dir> → explicit.
                if [[ $# -ge 2 && "$2" != --* ]]; then
                    UNPACKED_PATH="$2"; shift 2
                else
                    shift 1
                fi
                ;;
            --arch)     ARCH="${2:?--arch requires a value}"; shift 2 ;;
            -h|--help)  usage ;;
            *) log_error "Unknown option: $1"; usage ;;
        esac
    done

    [[ -z "$ARCH" ]] && ARCH="$(detect_arch)"

    if [[ -z "$UNPACKED_PATH" && -z "$APPIMAGE_PATH" ]]; then
        # Match electron-builder's naming: linux-arm64-unpacked for arm64,
        # linux-unpacked for x64.
        case "$ARCH" in
            arm64) arch_dir="linux-arm64-unpacked" ;;
            amd64|x64) arch_dir="linux-unpacked" ;;
            *) log_error "Unsupported arch for auto-detect: $ARCH"; exit 1 ;;
        esac
        for candidate in "$PROJECT_DIR/out/$arch_dir" "$PROJECT_DIR/dist/$arch_dir"; do
            if [[ -d "$candidate" ]]; then
                UNPACKED_PATH="$candidate"
                log_info "Auto-detected unpacked dir: $UNPACKED_PATH"
                break
            fi
        done
    fi

    if [[ -z "$UNPACKED_PATH" && -z "$APPIMAGE_PATH" ]]; then
        log_error "Pass --unpacked <dir> or --local <AppImage>"
        usage
    fi

    if [[ -n "$UNPACKED_PATH" ]]; then
        case "$UNPACKED_PATH" in /*) ;; *) UNPACKED_PATH="$PWD/$UNPACKED_PATH" ;; esac
        if [[ ! -d "$UNPACKED_PATH" ]]; then
            log_error "Unpacked directory not found: $UNPACKED_PATH"
            exit 1
        fi
    elif [[ -n "$APPIMAGE_PATH" ]]; then
        case "$APPIMAGE_PATH" in /*) ;; *) APPIMAGE_PATH="$PWD/$APPIMAGE_PATH" ;; esac
        if [[ ! -f "$APPIMAGE_PATH" ]]; then
            log_error "AppImage not found: $APPIMAGE_PATH"
            log_error "Build one first with: npm run dist:linux:<arch>"
            exit 1
        fi
    fi

    VERSION="$(jq -r '.version' "$PROJECT_DIR/package.json")"
    log_info "Source   : ${UNPACKED_PATH:-$APPIMAGE_PATH}"
    log_info "Arch     : $ARCH"
    log_info "Version  : $VERSION"
}

stage_sources() {
    mkdir -p "$LOCAL_DIR"
    # Clean stale staging so unpacked/ wins deterministically over PearPass.AppImage.
    rm -rf "$LOCAL_DIR/unpacked" "$LOCAL_DIR/PearPass.AppImage"

    if [[ -n "$UNPACKED_PATH" ]]; then
        log_info "Staging unpacked Electron payload into snap/local/unpacked/ ..."
        # Hard-link to avoid duplicating ~1 GB on the same filesystem.
        cp -al "$UNPACKED_PATH" "$LOCAL_DIR/unpacked"
    else
        log_info "Staging AppImage into snap/local/ ..."
        cp "$APPIMAGE_PATH" "$LOCAL_DIR/PearPass.AppImage"
        chmod +x "$LOCAL_DIR/PearPass.AppImage"
    fi
}

build_snap() {
    log_info "Building snap (this may take several minutes on first run) ..."
    mkdir -p "$BUILD_DIR"

    cd "$PROJECT_DIR"
    # `--output <abs-path>` is unreliable across snapcraft+LXD versions,
    # so we glob the result in PROJECT_DIR instead.
    snapcraft pack
    local OUT
    OUT="$(ls -1t "$PROJECT_DIR"/pearpass_*_"${ARCH}".snap 2>/dev/null | head -n1)"
    if [[ -z "$OUT" || ! -f "$OUT" ]]; then
        log_error "snapcraft reported success but no pearpass_*_${ARCH}.snap was found in $PROJECT_DIR"
        exit 1
    fi
    SNAP_OUT="$BUILD_DIR/$(basename "$OUT")"
    mv -f "$OUT" "$SNAP_OUT"

    log_ok "Snap bundle: $SNAP_OUT"
    ls -lh "$SNAP_OUT"
}

cleanup() {
    log_info "Cleaning staging files ..."
    rm -rf "$LOCAL_DIR/unpacked"
    rm -f "$LOCAL_DIR/PearPass.AppImage"
}

# ── Main ────────────────────────────────────────────────────────────────
parse_args "$@"
check_prerequisites
stage_sources
build_snap
cleanup

SNAP_NAME="$(awk '/^name:/ {print $2; exit}' "$SNAP_DIR/snapcraft.yaml")"
log_ok "Done!"
log_info "Install with:"
log_info "  sudo snap install --dangerous $SNAP_OUT"
log_info "  sudo snap connect ${SNAP_NAME}:browser-native-messaging"
