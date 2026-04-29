import { useEffect, useRef } from "react";

type NumberRange = number[];

export interface SakuraConfig {
  enabled?: boolean;
  count?: number;
  size?: NumberRange;
  opacity?: NumberRange;
  fallSpeed?: NumberRange;
  driftSpeed?: NumberRange;
  flipSpeed?: NumberRange;
  spinSpeed?: NumberRange;
  wobbleAmplitude?: NumberRange;
  wobbleSpeed?: NumberRange;
  windFactor?: NumberRange;
  breezeStrength?: number;
  pointerWindStrength?: number;
  pointerVerticalWindStrength?: number;
  pressWindStrength?: number;
  pressChaos?: number;
  colors?: {
    hue?: NumberRange;
    saturation?: NumberRange;
    lightness?: NumberRange;
  };
}

type NormalizedSakuraConfig = Required<Omit<SakuraConfig, "colors">> & {
  colors: Required<NonNullable<SakuraConfig["colors"]>>;
};

const DEFAULT_CONFIG: NormalizedSakuraConfig = {
  enabled: true,
  count: 120,
  size: [5, 11],
  opacity: [0.4, 0.9],
  fallSpeed: [0.4, 1.3],
  driftSpeed: [-0.3, 0.3],
  flipSpeed: [0.005, 0.025],
  spinSpeed: [-0.01, 0.01],
  wobbleAmplitude: [0.5, 2.5],
  wobbleSpeed: [0.0005, 0.0015],
  windFactor: [0.5, 1.5],
  breezeStrength: 0.5,
  pointerWindStrength: 1.5,
  pointerVerticalWindStrength: 0.5,
  pressWindStrength: 8,
  pressChaos: 2,
  colors: {
    hue: [340, 355],
    saturation: [70, 90],
    lightness: [75, 90],
  },
};

const normalizeRange = (
  range: NumberRange | undefined,
  fallback: NumberRange,
) => {
  if (!range || range.length < 2) return fallback;

  const min = Number(range[0]);
  const max = Number(range[1]);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
  return min <= max ? [min, max] : [max, min];
};

const randomInRange = (range: NumberRange) =>
  range[0] + Math.random() * (range[1] - range[0]);

