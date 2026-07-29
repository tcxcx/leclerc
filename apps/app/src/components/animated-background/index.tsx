"use client";

import {
  DEFAULT_ANIMATED_BACKGROUND_STORY,
  animatedBackgroundColors,
  animatedBackgroundCssGradient,
  animatedBackgroundDefaultPreset,
  animatedBackgroundDiagnostic,
  animatedBackgroundRuntime,
  type AnimatedBackgroundPresetId,
} from "@leclerc/core";
import { memo, useEffect, useRef } from "react";
import { vertexShaderSource, fragmentShaderSource } from "./shaders";

const hex2rgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r / 255, g / 255, b / 255];
};

const COLOR_PRESETS = DEFAULT_ANIMATED_BACKGROUND_STORY.presets;
type ColorPreset = AnimatedBackgroundPresetId;

interface AnimatedBackgroundProps {
  className?: string;
  isMac?: boolean;
  variant?: ColorPreset;
}

const AnimatedBackground = ({
  className = "",
  isMac = false,
  variant = animatedBackgroundDefaultPreset(),
}: AnimatedBackgroundProps) => {
  const {
    frameIntervalMs,
    maxCanvasPixels,
    resolutionScale,
    resizeCheckIntervalMs,
    timeScale,
  } = animatedBackgroundRuntime(isMac);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Precomputed so the CSS gradient fallback on <canvas> can use it without
  // waiting for the WebGL init effect to run.
  const selectedColors = animatedBackgroundColors(variant);
  const cssGradient = animatedBackgroundCssGradient(selectedColors);

  useEffect(() => {
    const colorValues = selectedColors.map(hex2rgb) as [
      number,
      number,
      number,
    ][];

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
    if (!gl) {
      // Headless / GPU-disabled / WebGL-blocked: leave the canvas transparent
      // so the CSS gradient on the element shows through. Was painting a
      // solid first-color rect, which looked awful as a flat slab.
      return;
    }

    if (gl.isContextLost()) return;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(animatedBackgroundDiagnostic("vertex"), gl.getShaderInfoLog(vertexShader));
      return;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(animatedBackgroundDiagnostic("fragment"), gl.getShaderInfoLog(fragmentShader));
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(animatedBackgroundDiagnostic("link"), gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.disable(gl.DITHER);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const color1UniformLocation = gl.getUniformLocation(program, "uColor1");
    const color2UniformLocation = gl.getUniformLocation(program, "uColor2");
    const color3UniformLocation = gl.getUniformLocation(program, "uColor3");
    const color4UniformLocation = gl.getUniformLocation(program, "uColor4");

    const [c1, c2, c3, c4] = colorValues;
    gl.uniform3f(color1UniformLocation, c1![0], c1![1], c1![2]);
    gl.uniform3f(color2UniformLocation, c2![0], c2![1], c2![2]);
    gl.uniform3f(color3UniformLocation, c3![0], c3![1], c3![2]);
    gl.uniform3f(color4UniformLocation, c4![0], c4![1], c4![2]);

    const startTime = performance.now();
    let animationFrameId: number | null = null;
    let lastFrameTime = 0;
    let isVisible = true;
    let lastResizeCheck = 0;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      let scaledWidth = Math.floor(rect.width * resolutionScale);
      let scaledHeight = Math.floor(rect.height * resolutionScale);
      const pixels = scaledWidth * scaledHeight;
      if (pixels > maxCanvasPixels) {
        const ratio = Math.sqrt(maxCanvasPixels / pixels);
        scaledWidth = Math.floor(scaledWidth * ratio);
        scaledHeight = Math.floor(scaledHeight * ratio);
      }
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        gl.viewport(0, 0, scaledWidth, scaledHeight);
      }
      return { width: scaledWidth, height: scaledHeight };
    };

    let { width: cachedWidth, height: cachedHeight } = updateCanvasSize();

    const glClear = gl.clear.bind(gl);
    const glUniform1f = gl.uniform1f.bind(gl);
    const glUniform2f = gl.uniform2f.bind(gl);
    const glDrawArrays = gl.drawArrays.bind(gl);

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && animationFrameId === null) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = (timestamp: number) => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }
      const deltaTime = timestamp - lastFrameTime;
      if (deltaTime < frameIntervalMs) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp - (deltaTime % frameIntervalMs);
      if (timestamp - lastResizeCheck > resizeCheckIntervalMs) {
        const { width, height } = updateCanvasSize();
        cachedWidth = width;
        cachedHeight = height;
        lastResizeCheck = timestamp;
      }
      const elapsedTime = (timestamp - startTime) * timeScale;
      glClear(gl.COLOR_BUFFER_BIT);
      glUniform1f(timeUniformLocation, elapsedTime);
      glUniform2f(resolutionUniformLocation, cachedWidth, cachedHeight);
      glDrawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    };
  }, [
    frameIntervalMs,
    maxCanvasPixels,
    resolutionScale,
    resizeCheckIntervalMs,
    selectedColors,
    timeScale,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "auto",
        background: cssGradient,
      }}
    />
  );
};

export default memo(AnimatedBackground);
export { COLOR_PRESETS, type ColorPreset };
