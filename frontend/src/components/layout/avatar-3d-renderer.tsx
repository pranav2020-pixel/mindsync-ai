"use client";

import React, { useEffect, useRef, useMemo } from "react";
import rawProjectData from "@/data/avatar-studio-project.json";
import { cn } from "@/lib/utils";

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

export const AVATAR_STUDIO_DATA = rawProjectData as unknown as AvatarStudioProject;

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
  // Pear / rounded cone shape: wider at bottom (-y), narrower at top (+y)
  vec3 q = p;
  q.z *= (b.x / max(b.z, 0.01));
  float r1 = b.x * (0.72 + 0.16 * roundness);
  float r2 = b.x * (0.25 + 0.32 * roundness);
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
  float rad = min(roundness * r * 0.65, min(r, b.y) * 0.85);
  vec2 d = vec2(length(p.xz) - (r - rad), abs(p.y) - (b.y - rad));
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rad;
}

float evalNode(vec3 p, int type, vec3 b, float roundness) {
  if (type == 0) return sdEllipsoid(p, b);
  if (type == 1) return sdRoundBox(p, b, roundness * min(b.x, min(b.y, b.z)));
  if (type == 2) return sdRoundCone(p, b, roundness);
  if (type == 3) return sdVerticalCapsule(p, b);
  return sdRoundCylinder(p, b, roundness);
}

vec3 transformToHeadSpace(vec3 p) {
  vec3 q = p - vec3(u_bodyOffset, 0.0);
  // Apply inverse of head rotation (yaw = headX, pitch = headY, roll = headZ)
  mat3 m = rotZ(u_headRot.z) * rotX(u_headRot.y) * rotY(u_headRot.x);
  return m * q;
}

