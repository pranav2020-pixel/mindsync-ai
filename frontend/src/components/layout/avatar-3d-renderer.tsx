"use client";

import React, { useEffect, useRef, useMemo } from "react";
import rawProjectData from "@/data/avatar-studio-project.json";
import { cn } from "@/lib/utils";

export interface RawSurface {
  type: "sphere" | "cube" | "cone" | "capsule" | "cylinder" | string;
  width: number;
  height: number;
  depth: number;
  roundness?: number;
  morphRoundness?: number;
  tipRoundness?: number;
  baseRoundness?: number;
}

export interface RawAvatarNode {
  id: string;
  name: string;
  surface?: RawSurface;
  shape?: string;
  size?: [number, number, number];
  roundness?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}

export interface AvatarNode {
  id: string;
  name: string;
  shape: "sphere" | "cube" | "cone" | "capsule" | "cylinder";
  size: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  roundness: number;
}

export interface AvatarShapeConfig {
  primary: "sphere" | "cube" | "cone" | "capsule" | "cylinder";
  size: [number, number, number];
  roundness: number;
  nodes: AvatarNode[];
}

export interface AvatarDefinition {
  id: string;
  name: string;
  bodyColor: string;
  eyeColor: string;
  shape: AvatarShapeConfig;
  eyes?: {
    widthLeft: number;
    widthRight: number;
    heightLeft: number;
    heightRight: number;
    spacing: number;
    positionXLeft: number;
    positionXRight: number;
    positionYLeft: number;
    positionYRight: number;
    leftAngle: number;
    rightAngle: number;
  };
}

export interface AvatarExpression {
  id: string;
  name: string;
  eyeMotion: "none" | "shake" | string;
  bodyMotion: "none" | "shake" | "slowDrift" | string;
  headX: number;
  headY: number;
  headZ: number;
  perspective: number;
  spacing: number;
  widthLeft: number;
  widthRight: number;
  heightLeft: number;
  heightRight: number;
  positionXLeft: number;
  positionXRight: number;
  positionYLeft: number;
  positionYRight: number;
  leftAngle: number;
  rightAngle: number;
  bodyColor?: string;
  eyeColor?: string;
}

export interface SequenceStep {
  id: string;
  expressionId: string;
  holdMs: number;
  transitionMs: number;
  transition: string;
}

export interface AvatarSequence {
  id: string;
  name: string;
  category: string;
  description?: string;
  builtIn?: boolean;
  steps: SequenceStep[];
  blink?: {
    enabled: boolean;
    initialDelayMs: number;
    minIntervalMs: number;
    maxIntervalMs: number;
    durationMs: number;
  };
}

export interface AvatarStudioProject {
  version: number;
  library: {
    activeAvatarId: string;
    avatars: AvatarDefinition[];
  };
  expressions: AvatarExpression[];
  sequences: AvatarSequence[];
}

function normalizeShapeType(t?: string): "sphere" | "cube" | "cone" | "capsule" | "cylinder" {
  if (t === "cube" || t === "cone" || t === "capsule" || t === "cylinder") {
    return t;
  }
  return "sphere";
}

