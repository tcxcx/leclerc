"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe, { type Arc, type Globe, type Marker } from "cobe";
import { listOpsNetworkArcs, listOpsNetworkNodes } from "@leclerc/core";
import { useI18n } from "@/locales/client";
import { GlassIcon } from "./glass-icon";

const NODE_BY_ID = new Map(listOpsNetworkNodes().map((node) => [node.id, node]));

export function OperationsGlobe() {
  const t = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(320);

  const nodes = useMemo(() => listOpsNetworkNodes(), []);
  const arcs = useMemo(() => {
    return listOpsNetworkArcs()
      .map((arc): Arc | null => {
        const from = NODE_BY_ID.get(arc.fromNodeId);
        const to = NODE_BY_ID.get(arc.toNodeId);
        if (!from || !to) return null;
        return { id: arc.id, from: from.location, to: to.location, color: arc.color };
      })
      .filter((arc): arc is Arc => arc !== null);
  }, []);
  const markers = useMemo<Marker[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        location: node.location,
        size: node.size,
        color: node.color,
      })),
    [nodes],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 320;
      setSize(Math.max(280, Math.min(520, Math.round(width))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phi = -0.75;
    let frame = 0;
    let globe: Globe | null = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta: 0.24,
      dark: 1,
      diffuse: 1.6,
      mapSamples: 18000,
      mapBrightness: 4.8,
      mapBaseBrightness: 0.08,
      baseColor: [0.08, 0.1, 0.11],
      markerColor: [0.96, 0.88, 0.01],
      glowColor: [0.96, 0.88, 0.01],
      markers,
      arcs,
      arcColor: [0.96, 0.88, 0.01],
      arcWidth: 0.45,
      arcHeight: 0.28,
      markerElevation: 0.03,
      opacity: 0.96,
      scale: 1,
    });

    const animate = () => {
      if (!globe) return;
      if (!reduceMotion) phi += 0.0025;
      globe.update({ phi, markers, arcs });
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      globe?.destroy();
      globe = null;
    };
  }, [arcs, markers, size]);

  return (
    <section className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-sm">{t("ops.title")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("ops.subtitle")}</p>
        </div>
        <GlassIcon icon="public" active size="lg" />
      </div>
      <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          className="h-full w-full"
          aria-label={t("ops.title")}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {nodes.map((node) => (
          <div key={node.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-surface p-2">
            <div className="min-w-0">
              <div className="truncate text-label-md">{translateKey(t, node.labelKey)}</div>
              <div className="text-caption text-on-surface-variant">{t(`ops.roles.${node.role}`)}</div>
            </div>
            <span className={`rounded-full px-2 py-1 text-caption ${statusClass(node.status)}`}>
              {t(`ops.status.${node.status}`)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function statusClass(status: string): string {
  if (status === "online") return "bg-secondary-container text-on-secondary-container";
  if (status === "degraded") return "bg-error-container text-on-error-container";
  return "bg-surface-container-high text-on-surface-variant";
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}