const normalizeNumber = (value: number | undefined, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeCount = (value: number | undefined) =>
  Math.max(0, Math.floor(normalizeNumber(value, DEFAULT_CONFIG.count)));

const normalizeConfig = (config?: SakuraConfig): NormalizedSakuraConfig => ({
  ...DEFAULT_CONFIG,
  ...config,
  count: normalizeCount(config?.count),
  size: normalizeRange(config?.size, DEFAULT_CONFIG.size),
  opacity: normalizeRange(config?.opacity, DEFAULT_CONFIG.opacity),
  fallSpeed: normalizeRange(config?.fallSpeed, DEFAULT_CONFIG.fallSpeed),
  driftSpeed: normalizeRange(config?.driftSpeed, DEFAULT_CONFIG.driftSpeed),
  flipSpeed: normalizeRange(config?.flipSpeed, DEFAULT_CONFIG.flipSpeed),
  spinSpeed: normalizeRange(config?.spinSpeed, DEFAULT_CONFIG.spinSpeed),
  wobbleAmplitude: normalizeRange(
    config?.wobbleAmplitude,
    DEFAULT_CONFIG.wobbleAmplitude,
  ),
  wobbleSpeed: normalizeRange(config?.wobbleSpeed, DEFAULT_CONFIG.wobbleSpeed),
  windFactor: normalizeRange(config?.windFactor, DEFAULT_CONFIG.windFactor),
  breezeStrength: normalizeNumber(
    config?.breezeStrength,
    DEFAULT_CONFIG.breezeStrength,
  ),
  pointerWindStrength: normalizeNumber(
    config?.pointerWindStrength,
    DEFAULT_CONFIG.pointerWindStrength,
  ),
  pointerVerticalWindStrength: normalizeNumber(
    config?.pointerVerticalWindStrength,
    DEFAULT_CONFIG.pointerVerticalWindStrength,
  ),
  pressWindStrength: normalizeNumber(
    config?.pressWindStrength,
    DEFAULT_CONFIG.pressWindStrength,
  ),
  pressChaos: normalizeNumber(config?.pressChaos, DEFAULT_CONFIG.pressChaos),
  colors: {
    ...DEFAULT_CONFIG.colors,
    ...config?.colors,
    hue: normalizeRange(config?.colors?.hue, DEFAULT_CONFIG.colors.hue),
    saturation: normalizeRange(
      config?.colors?.saturation,
      DEFAULT_CONFIG.colors.saturation,
    ),
    lightness: normalizeRange(
      config?.colors?.lightness,
      DEFAULT_CONFIG.colors.lightness,
    ),
  },
});

class Petal {
  windowWidth: number;
  windowHeight: number;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  flip: number;
  flipSpeed: number;
  vY: number;
  vX: number;
  angle: number;
  angleSpin: number;
  color: string;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  wobblePhase: number;
  windFactor: number;

  constructor(
    windowWidth: number,
    windowHeight: number,
    config: NormalizedSakuraConfig,
  ) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.x = Math.random() * windowWidth;
    this.y = Math.random() * windowHeight - windowHeight; // Start above screen

    // Different sizes for depth illusion
    const size = randomInRange(config.size);
    const depthFactor =
      (size - config.size[0]) / (config.size[1] - config.size[0] || 1);
    this.w = size;
    this.h = size * 1.45;

    this.opacity = randomInRange(config.opacity);
    this.flip = Math.random();
    this.flipSpeed = randomInRange(config.flipSpeed);
    this.vY = randomInRange(config.fallSpeed) + depthFactor * 0.3;
    this.vX = randomInRange(config.driftSpeed);
    this.angle = Math.random() * 360;
    this.angleSpin = randomInRange(config.spinSpeed);

    // Organic movement parameters
    this.wobbleAmplitude = randomInRange(config.wobbleAmplitude);
    this.wobbleSpeed = randomInRange(config.wobbleSpeed);
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.windFactor = randomInRange(config.windFactor);

    // Sakura pink colors
    const hue = randomInRange(config.colors.hue);
    const sat = randomInRange(config.colors.saturation);
    const lum = randomInRange(config.colors.lightness);
    this.color = `hsla(${hue}, ${sat}%, ${lum}%, ${this.opacity})`;
  }

  update(time: number, windX: number, windY: number) {
    // Organic Sway
    const sway =
      Math.sin(time * this.wobbleSpeed + this.wobblePhase) *
      this.wobbleAmplitude;

    this.x += this.vX + sway + windX * this.windFactor;

    // Slightly alter fall speed depending on 3d flip state
    this.y += this.vY + windY * this.windFactor + Math.sin(this.flip) * 0.15;

    this.flip += this.flipSpeed;
    this.angle += this.angleSpin;

    // Reset when out of bounds
    if (this.y > this.windowHeight + this.h) {
      this.y = -this.h;
      this.x = Math.random() * this.windowWidth;
    } else if (this.y < -this.h - 50) {
      this.y = this.windowHeight + this.h;
      this.x = Math.random() * this.windowWidth;
    }

    if (this.x > this.windowWidth + this.w) {
      this.x = -this.w;
    } else if (this.x < -this.w) {
      this.x = this.windowWidth + this.w;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(1, Math.abs(Math.cos(this.flip))); // 3d flipping illusion
    ctx.fillStyle = this.color;
    // draw a simple petal shape using quadratic curves
    ctx.beginPath();
    ctx.moveTo(0, this.h / 2);
    ctx.quadraticCurveTo(this.w / 2, -this.h / 4, this.w, this.h / 2);
    ctx.quadraticCurveTo(this.w / 2, this.h * 1.25, 0, this.h / 2);
    ctx.fill();
    ctx.restore();
  }
}

interface SakuraCanvasProps {
  count?: number;
  config?: SakuraConfig;
}

export function SakuraCanvas({ count, config }: SakuraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sakuraConfig = normalizeConfig({
      ...config,
      count: count ?? config?.count,
    });
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Petal[] = [];

    // Interaction states
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isPressed = false;
    let isMouseActive = false;
    let currentWindX = 0;
    let currentWindY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      isMouseActive = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const handlePointerDown = () => {
      isPressed = true;
    };
    const handlePointerUp = () => {
      isPressed = false;
    };
    const handlePointerLeave = () => {
      isMouseActive = false;
      isPressed = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("pointerleave", handlePointerLeave);

    // Resize handler
    const handleResize = () => {
      // Setup display size
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Setup high DPI canvas
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Normalize coordinate system to use css pixels
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Re-initialize particles
      particles = Array.from({ length: sakuraConfig.count }).map(
        () => new Petal(width, height, sakuraConfig),
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = (time: number) => {
      // Calculate target wind
      let targetWindX = Math.sin(time * 0.0002) * sakuraConfig.breezeStrength;
      let targetWindY = 0;

      if (isMouseActive) {
        const nx = (mouseX / window.innerWidth) * 2 - 1; // -1 to 1
        const ny = (mouseY / window.innerHeight) * 2 - 1; // -1 to 1

        // Mouse determines wind direction (relative to center)
        targetWindX = nx * sakuraConfig.pointerWindStrength;
        targetWindY = ny * sakuraConfig.pointerVerticalWindStrength;

        // Pressing empowers the wind and adds chaos
        if (isPressed) {
          targetWindX =
            nx * sakuraConfig.pressWindStrength +
            (Math.random() - 0.5) * sakuraConfig.pressChaos;
          targetWindY =
            ny * sakuraConfig.pressWindStrength +
            (Math.random() - 0.5) * sakuraConfig.pressChaos;
        }
      }

      // Smoothly interpolate wind
      const lerpSpeed = isPressed ? 0.05 : 0.01;
      currentWindX += (targetWindX - currentWindX) * lerpSpeed;
      currentWindY += (targetWindY - currentWindY) * lerpSpeed;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update(time, currentWindX, currentWindY);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, config]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
  );
}