function normalizeProjectData(raw: any): AvatarStudioProject {
  const rawAvatars: any[] = Array.isArray(raw?.library?.avatars) ? raw.library.avatars : [];
  const avatars: AvatarDefinition[] = rawAvatars.map((av, idx) => {
    const prim: RawSurface = av?.body?.primary || {};
    const primaryType = normalizeShapeType(prim.type || av?.shape?.primary);
    const primarySize: [number, number, number] = Array.isArray(av?.shape?.size)
      ? [
          Number(av.shape.size[0]) || 220,
          Number(av.shape.size[1]) || 220,
          Number(av.shape.size[2]) || 220,
        ]
      : [
          Number(prim.width) || 220,
          Number(prim.height) || 220,
          Number(prim.depth) || 220,
        ];
    const primaryRoundness =
      typeof prim.roundness === "number" && prim.roundness > 0
        ? prim.roundness
        : typeof prim.morphRoundness === "number"
        ? prim.morphRoundness
        : typeof av?.shape?.roundness === "number"
        ? av.shape.roundness
        : 0.65;

    const rawNodes: RawAvatarNode[] = Array.isArray(av?.body?.nodes)
      ? av.body.nodes
      : Array.isArray(av?.shape?.nodes)
      ? av.shape.nodes
      : [];

    const nodes: AvatarNode[] = rawNodes.map((n, nIdx) => {
      const surf = n?.surface || ({} as RawSurface);
      const nType = normalizeShapeType(surf.type || n?.shape);
      const nSize: [number, number, number] = Array.isArray(n?.size)
        ? [
            Number(n.size[0]) || 60,
            Number(n.size[1]) || 60,
            Number(n.size[2]) || 60,
          ]
        : [
            Number(surf.width) || 60,
            Number(surf.height) || 60,
            Number(surf.depth) || 60,
          ];
      const pos: [number, number, number] = Array.isArray(n?.position)
        ? [
            Number(n.position[0]) || 0,
            Number(n.position[1]) || 0,
            Number(n.position[2]) || 0,
          ]
        : [0, 0, 0];
      const rot: [number, number, number] = Array.isArray(n?.rotation)
        ? [
            Number(n.rotation[0]) || 0,
            Number(n.rotation[1]) || 0,
            Number(n.rotation[2]) || 0,
          ]
        : [0, 0, 0];
      const round =
        typeof surf.roundness === "number"
          ? surf.roundness
          : typeof n?.roundness === "number"
          ? n.roundness
          : 0.65;

      return {
        id: n?.id || `node-${idx}-${nIdx}`,
        name: n?.name || `Node ${nIdx + 1}`,
        shape: nType,
        size: nSize,
        position: pos,
        rotation: rot,
        roundness: round,
      };
    });

    return {
      id: av?.id || `avatar-${idx}`,
      name: av?.name || `Companion ${idx + 1}`,
      bodyColor: av?.colors?.body || av?.bodyColor || "#fe7c7c",
      eyeColor: av?.colors?.eyes || av?.eyeColor || "#111316",
      shape: {
        primary: primaryType,
        size: primarySize,
        roundness: primaryRoundness,
        nodes,
      },
      eyes: av?.eyes || undefined,
    };
  });

  const rawExpressions: any[] = Array.isArray(raw?.expressions) ? raw.expressions : [];
  const expressions: AvatarExpression[] = rawExpressions.map((exp, idx) => ({
    id: exp?.id || `expression-${idx}`,
    name: exp?.name || `Pose ${idx + 1}`,
    eyeMotion: exp?.eyeMotion || "none",
    bodyMotion: exp?.bodyMotion || "none",
    headX: Number(exp?.headX) || 0,
    headY: Number(exp?.headY) || 0,
    headZ: Number(exp?.headZ) || 0,
    perspective: Number(exp?.perspective) || 1,
    spacing: typeof exp?.spacing === "number" ? exp.spacing : 35,
    widthLeft: Number(exp?.widthLeft) || 24,
    widthRight: Number(exp?.widthRight) || 24,
    heightLeft: Number(exp?.heightLeft) || 48,
    heightRight: Number(exp?.heightRight) || 48,
    positionXLeft: Number(exp?.positionXLeft) || 0,
    positionXRight: Number(exp?.positionXRight) || 0,
    positionYLeft: Number(exp?.positionYLeft) || 0,
    positionYRight: Number(exp?.positionYRight) || 0,
    leftAngle: Number(exp?.leftAngle) || 0,
    rightAngle: Number(exp?.rightAngle) || 0,
    bodyColor: exp?.bodyColor,
    eyeColor: exp?.eyeColor,
  }));

  const rawSequences: any[] = Array.isArray(raw?.sequences) ? raw.sequences : [];
  const sequences: AvatarSequence[] = rawSequences.map((seq, idx) => ({
    id: seq?.id || `seq-${idx}`,
    name: seq?.name || seq?.id || `Sequence ${idx + 1}`,
    category: seq?.group || seq?.category || "Animations",
    description: seq?.description || "",
    builtIn: Boolean(seq?.builtIn),
    steps: Array.isArray(seq?.steps) ? seq.steps : [],
    blink: seq?.blink || {
      enabled: true,
      initialDelayMs: 1800,
      minIntervalMs: 2400,
      maxIntervalMs: 4800,
      durationMs: 160,
    },
  }));

  return {
    version: Number(raw?.version) || 2,
    library: {
      activeAvatarId:
        raw?.library?.activeAvatarId || avatars[0]?.id || "strobi",
      avatars,
    },
    expressions,
    sequences,
  };
}

