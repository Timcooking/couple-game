
import React, { useRef, useEffect } from 'react';
import type { Level } from '../types';

interface DynamicBackgroundProps {
  level: Level;
}

const backgroundOptions: Record<Level, {
    particleColor: string;
    lineColor: string;
    particleAmount: number;
    defaultRadius: number;
    variantRadius: number;
    defaultSpeed: number;
    variantSpeed: number;
    linkRadius: number;
    background: string;
}> = {
  gentle: {
    particleColor: 'rgba(165, 180, 252, 0.6)', // Indigo 300
    lineColor: 'rgba(165, 180, 252, 0.15)',
    particleAmount: 50,
    defaultRadius: 2,
    variantRadius: 1,
    defaultSpeed: 0.5,
    variantSpeed: 0.5,
    linkRadius: 200,
    background: '#0f172a' // Slate 900 (Deep mysterious blue/black)
  },
  warming: {
    particleColor: 'rgba(251, 146, 60, 0.8)', // Orange 400
    lineColor: 'rgba(251, 146, 60, 0.25)',
    particleAmount: 70,
    defaultRadius: 2.5,
    variantRadius: 1.5,
    defaultSpeed: 0.8,
    variantSpeed: 0.6,
    linkRadius: 220,
    background: '#431407' // Deep Orange/Brown (Visible Warm tint)
  },
  intimate: {
    particleColor: 'rgba(244, 63, 94, 0.8)', // Rose 500
    lineColor: 'rgba(244, 63, 94, 0.3)',
    particleAmount: 60,
    defaultRadius: 2,
    variantRadius: 2,
    defaultSpeed: 0.4,
    variantSpeed: 0.3,
    linkRadius: 250,
    background: '#4a044e' // Deep Fuchsia/Purple (Visible Pink tint)
  }
};


const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[];
    const options = backgroundOptions[level];

    // Force style update immediately
    canvas.style.background = options.background;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Particle {
      x: number;
      y: number;
      radius: number;
      speed: number;
      directionAngle: number;
      vx: number;
      vy: number;

      constructor() {
        // Fix: Use non-null assertion (!) because we checked canvas existence outside the class
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.radius = options.defaultRadius + Math.random() * options.variantRadius;
        this.speed = options.defaultSpeed + Math.random() * options.variantSpeed;
        this.directionAngle = Math.floor(Math.random() * 360);
        this.vx = Math.cos(this.directionAngle) * this.speed;
        this.vy = Math.sin(this.directionAngle) * this.speed;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Fix: Use non-null assertion (!) here as well
        if (this.x > canvas!.width || this.x < 0) this.vx *= -1;
        if (this.y > canvas!.height || this.y < 0) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = options.particleColor;
        ctx.fill();
      }
    }

    const setupParticles = () => {
      particles = [];
      for (let i = 0; i < options.particleAmount; i++) {
        particles.push(new Particle());
      }
    };
    
    const drawLines = () => {
        let x1, y1, x2, y2, length, opacity;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                x1 = particles[i].x;
                y1 = particles[i].y;
                x2 = particles[j].x;
                y2 = particles[j].y;
                length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                if (length < options.linkRadius) {
                    opacity = 1 - length / options.linkRadius;
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = options.lineColor.replace(/[\d\.]+\)$/, `${opacity * 0.3})`);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    setupParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [level]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, transition: 'background 1.5s ease-in-out' }} />;
};

export default DynamicBackground;