float mapScene(vec3 p) {
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
  const float eps = 0.002;
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
  for (int i = 0; i < 56; i++) {
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.002) {
      hit = true;
      break;
    }
    if (t > 5.5) break;
    t += d * 0.9;
  }

  if (!hit) {
    // Soft floating ground contact shadow
    vec2 shadowUv = (v_uv - vec2(u_bodyOffset.x * 0.55, -0.78)) * vec2(1.35, 4.8);
    float shadowDist = length(shadowUv);
    float shadowAlpha = smoothstep(0.65, 0.0, shadowDist) * 0.22;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  vec3 pos = ro + rd * t;
  vec3 nor = calcNormal(pos);
  vec3 hp = transformToHeadSpace(pos);

  // Evaluate 2D rounded-pill eyes projected onto the front surface of the 3D head
  float eyeMask = 0.0;
  float eyeSpec = 0.0;
  if (hp.z > 0.05) {
    float dLeft = sdEye2D(hp.xy, u_eyeLeft.xy, u_eyeLeft.zw, u_eyeAngles.x);
    float dRight = sdEye2D(hp.xy, u_eyeRight.xy, u_eyeRight.zw, u_eyeAngles.y);
    float dEye = min(dLeft, dRight);
    eyeMask = 1.0 - smoothstep(-0.006, 0.006, dEye);

    // Subtle inset normal perturbation at eye boundary for tactile 3D depth
    float rimEye = exp(-abs(dEye) * 95.0) * 0.18;
    nor = normalize(nor - vec3(0.0, 0.0, rimEye));
  }

  vec3 baseCol = mix(u_bodyColor, u_eyeColor, eyeMask);

  // Studio 3-point lighting + subsurface warmth + Fresnel rim
  vec3 keyDir = normalize(vec3(-0.55, 0.75, 0.85));
  vec3 fillDir = normalize(vec3(0.75, -0.35, 0.55));
  vec3 viewDir = normalize(-rd);

  float diffKey = clamp(dot(nor, keyDir), 0.0, 1.0);
  float wrapKey = clamp((dot(nor, keyDir) + 0.45) / 1.45, 0.0, 1.0);
  float diffFill = clamp(dot(nor, fillDir), 0.0, 1.0);
  float fresnel = pow(1.0 - clamp(dot(nor, viewDir), 0.0, 1.0), 3.0);

  vec3 halfVec = normalize(keyDir + viewDir);
  float specPower = mix(26.0, 54.0, eyeMask);
  float specStrength = mix(0.24, 0.52, eyeMask);
  float spec = pow(clamp(dot(nor, halfVec), 0.0, 1.0), specPower) * specStrength;

  // Subsurface scattering tint for vinyl/clay warmth
  vec3 sssTint = baseCol * vec3(1.12, 0.96, 0.94);
  vec3 col = baseCol * 0.34;
  col += mix(baseCol, sssTint, 0.25) * wrapKey * 0.68;
  col += baseCol * diffFill * 0.18;
  col += vec3(1.0, 0.99, 0.97) * spec;
  col += mix(baseCol, vec3(1.0), 0.65) * fresnel * 0.28;

  // Subtle bottom ambient occlusion
  float ao = smoothstep(-0.85, 0.35, hp.y);
  col *= (0.82 + 0.18 * ao);

  // Gamma correction / vibrant tone mapping
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
      list.find((a) => a.id === avatarId || a.name.toLowerCase() === avatarId?.toLowerCase()) ||
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

  // Track mouse gaze smoothly across window when interactiveGaze is enabled
  useEffect(() => {
    if (!interactiveGaze || typeof window === "undefined") return;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / Math.max(window.innerWidth * 0.35, 220)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / Math.max(window.innerHeight * 0.35, 220)));
      pointerRef.current = { x: nx, y: ny };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactiveGaze]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const gl = (canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, antialias: true })) as WebGLRenderingContext | null;

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

    // Uniform locations
    const uBodyColor = gl.getUniformLocation(prog, "u_bodyColor");
    const uEyeColor = gl.getUniformLocation(prog, "u_eyeColor");
    const uHeadRot = gl.getUniformLocation(prog, "u_headRot");
    const uBodyOffset = gl.getUniformLocation(prog, "u_bodyOffset");
    const uNodeCount = gl.getUniformLocation(prog, "u_nodeCount");
    const uEyeLeft = gl.getUniformLocation(prog, "u_eyeLeft");
    const uEyeRight = gl.getUniformLocation(prog, "u_eyeRight");
    const uEyeAngles = gl.getUniformLocation(prog, "u_eyeAngles");
    const uSmoothK = gl.getUniformLocation(prog, "u_smoothK");

    // Upload static avatar geometry nodes (primary + up to 9 child nodes)
    const nodes = avatar.shape.nodes || [];
    const totalNodes = Math.min(1 + nodes.length, 10);
    gl.uniform1i(uNodeCount, totalNodes);

    // Smooth blend factor: higher for Cloudee / Kirby, crisper for Freddy / Sunee
    const smoothFactor =
      avatar.name.toLowerCase().includes("cloud")
        ? 0.14
        : avatar.name.toLowerCase().includes("kirby")
        ? 0.08
        : 0.035;
    gl.uniform1f(uSmoothK, smoothFactor);

    const SCALE = 155.0;
    const DEG2RAD = Math.PI / 180;

    // Node 0: Primary shape
    gl.uniform1i(gl.getUniformLocation(prog, "u_nodeTypes[0]"), SHAPE_TYPE_MAP[avatar.shape.primary] ?? 0);
    gl.uniform3f(
      gl.getUniformLocation(prog, "u_nodeSizes[0]"),
      (avatar.shape.size[0] * 0.5) / SCALE,
      (avatar.shape.size[1] * 0.5) / SCALE,
      (avatar.shape.size[2] * 0.5) / SCALE
    );
    gl.uniform3f(gl.getUniformLocation(prog, "u_nodePos[0]"), 0, 0, 0);
    gl.uniform3f(gl.getUniformLocation(prog, "u_nodeRot[0]"), 0, 0, 0);
    gl.uniform1f(gl.getUniformLocation(prog, "u_nodeRound[0]"), avatar.shape.roundness ?? 0.5);

    for (let i = 0; i < totalNodes - 1; i++) {
      const n = nodes[i];
      const idx = i + 1;
      gl.uniform1i(gl.getUniformLocation(prog, `u_nodeTypes[${idx}]`), SHAPE_TYPE_MAP[n.shape] ?? 0);
      gl.uniform3f(
        gl.getUniformLocation(prog, `u_nodeSizes[${idx}]`),
        (n.size[0] * 0.5) / SCALE,
        (n.size[1] * 0.5) / SCALE,
        (n.size[2] * 0.5) / SCALE
      );
      gl.uniform3f(
        gl.getUniformLocation(prog, `u_nodePos[${idx}]`),
        n.position[0] / SCALE,
        -n.position[1] / SCALE,
        n.position[2] / SCALE
      );
      gl.uniform3f(
        gl.getUniformLocation(prog, `u_nodeRot[${idx}]`),
        (n.rotation?.[0] || 0) * DEG2RAD,
        (n.rotation?.[1] || 0) * DEG2RAD,
        -(n.rotation?.[2] || 0) * DEG2RAD
      );
      gl.uniform1f(gl.getUniformLocation(prog, `u_nodeRound[${idx}]`), n.roundness ?? 0.5);
    }

    const defaultExp = expressionsMap.get("expression-00") || AVATAR_STUDIO_DATA.expressions[0];

    // Animation state machine
    let rafId = 0;
    const startTime = performance.now();
    let nextBlinkTime =
      startTime + (sequence.blink?.initialDelayMs || 1800) + Math.random() * 600;
    const blinkDuration = sequence.blink?.durationMs || 150;

    // Total cycle duration of sequence steps
    const steps = sequence.steps?.length ? sequence.steps : [{ id: "s0", expressionId: "expression-00", holdMs: 2000, transitionMs: 300, transition: "smooth" }];
    const stepDurations = steps.map((s) => Math.max(50, (s.holdMs || 500) + (s.transitionMs || 250)));
    const totalCycleMs = stepDurations.reduce((acc, v) => acc + v, 0);

    // Smoothed gaze state
    let smoothGazeX = 0;
    let smoothGazeY = 0;

    const renderFrame = (now: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Determine current interpolated expression from sequence (or direct expressionId override)
      let currentExp: AvatarExpression = defaultExp;
      let nextExp: AvatarExpression = defaultExp;
      let blendT = 0;

      if (expressionId && expressionsMap.has(expressionId)) {
        currentExp = expressionsMap.get(expressionId)!;
        nextExp = currentExp;
        blendT = 0;
      } else {
        const elapsedInCycle = (now - startTime) % totalCycleMs;
        let accum = 0;
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const dur = stepDurations[i];
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

      // Interpolate expression values
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

      // Blinking logic
      if (sequence.blink?.enabled !== false && sequence.id !== "sleeping") {
        if (now >= nextBlinkTime) {
          const blinkElapsed = now - nextBlinkTime;
          if (blinkElapsed <= blinkDuration) {
            const bt = Math.sin((blinkElapsed / blinkDuration) * Math.PI);
            heightLeft = lerp(heightLeft, 10, bt);
            heightRight = lerp(heightRight, 10, bt);
            widthLeft = lerp(widthLeft, widthLeft * 1.25, bt);
            widthRight = lerp(widthRight, widthRight * 1.25, bt);
          } else {
            const minInt = sequence.blink?.minIntervalMs || 2200;
            const maxInt = sequence.blink?.maxIntervalMs || 4800;
            nextBlinkTime = now + minInt + Math.random() * (maxInt - minInt);
          }
        }
      }

      // Smooth cursor gaze tracking
      smoothGazeX = lerp(smoothGazeX, pointerRef.current.x, 0.08);
      smoothGazeY = lerp(smoothGazeY, pointerRef.current.y, 0.08);

      const gazeYaw = interactiveGaze ? smoothGazeX * 14 : 0;
      const gazePitch = interactiveGaze ? smoothGazeY * 11 : 0;

      // Body & Eye Motion (slowDrift / shake)
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

      // Colors
      const activeBodyHex = customBodyColor || avatar.bodyColor || "#fe7c7c";
      const activeEyeHex = customEyeColor || avatar.eyeColor || "#3e4e65";
      const [br, bg, bb] = hexToRgbNormalized(activeBodyHex);
      const [er, eg, eb] = hexToRgbNormalized(activeEyeHex);
      gl.uniform3f(uBodyColor, br, bg, bb);
      gl.uniform3f(uEyeColor, er, eg, eb);

      // Head rotation in radians
      gl.uniform3f(
        uHeadRot,
        (headXDeg + gazeYaw) * DEG2RAD,
        (headYDeg + gazePitch) * DEG2RAD,
        headZDeg * DEG2RAD
      );
      gl.uniform2f(uBodyOffset, driftX, driftY);

      // Left & Right eye centers and half-extents in shader space
      const lx = (-(spacing + widthLeft * 0.5) + posXLeft + eyeShakeX) / SCALE;
      const ly = (-(posYLeft + eyeShakeY)) / SCALE;
      const rx = (spacing + widthRight * 0.5 + posXRight + eyeShakeX) / SCALE;
      const ry = (-(posYRight + eyeShakeY)) / SCALE;

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
  }, [avatar, sequence, expressionId, size, interactiveGaze, customBodyColor, customEyeColor, expressionsMap]);

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