export const AVATAR_STUDIO_DATA: AvatarStudioProject = normalizeProjectData(rawProjectData);

const SHAPE_TYPE_MAP: Record<string, number> = {
  sphere: 0,
  cube: 1,
  cone: 2,
  capsule: 3,
  cylinder: 4,
};

function hexToRgbNormalized(hex: string): [number, number, number] {
  const clean = (hex || "#fe7c7c").replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0");
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return [0.99, 0.48, 0.48];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 v_uv;

uniform vec3 u_bodyColor;
uniform vec3 u_eyeColor;
uniform vec3 u_headRot;
uniform vec2 u_bodyOffset;
uniform int u_nodeCount;
uniform int u_nodeTypes[10];
uniform vec3 u_nodeSizes[10];
uniform vec3 u_nodePos[10];
uniform vec3 u_nodeRot[10];
uniform float u_nodeRound[10];

// Left & Right eye params: (centerX, centerY, halfWidth, halfHeight)
uniform vec4 u_eyeLeft;
uniform vec4 u_eyeRight;
uniform vec2 u_eyeAngles; // (leftAngleRad, rightAngleRad)
uniform float u_smoothK;

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 0.0001), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdEllipsoid(vec3 p, vec3 r) {
  vec3 safeR = max(r, vec3(0.01));
  float k0 = length(p / safeR);
  float k1 = length(p / (safeR * safeR));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  float rad = min(r, min(b.x, min(b.y, b.z)) * 0.92);
  vec3 q = abs(p) - max(b - vec3(rad), vec3(0.005));
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - rad;
}

float sdVerticalCapsule(vec3 p, vec3 b) {
  float r = min(b.x, b.z);
  float h = max(0.0, b.y - r);
  vec3 q = p;
  q.y = clamp(q.y, -h, h);
  return length(p - q) - r;
}

float sdRoundCone(vec3 p, vec3 b, float roundness) {
  vec3 q = p;
  q.z *= (b.x / max(b.z, 0.01));
  float r1 = b.x * (0.72 + 0.12 * clamp(roundness, 0.0, 1.5));
  float r2 = b.x * (0.28 + 0.24 * clamp(roundness, 0.0, 1.5));
  float h = max(b.y * 1.15, 0.1);
  vec2 c = vec2(length(q.xz), q.y + h * 0.38);
  float bDiff = (r1 - r2) / h;
  float a = sqrt(max(1.0 - bDiff * bDiff, 0.001));
  float k = dot(c, vec2(-bDiff, a));
  if (k < 0.0) return length(c) - r1;
  if (k > a * h) return length(c - vec2(0.0, h)) - r2;
  return dot(c, vec2(a, bDiff)) - r1;
}

float sdRoundCylinder(vec3 p, vec3 b, float roundness) {
  float r = min(b.x, b.z);
  float rad = min(clamp(roundness, 0.1, 1.5) * r * 0.55, min(r, b.y) * 0.85);
  vec2 d = vec2(length(p.xz) - (r - rad), abs(p.y) - (b.y - rad));
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rad;
}

