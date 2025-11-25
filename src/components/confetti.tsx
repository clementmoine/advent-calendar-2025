import React, { ReactElement, useEffect, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ConfigType = {
  gravity: number;
  particle_count: number;
  particle_size: number;
  explosion_power: number;
  destroy_target: boolean;
  fade: boolean;
  symbol: string | null;
};

class Config implements ConfigType {
  gravity = 10;
  particle_count = 75;
  particle_size = 1;
  explosion_power = 25;
  destroy_target = true;
  fade = false;
  symbol: string | null = null;
}

class Vector {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Particle {
  size: Vector;
  position: Vector;
  velocity: Vector;
  rotation: number;
  rotation_speed: number;
  hue: number;
  opacity: number;
  lifetime: number;
  cachedCanvas: HTMLCanvasElement | null = null;

  constructor(position: Vector) {
    this.size = new Vector(
      (16 * Math.random() + 4) * Confetti.CONFIG.particle_size,
      (4 * Math.random() + 4) * Confetti.CONFIG.particle_size
    );
    this.position = new Vector(
      position.x - this.size.x / 2,
      position.y - this.size.y / 2
    );
    this.velocity = Particle.generateVelocity();
    this.rotation = 360 * Math.random();
    this.rotation_speed = 10 * (Math.random() - 0.5);
    this.hue = 360 * Math.random();
    this.opacity = 100;
    this.lifetime = Math.random() + 0.25;

    // Pre-render emoji to canvas if symbol is defined
    if (Confetti.CONFIG.symbol) {
      this.cacheEmojiCanvas();
    }
  }

  private cacheEmojiCanvas(): void {
    const baseSize = Math.max(this.size.x, this.size.y);
    // Make emojis larger for better visibility (1.8x multiplier)
    const emojiSize = baseSize * 1.8;
    const canvas = document.createElement('canvas');
    canvas.width = emojiSize * 2;
    canvas.height = emojiSize * 2;
    const ctx = canvas.getContext('2d');
    if (ctx && Confetti.CONFIG.symbol) {
      ctx.font = `${emojiSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Confetti.CONFIG.symbol, emojiSize, emojiSize);
      this.cachedCanvas = canvas;
    }
  }

  static generateVelocity(): Vector {
    const angle = Math.random() * 2 * Math.PI;
    const speed = Math.random() * Confetti.CONFIG.explosion_power;
    return new Vector(speed * Math.cos(angle), speed * Math.sin(angle));
  }

  update(deltaTime: number): void {
    this.velocity.y +=
      Confetti.CONFIG.gravity *
      (this.size.y / (10 * Confetti.CONFIG.particle_size)) *
      deltaTime;
    this.velocity.x += 25 * (Math.random() - 0.5) * deltaTime;
    this.velocity.y *= 0.98;
    this.velocity.x *= 0.98;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.rotation += this.rotation_speed;
    if (Confetti.CONFIG.fade) {
      this.opacity -= this.lifetime;
    }
  }

  checkBounds(): boolean {
    return this.position.y - 2 * this.size.x > 2 * window.innerHeight;
  }

  isVisible(): boolean {
    // Larger margin to avoid hiding too early
    const margin = Math.max(this.size.x, this.size.y) * 2;
    return (
      this.position.x + margin >= 0 &&
      this.position.x - margin <= window.innerWidth &&
      this.position.y + margin >= 0 &&
      this.position.y - margin <= window.innerHeight
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2
    );
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = this.opacity / 100;

    if (Confetti.CONFIG.symbol) {
      if (this.cachedCanvas) {
        // Use pre-rendered canvas for better performance
        const baseSize = Math.max(this.size.x, this.size.y);
        // Make emojis larger for better visibility (1.8x multiplier)
        const emojiSize = baseSize * 1.8;
        ctx.drawImage(
          this.cachedCanvas,
          -emojiSize / 2,
          -emojiSize / 2,
          emojiSize,
          emojiSize
        );
      } else {
        // Direct fallback
        const baseSize = Math.max(this.size.x, this.size.y);
        const emojiSize = baseSize * 1.8;
        ctx.font = `${emojiSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Confetti.CONFIG.symbol, 0, 0);
      }
    } else {
      // Draw rectangle confetti (original behavior)
      ctx.beginPath();
      ctx.rect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
      ctx.fillStyle = `hsla(${this.hue}deg, 90%, 65%, ${this.opacity}%)`;
      ctx.fill();
    }

    ctx.restore();
  }
}

class Burst {
  particles: Particle[];

  constructor(position: Vector) {
    this.particles = [];
    for (let i = 0; i < Confetti.CONFIG.particle_count; i++) {
      this.particles.push(new Particle(position));
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (this.particles[i].checkBounds()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}

class Confetti {
  static CONFIG = new Config();
  bursts: Burst[];
  time: number;
  delta_time: number;
  element!: HTMLElement;
  static CTX: CanvasRenderingContext2D | null = null;

  constructor(id: string, symbol?: string | null) {
    if (!id) {
      throw new Error('Missing id');
    }

    this.bursts = [];
    this.time = new Date().getTime();
    this.delta_time = 0;
    if (symbol !== undefined) {
      Confetti.CONFIG.symbol = symbol ?? null;
    }
    this.setupCanvasContext();
    this.setupElement(id);
    window.requestAnimationFrame(this.update);
  }

  setCount(count: number): void {
    if (typeof count !== 'number') {
      throw new Error("Input must be of type 'number'");
    }
    Confetti.CONFIG.particle_count = count;
  }

  setPower(power: number): void {
    if (typeof power !== 'number') {
      throw new Error("Input must be of type 'number'");
    }
    Confetti.CONFIG.explosion_power = power;
  }

  setSize(size: number): void {
    if (typeof size !== 'number') {
      throw new Error("Input must be of type 'number'");
    }
    Confetti.CONFIG.particle_size = size;
  }

  setFade(fade: boolean): void {
    if (typeof fade !== 'boolean') {
      throw new Error("Input must be of type 'boolean'");
    }
    Confetti.CONFIG.fade = fade;
  }

  destroyTarget(destroy: boolean): void {
    if (typeof destroy !== 'boolean') {
      throw new Error("Input must be of type 'boolean'");
    }
    Confetti.CONFIG.destroy_target = destroy;
  }

  setSymbol(symbol: string | null): void {
    Confetti.CONFIG.symbol = symbol;
  }

  setupCanvasContext(): void {
    if (!Confetti.CTX) {
      const canvas = document.createElement('canvas');
      Confetti.CTX = canvas.getContext('2d');
      if (Confetti.CTX) {
        canvas.width = 2 * window.innerWidth;
        canvas.height = 2 * window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = 'calc(100%)';
        canvas.style.height = 'calc(100%)';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        canvas.style.zIndex = '999999999';
        canvas.style.pointerEvents = 'none';
        document.body.appendChild(canvas);
        window.addEventListener('resize', () => {
          canvas.width = 2 * window.innerWidth;
          canvas.height = 2 * window.innerHeight;
        });
      }
    }
  }

  setupElement(id: string): void {
    this.element = document.getElementById(id)!;
    if (this.element) {
      this.element.addEventListener('click', event => {
        event.preventDefault();

        let position = new Vector(2 * event.clientX, 2 * event.clientY);
        if (event.clientY === 0 && event.clientX === 0) {
          const elementRect = this.element.getBoundingClientRect();

          position = new Vector(
            2 * (elementRect.x + elementRect.width / 2),
            2 * (elementRect.y + elementRect.height / 2)
          );
        }

        this.bursts.push(new Burst(position));
        if (Confetti.CONFIG.destroy_target) {
          this.element.style.visibility = 'hidden';
        }
      });
    }
  }

  update = (time: number): void => {
    this.delta_time = (time - this.time) / 1000;
    this.time = time;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      this.bursts[i].update(this.delta_time);
      if (this.bursts[i].particles.length === 0) {
        this.bursts.splice(i, 1);
      }
    }
    this.draw();
    window.requestAnimationFrame(this.update);
  };

  draw(): void {
    if (Confetti.CTX) {
      Confetti.CTX.clearRect(
        0,
        0,
        2 * window.innerWidth,
        2 * window.innerHeight
      );
      for (const burst of this.bursts) {
        burst.draw(Confetti.CTX);
      }
    }
  }
}

type ConfettiProps = {
  id: string;
  config?: Config;
  tooltip?: boolean;
  symbol?: string | null;
  children: ReactElement;
};

const ConfettiComponent: React.FC<ConfettiProps> = ({
  id,
  children,
  tooltip = true,
  symbol = null,
}) => {
  const confettiRef = useRef<Confetti | null>(null);

  useEffect(() => {
    if (id) {
      confettiRef.current = new Confetti(id, symbol);

      confettiRef.current.destroyTarget(false);
    }
    return () => {
      confettiRef.current = null;
    };
  }, [id, symbol]);

  return !tooltip ? (
    <div id={id} className='flex'>
      {children}
    </div>
  ) : (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div id={id} className='flex'>
          {children}
        </div>
      </TooltipTrigger>

      <TooltipContent side='top' sideOffset={5}>
        Celebrate with confetti! 🎉
      </TooltipContent>
    </Tooltip>
  );
};

export default ConfettiComponent;
