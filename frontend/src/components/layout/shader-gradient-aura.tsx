"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ShaderGradientAuraProps {
  color1?: string;
  color2?: string;
  color3?: string;
  uSpeed?: number;
  uStrength?: number;
  uDensity?: number;
  grain?: "on" | "off";
  pixelDensity?: number;
  variant?: "orb" | "card";
  className?: string;
}

function hexToVec3(hex: string): [number, number, number] {
  const clean = (hex || "#10b981").replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0");
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return [0.06, 0.72, 0.5];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 v_uv;

uniform float u_time;
uniform float u_speed;
uniform float u_strength;
uniform float u_density;
uniform float u_grain;
uniform float u_isOrb;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv * 2.0 - 1.0;
  float dist = length(centered);

  if (u_isOrb > 0.5 && dist > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float t = u_time * u_speed;
  vec2 p = centered * u_density;

  float w1 = sin(p.x * 1.6 + t * 1.4 + cos(p.y * 1.4 - t)) * 0.5 + 0.5;
  float w2 = cos(p.y * 1.8 - t * 1.1 + sin(p.x * 1.5 + t * 0.8)) * 0.5 + 0.5;
  float n = noise(p * 1.35 + vec2(t * 0.5, -t * 0.4));

  float blendA = clamp((w1 * 0.55 + n * 0.45) * (0.65 + 0.25 * u_strength), 0.0, 1.0);
  float blendB = clamp((w2 * 0.6 + (1.0 - n) * 0.4), 0.0, 1.0);

  vec3 col = mix(u_color1, u_color2, smoothstep(0.1, 0.9, blendA));
  col = mix(col, u_color3, smoothstep(0.2, 0.85, blendB) * 0.78);

  // Specular waterPlane-style crest highlight
  float crest = pow(clamp(w1 * w2, 0.0, 1.0), 3.0) * 0.22;
  col += vec3(crest);

  if (u_grain > 0.5) {
    float g = (hash(uv * 180.0 + fract(t)) - 0.5) * 0.055;
    col += vec3(g);
  }

  col = clamp(col, 0.0, 1.0);

  if (u_isOrb > 0.5) {
    float radialAlpha = smoothstep(1.0, 0.18, dist) * 0.52;
    gl_FragColor = vec4(col, radialAlpha);
  } else {
    gl_FragColor = vec4(col, 0.28);
  }
}
`;

export function ShaderGradientAura({
  color1 = "#10b981",
  color2 = "#06b6d4",
  color3 = "#6366f1",
  uSpeed = 0.28,
  uStrength = 1.6,
  uDensity = 1.5,
  grain = "on",
  pixelDensity = 1,
  variant = "orb",
  className,
}: ShaderGradientAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    color1,
    color2,
    color3,
    uSpeed,
    uStrength,
    uDensity,
    grain,
    pixelDensity,
    variant,
  });

  useEffect(() => {
    propsRef.current = {
      color1,
      color2,
      color3,
      uSpeed,
      uStrength,
      uDensity,
      grain,
      pixelDensity,
      variant,
    };
  }, [color1, color2, color3, uSpeed, uStrength, uDensity, grain, pixelDensity, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    }) ||
      canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: false,
      })) as WebGLRenderingContext | null;

    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uSpeedLoc = gl.getUniformLocation(prog, "u_speed");
    const uStrengthLoc = gl.getUniformLocation(prog, "u_strength");
    const uDensityLoc = gl.getUniformLocation(prog, "u_density");
    const uGrainLoc = gl.getUniformLocation(prog, "u_grain");
    const uIsOrbLoc = gl.getUniformLocation(prog, "u_isOrb");
    const uColor1Loc = gl.getUniformLocation(prog, "u_color1");
    const uColor2Loc = gl.getUniformLocation(prog, "u_color2");
    const uColor3Loc = gl.getUniformLocation(prog, "u_color3");

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      const p = propsRef.current;
      const dpr = Math.max(0.75, Math.min(p.pixelDensity || 1, 1.5));
      const w = Math.max(32, Math.round((canvas.clientWidth || 96) * dpr));
      const h = Math.max(32, Math.round((canvas.clientHeight || 96) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const elapsed = prefersReducedMotion ? 1.5 : (now - startTime) * 0.001;
      const [c1r, c1g, c1b] = hexToVec3(p.color1);
      const [c2r, c2g, c2b] = hexToVec3(p.color2);
      const [c3r, c3g, c3b] = hexToVec3(p.color3);

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uSpeedLoc, p.uSpeed);
      gl.uniform1f(uStrengthLoc, p.uStrength);
      gl.uniform1f(uDensityLoc, p.uDensity);
      gl.uniform1f(uGrainLoc, p.grain === "on" ? 1.0 : 0.0);
      gl.uniform1f(uIsOrbLoc, p.variant === "orb" ? 1.0 : 0.0);
      gl.uniform3f(uColor1Loc, c1r, c1g, c1b);
      gl.uniform3f(uColor2Loc, c2r, c2g, c2b);
      gl.uniform3f(uColor3Loc, c3r, c3g, c3b);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      className={cn("select-none pointer-events-none", className)}
    />
  );
}
