# @leclerc/core

Runtime-agnostic LeClerc contracts and pure helpers shared by the PWA, desktop
shell, mobile shell, and Bare worklet.

This package intentionally avoids React, DOM APIs, Node-only modules, QVAC SDK
imports, WDK imports, and storage transports. Platform packages provide IO and
call into these contracts.
