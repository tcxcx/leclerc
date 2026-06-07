"use client";

import { useEffect, useMemo, useRef } from "react";
import createGlobe, { type Arc, type Globe, type Marker } from "cobe";
import { listOpsNetworkArcs, listOpsNetworkNodes } from "@leclerc/core";

const NODE_BY_ID = new Map(listOpsNetworkNodes().map((node) => [node.id, node]));

export function LandingOperationsScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useMemo(() => listOpsNetworkNodes(), []);
  const markers = useMemo<Marker[]>(
    () => nodes.map((node) => ({ id: node.id, location: node.location, size: node.size, color: node.color })),
    [nodes],
  );
  const arcs = useMemo<Arc[]>(
    () =>
      listOpsNetworkArcs()
        .map((arc): Arc | null => {
          const from = NODE_BY_ID.get(arc.fromNodeId);
          const to = NODE_BY_ID.get(arc.toNodeId);
          return from && to ? { id: arc.id, from: from.location, to: to.location, color: arc.color } : null;
        })
        .filter((arc): arc is Arc => arc !== null),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = Math.max(900, window.innerWidth);
    const height = Math.max(760, window.innerHeight);
    let phi = -0.55;
    let frame = 0;
    let globe: Globe | null = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: height * dpr,
      phi,
      theta: 0.2,
      dark: 1,
      diffuse: 1.5,
      mapSamples: 24000,
      mapBrightness: 4.6,
      mapBaseBrightness: 0.05,
      baseColor: [0.06, 0.08, 0.09],
      markerColor: [0.96, 0.88, 0.01],
      glowColor: [0.96, 0.88, 0.01],
      markers,
      arcs,
      arcColor: [0.96, 0.88, 0.01],
      arcWidth: 0.5,
      arcHeight: 0.3,
      markerElevation: 0.035,
      opacity: 0.9,
      scale: 1.25,
      offset: [Math.round(width * 0.18), 0],
    });

    const animate = () => {
      if (!globe) return;
      if (!reduceMotion) phi += 0.002;
      globe.update({ phi, markers, arcs });
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      globe?.destroy();
      globe = null;
    };
  }, [arcs, markers]);

  return (
    <canvas
      ref={canvasRef}
      width={1800}
      height={1520}
      className="absolute inset-0 h-full w-full opacity-95"
      aria-hidden
    />
  );
}