float evalNode(vec3 p, int type, vec3 b, float roundness) {
  if (type == 0) return sdEllipsoid(p, b);
  if (type == 1) return sdRoundBox(p, b, clamp(roundness, 0.05, 1.0) * min(b.x, min(b.y, b.z)));
  if (type == 2) return sdRoundCone(p, b, roundness);
  if (type == 3) return sdVerticalCapsule(p, b);
  return sdRoundCylinder(p, b, roundness);
}

vec3 transformToHeadSpace(vec3 p) {
  vec3 q = p - vec3(u_bodyOffset, 0.0);
  mat3 m = rotZ(u_headRot.z) * rotX(u_headRot.y) * rotY(u_headRot.x);
  return m * q;
}

float mapScene(vec3 p) {
  // Fast bounding-sphere early exit for rays far from the avatar
  float boundDist = length(p - vec3(u_bodyOffset, 0.0)) - 1.55;
  if (boundDist > 0.25) return boundDist;

  vec3 hp = transformToHeadSpace(p);
  float d = 100.0;
  for (int i = 0; i < 10; i++) {
    if (i >= u_nodeCount) break;
    vec3 lp = hp - u_nodePos[i];
    vec3 r = u_nodeRot[i];
    if (abs(r.x) + abs(r.y) + abs(r.z) > 0.001) {
      lp = rotZ(-r.z) * rotY(-r.y) * rotX(-r.x) * lp;
    }
    float nd = evalNode(lp, u_nodeTypes[i], u_nodeSizes[i], u_nodeRound[i]);
    if (i == 0) {
      d = nd;
    } else {
      d = smin(d, nd, u_smoothK);
    }
  }
  return d;
}

vec3 calcNormal(vec3 p) {
  const float eps = 0.0025;
  vec2 e = vec2(1.0, -1.0) * 0.5773;
  return normalize(
    e.xyy * mapScene(p + e.xyy * eps) +
    e.yyx * mapScene(p + e.yyx * eps) +
    e.yxy * mapScene(p + e.yxy * eps) +
    e.xxx * mapScene(p + e.xxx * eps)
  );
}

