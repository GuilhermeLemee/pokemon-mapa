import { useEffect, useRef } from "react";

const STAR_COUNT = 180;

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vTwinkle;

  void main() {
    vTwinkle = 0.55 + 0.45 * sin(uTime * 0.6 + aPhase);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = aSize;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying float vTwinkle;

  void main() {
    vec2 fromCenter = gl_PointCoord - vec2(0.5);
    float dist = length(fromCenter);
    float alpha = smoothstep(0.5, 0.0, dist) * vTwinkle;
    gl_FragColor = vec4(0.73, 0.84, 0.97, alpha);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Falha ao criar shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Erro ao compilar shader: ${info}`);
  }
  return shader;
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return; // sem suporte a WebGL: fundo liso continua funcionando sem o efeito

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positions = new Float32Array(STAR_COUNT * 2);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 2] = Math.random() * 2 - 1;
      positions[i * 2 + 1] = Math.random() * 2 - 1;
      sizes[i] = Math.random() * 1.8 + 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    const aSize = gl.getAttribLocation(program, "aSize");
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

    const phaseBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, phaseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, phases, gl.STATIC_DRAW);
    const aPhase = gl.getAttribLocation(program, "aPhase");
    gl.enableVertexAttribArray(aPhase);
    gl.vertexAttribPointer(aPhase, 1, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId: number;
    let start = performance.now();

    const draw = (time: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, prefersReducedMotion ? 0 : (time - start) / 1000);
      gl.drawArrays(gl.POINTS, 0, STAR_COUNT);
      if (!prefersReducedMotion) frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameId) cancelAnimationFrame(frameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(sizeBuffer);
      gl.deleteBuffer(phaseBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