float sdEye2D(vec2 p, vec2 center, vec2 halfSize, float angle) {
  vec2 d = p - center;
  float c = cos(-angle), s = sin(-angle);
  d = mat2(c, -s, s, c) * d;
  float r = min(halfSize.x, halfSize.y);
  vec2 q = abs(d) - max(halfSize - vec2(r), vec2(0.0));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec3 ro = vec3(0.0, 0.0, 3.35);
  vec3 rd = normalize(vec3(v_uv * 1.18, -2.15));

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 42; i++) {
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.0025) {
      hit = true;
      break;
    }
    if (t > 5.0) break;
    t += d * 0.92;
  }

  if (!hit) {
    vec2 shadowUv = (v_uv - vec2(u_bodyOffset.x * 0.55, -0.78)) * vec2(1.35, 4.8);
    float shadowDist = length(shadowUv);
    float shadowAlpha = smoothstep(0.65, 0.0, shadowDist) * 0.22;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  vec3 pos = ro + rd * t;
  vec3 nor = calcNormal(pos);
  vec3 hp = transformToHeadSpace(pos);

  float eyeMask = 0.0;
  if (hp.z > 0.05) {
    float dLeft = sdEye2D(hp.xy, u_eyeLeft.xy, u_eyeLeft.zw, u_eyeAngles.x);
    float dRight = sdEye2D(hp.xy, u_eyeRight.xy, u_eyeRight.zw, u_eyeAngles.y);
    float dEye = min(dLeft, dRight);
    eyeMask = 1.0 - smoothstep(-0.006, 0.006, dEye);

    float rimEye = exp(-abs(dEye) * 95.0) * 0.18;
    nor = normalize(nor - vec3(0.0, 0.0, rimEye));
  }

  vec3 baseCol = mix(u_bodyColor, u_eyeColor, eyeMask);

  vec3 keyDir = normalize(vec3(-0.55, 0.75, 0.85));
  vec3 fillDir = normalize(vec3(0.75, -0.35, 0.55));
  vec3 viewDir = normalize(-rd);

  float wrapKey = clamp((dot(nor, keyDir) + 0.45) / 1.45, 0.0, 1.0);
  float diffFill = clamp(dot(nor, fillDir), 0.0, 1.0);
  float fresnel = pow(1.0 - clamp(dot(nor, viewDir), 0.0, 1.0), 3.0);

  vec3 halfVec = normalize(keyDir + viewDir);
  float specPower = mix(26.0, 54.0, eyeMask);
  float specStrength = mix(0.24, 0.52, eyeMask);
  float spec = pow(clamp(dot(nor, halfVec), 0.0, 1.0), specPower) * specStrength;

  vec3 sssTint = baseCol * vec3(1.12, 0.96, 0.94);
  vec3 col = baseCol * 0.34;
  col += mix(baseCol, sssTint, 0.25) * wrapKey * 0.68;
  col += baseCol * diffFill * 0.18;
  col += vec3(1.0, 0.99, 0.97) * spec;
  col += mix(baseCol, vec3(1.0), 0.65) * fresnel * 0.28;

  float ao = smoothstep(-0.85, 0.35, hp.y);
  col *= (0.82 + 0.18 * ao);

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Avatar3DRendererProps {
  avatarId?: string;
  sequenceId?: string;
  expressionId?: string | null;
  size?: number;
  interactiveGaze?: boolean;
  customBodyColor?: string | null;
  customEyeColor?: string | null;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function Avatar3DRenderer({
  avatarId,
  sequenceId = "idle",
  expressionId = null,
  size = 200,
  interactiveGaze = true,
  customBodyColor = null,
  customEyeColor = null,
  className,
  onClick,
  title,
}: Avatar3DRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const avatar = useMemo<AvatarDefinition>(() => {
    const list = AVATAR_STUDIO_DATA.library.avatars;
    return (
      list.find(
        (a) => a.id === avatarId || a.name.toLowerCase() === avatarId?.toLowerCase()
      ) ||
      list.find((a) => a.id === AVATAR_STUDIO_DATA.library.activeAvatarId) ||
      list[0]
    );
  }, [avatarId]);

  const expressionsMap = useMemo(() => {
    const map = new Map<string, AvatarExpression>();
    for (const exp of AVATAR_STUDIO_DATA.expressions) {
      map.set(exp.id, exp);
    }
    return map;
  }, []);

  const sequence = useMemo<AvatarSequence>(() => {
    const seqs = AVATAR_STUDIO_DATA.sequences;
    return (
      seqs.find((s) => s.id === sequenceId) ||
      seqs.find((s) => s.id === "idle") ||
      seqs[0]
    );
  }, [sequenceId]);

  // Keep dynamic props in a ref so changing sequences/sizes never recompiles the WebGL shader
  const liveRef = useRef({
    avatar,
    sequence,
    expressionId,
    size,
    interactiveGaze,
    customBodyColor,
    customEyeColor,
  });

  useEffect(() => {
    liveRef.current = {
      avatar,
      sequence,
      expressionId,
      size,
      interactiveGaze,
      customBodyColor,
      customEyeColor,
    };
  }, [
    avatar,
    sequence,
    expressionId,
    size,
    interactiveGaze,
    customBodyColor,
    customEyeColor,
  ]);

  useEffect(() => {
    if (!interactiveGaze || typeof window === "undefined") return;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const nx = Math.max(
        -1,
        Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth * 0.35, 220))
      );
      const ny = Math.max(
        -1,
        Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight * 0.35, 220))
      );
      pointerRef.current = { x: nx, y: ny };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactiveGaze]);

  // Compile WebGL shader ONCE on mount for zero-lag transitions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    }) ||
      canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: true,
      })) as WebGLRenderingContext | null;

    if (!gl) return;

    const compileShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);

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

    const uBodyColor = gl.getUniformLocation(prog, "u_bodyColor");
    const uEyeColor = gl.getUniformLocation(prog, "u_eyeColor");
    const uHeadRot = gl.getUniformLocation(prog, "u_headRot");
    const uBodyOffset = gl.getUniformLocation(prog, "u_bodyOffset");
    const uNodeCount = gl.getUniformLocation(prog, "u_nodeCount");
    const uEyeLeft = gl.getUniformLocation(prog, "u_eyeLeft");
    const uEyeRight = gl.getUniformLocation(prog, "u_eyeRight");
    const uEyeAngles = gl.getUniformLocation(prog, "u_eyeAngles");
    const uSmoothK = gl.getUniformLocation(prog, "u_smoothK");

    const nodeTypeLocs = Array.from({ length: 10 }, (_, i) =>
      gl.getUniformLocation(prog, `u_nodeTypes[${i}]`)
    );
    const nodeSizeLocs = Array.from({ length: 10 }, (_, i) =>
      gl.getUniformLocation(prog, `u_nodeSizes[${i}]`)
    );
    const nodePosLocs = Array.from({ length: 10 }, (_, i) =>
      gl.getUniformLocation(prog, `u_nodePos[${i}]`)
    );
    const nodeRotLocs = Array.from({ length: 10 }, (_, i) =>
      gl.getUniformLocation(prog, `u_nodeRot[${i}]`)
    );
    const nodeRoundLocs = Array.from({ length: 10 }, (_, i) =>
      gl.getUniformLocation(prog, `u_nodeRound[${i}]`)
    );

    const SCALE = 155.0;
    const DEG2RAD = Math.PI / 180;
    let uploadedAvatarId = "";
    let lastPixelSize = 0;

    const uploadGeometry = (av: AvatarDefinition) => {
      const nodes = av.shape?.nodes || [];
      const totalNodes = Math.min(1 + nodes.length, 10);
      gl.uniform1i(uNodeCount, totalNodes);

      const smoothFactor = av.name.toLowerCase().includes("cloud")
        ? 0.14
        : av.name.toLowerCase().includes("kirby")
        ? 0.08
        : 0.035;
      gl.uniform1f(uSmoothK, smoothFactor);

      const primSize = av.shape?.size || [220, 220, 220];
      gl.uniform1i(nodeTypeLocs[0], SHAPE_TYPE_MAP[av.shape?.primary] ?? 0);
      gl.uniform3f(
        nodeSizeLocs[0],
        (primSize[0] * 0.5) / SCALE,
        (primSize[1] * 0.5) / SCALE,
        (primSize[2] * 0.5) / SCALE
      );
      gl.uniform3f(nodePosLocs[0], 0, 0, 0);
      gl.uniform3f(nodeRotLocs[0], 0, 0, 0);
      gl.uniform1f(nodeRoundLocs[0], av.shape?.roundness ?? 0.65);

      for (let i = 0; i < totalNodes - 1; i++) {
        const n = nodes[i];
        const idx = i + 1;
        gl.uniform1i(nodeTypeLocs[idx], SHAPE_TYPE_MAP[n.shape] ?? 0);
        gl.uniform3f(
          nodeSizeLocs[idx],
          (n.size[0] * 0.5) / SCALE,
          (n.size[1] * 0.5) / SCALE,
          (n.size[2] * 0.5) / SCALE
        );
        gl.uniform3f(
          nodePosLocs[idx],
          n.position[0] / SCALE,
          -n.position[1] / SCALE,
          n.position[2] / SCALE
        );
        gl.uniform3f(
          nodeRotLocs[idx],
          (n.rotation?.[0] || 0) * DEG2RAD,
          (n.rotation?.[1] || 0) * DEG2RAD,
          -(n.rotation?.[2] || 0) * DEG2RAD
        );
        gl.uniform1f(nodeRoundLocs[idx], n.roundness ?? 0.65);
      }
      uploadedAvatarId = av.id;
    };

    const defaultExp =
      expressionsMap.get("expression-00") || AVATAR_STUDIO_DATA.expressions[0];

    let rafId = 0;
    const startTime = performance.now();
    let nextBlinkTime = startTime + 1800 + Math.random() * 600;
    let smoothGazeX = 0;
    let smoothGazeY = 0;

    const renderFrame = (now: number) => {
      const {
        avatar: curAvatar,
        sequence: curSeq,
        expressionId: curExpId,
        size: curSize,
        interactiveGaze: curGaze,
        customBodyColor: curBodyHex,
        customEyeColor: curEyeHex,
      } = liveRef.current;

      const dpr =
        typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
      const targetPx = Math.round(curSize * dpr);
      if (targetPx !== lastPixelSize && targetPx > 0) {
        canvas.width = targetPx;
        canvas.height = targetPx;
        lastPixelSize = targetPx;
      }

      if (curAvatar && curAvatar.id !== uploadedAvatarId) {
        uploadGeometry(curAvatar);
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const steps = curSeq?.steps?.length
        ? curSeq.steps
        : [
            {
              id: "s0",
              expressionId: "expression-00",
              holdMs: 2000,
              transitionMs: 300,
              transition: "smooth",
            },
          ];

      let totalCycleMs = 0;
      for (let i = 0; i < steps.length; i++) {
        totalCycleMs += Math.max(50, (steps[i].holdMs || 500) + (steps[i].transitionMs || 250));
      }
      totalCycleMs = Math.max(100, totalCycleMs);

      let currentExp: AvatarExpression = defaultExp;
      let nextExp: AvatarExpression = defaultExp;
      let blendT = 0;

      if (curExpId && expressionsMap.has(curExpId)) {
        currentExp = expressionsMap.get(curExpId)!;
        nextExp = currentExp;
        blendT = 0;
      } else {
        const elapsedInCycle = (now - startTime) % totalCycleMs;
        let accum = 0;
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const dur = Math.max(50, (step.holdMs || 500) + (step.transitionMs || 250));
          if (elapsedInCycle < accum + dur) {
            const localT = elapsedInCycle - accum;
            const hold = step.holdMs || 400;
            const trans = Math.max(1, step.transitionMs || 220);
            currentExp = expressionsMap.get(step.expressionId) || defaultExp;
            const nextStep = steps[(i + 1) % steps.length];
            nextExp = expressionsMap.get(nextStep.expressionId) || defaultExp;
            if (localT > hold) {
              blendT = easeInOutCubic(Math.min(1, (localT - hold) / trans));
            } else {
              blendT = 0;
            }
            break;
          }
          accum += dur;
        }
      }

      const headXDeg = lerp(currentExp.headX, nextExp.headX, blendT);
      const headYDeg = lerp(currentExp.headY, nextExp.headY, blendT);
      const headZDeg = lerp(currentExp.headZ, nextExp.headZ, blendT);

      let widthLeft = lerp(currentExp.widthLeft, nextExp.widthLeft, blendT);
      let widthRight = lerp(currentExp.widthRight, nextExp.widthRight, blendT);
      let heightLeft = lerp(currentExp.heightLeft, nextExp.heightLeft, blendT);
      let heightRight = lerp(currentExp.heightRight, nextExp.heightRight, blendT);
      const spacing = lerp(currentExp.spacing, nextExp.spacing, blendT);
      const posXLeft = lerp(currentExp.positionXLeft, nextExp.positionXLeft, blendT);
      const posXRight = lerp(currentExp.positionXRight, nextExp.positionXRight, blendT);
      const posYLeft = lerp(currentExp.positionYLeft, nextExp.positionYLeft, blendT);
      const posYRight = lerp(currentExp.positionYRight, nextExp.positionYRight, blendT);
      const leftAngle = lerp(currentExp.leftAngle, nextExp.leftAngle, blendT);
      const rightAngle = lerp(currentExp.rightAngle, nextExp.rightAngle, blendT);

      const blinkDuration = curSeq?.blink?.durationMs || 150;
      if (curSeq?.blink?.enabled !== false && curSeq?.id !== "sleeping") {
        if (now >= nextBlinkTime) {
          const blinkElapsed = now - nextBlinkTime;
          if (blinkElapsed <= blinkDuration) {
            const bt = Math.sin((blinkElapsed / blinkDuration) * Math.PI);
            heightLeft = lerp(heightLeft, 10, bt);
            heightRight = lerp(heightRight, 10, bt);
            widthLeft = lerp(widthLeft, widthLeft * 1.25, bt);
            widthRight = lerp(widthRight, widthRight * 1.25, bt);
          } else {
            const minInt = curSeq?.blink?.minIntervalMs || 2200;
            const maxInt = curSeq?.blink?.maxIntervalMs || 4800;
            nextBlinkTime = now + minInt + Math.random() * (maxInt - minInt);
          }
        }
      }

      smoothGazeX = lerp(smoothGazeX, pointerRef.current.x, 0.08);
      smoothGazeY = lerp(smoothGazeY, pointerRef.current.y, 0.08);

      const gazeYaw = curGaze ? smoothGazeX * 14 : 0;
      const gazePitch = curGaze ? smoothGazeY * 11 : 0;

      const tSec = (now - startTime) * 0.001;
      let driftX = Math.sin(tSec * 1.7) * 0.025;
      let driftY = Math.sin(tSec * 2.4) * 0.045;
      if (currentExp.bodyMotion === "shake") {
        driftX += Math.sin(tSec * 48.0) * 0.028;
        driftY += Math.cos(tSec * 54.0) * 0.022;
      }

      let eyeShakeX = 0;
      let eyeShakeY = 0;
      if (currentExp.eyeMotion === "shake") {
        eyeShakeX = Math.sin(tSec * 55.0) * 2.5;
        eyeShakeY = Math.cos(tSec * 62.0) * 2.0;
      }

      const activeBodyHex = curBodyHex || curAvatar?.bodyColor || "#fe7c7c";
      const activeEyeHex = curEyeHex || curAvatar?.eyeColor || "#3e4e65";
      const [br, bg, bb] = hexToRgbNormalized(activeBodyHex);
      const [er, eg, eb] = hexToRgbNormalized(activeEyeHex);
      gl.uniform3f(uBodyColor, br, bg, bb);
      gl.uniform3f(uEyeColor, er, eg, eb);

      gl.uniform3f(
        uHeadRot,
        (headXDeg + gazeYaw) * DEG2RAD,
        (headYDeg + gazePitch) * DEG2RAD,
        headZDeg * DEG2RAD
      );
      gl.uniform2f(uBodyOffset, driftX, driftY);

      const halfGap = spacing * 0.5;
      const lx = (-(halfGap + widthLeft * 0.5) + posXLeft + eyeShakeX) / SCALE;
      const ly = -(posYLeft + eyeShakeY) / SCALE;
      const rx = (halfGap + widthRight * 0.5 + posXRight + eyeShakeX) / SCALE;
      const ry = -(posYRight + eyeShakeY) / SCALE;

      gl.uniform4f(
        uEyeLeft,
        lx,
        ly,
        Math.max(0.015, (widthLeft * 0.5) / SCALE),
        Math.max(0.015, (heightLeft * 0.5) / SCALE)
      );
      gl.uniform4f(
        uEyeRight,
        rx,
        ry,
        Math.max(0.015, (widthRight * 0.5) / SCALE),
        Math.max(0.015, (heightRight * 0.5) / SCALE)
      );
      gl.uniform2f(uEyeAngles, -leftAngle * DEG2RAD, -rightAngle * DEG2RAD);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [expressionsMap]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      title={title}
      style={{ width: size, height: size }}
      className={cn(
        "select-none pointer-events-auto transition-transform duration-200",
        onClick && "cursor-pointer active:scale-95",
        className
      )}
    />
  );
}
