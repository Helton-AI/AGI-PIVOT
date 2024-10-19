"use client";

import React, { useEffect, useRef, useState } from "react";
import Walrus from "@/app/components/walrus";
import { ErrorBoundary } from "./error-boundary";

interface SquarePosition {
    top: number;
    left: number;
    color: string;
    blobId?: string;
    blobUrl?: string;
    isImage?: boolean;
}

const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
};

const IridescentSquare = ({ position, totalSquares }: { position: SquarePosition; totalSquares: number }) => {
    const squareRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const [animationStartDelay] = useState(() => Math.random() * 5000); // Random delay between 0-5 seconds

    useEffect(() => {
        const square = squareRef.current;
        if (!square) return;

        let startTime: number | null;
        let currentX = 0;
        let currentY = 0;
        let targetX = Math.random() * 16 - 8;
        let targetY = Math.random() * 16 - 8;
        let animationDuration = 3000 + Math.random() * 4000; // Random duration between 3-7 seconds

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            if (elapsed < animationDuration) {
                const progress = elapsed / animationDuration;
                currentX = easeInOutCubic(progress) * (targetX - currentX) + currentX;
                currentY = easeInOutCubic(progress) * (targetY - currentY) + currentY;
                square.style.transform = `translate(${currentX}px, ${currentY}px)`;
                animationRef.current = requestAnimationFrame(animate);
            } else {
                currentX = targetX;
                currentY = targetY;
                targetX = Math.random() * 16 - 8;
                targetY = Math.random() * 16 - 8;
                startTime = null;
                animationDuration = 3000 + Math.random() * 4000; // New random duration for next animation
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        // Start the animation after the random delay
        const delayTimeout = setTimeout(() => {
            animationRef.current = requestAnimationFrame(animate);
        }, animationStartDelay);

        return () => {
            clearTimeout(delayTimeout);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animationStartDelay]);

    const zIndex = Math.floor(Math.random() * totalSquares);

    return (
        <div
            ref={squareRef}
            className="absolute w-28 h-28 rounded-lg overflow-hidden transition-opacity duration-1000"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex,
                animation: `pulse ${5 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 5}s`,
                background: `linear-gradient(135deg, ${position.color} 0%, rgba(255,255,255,0.2) 100%)`,
                boxShadow: `0 0 20px ${position.color}40, inset 0 0 20px ${position.color}40`,
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-60 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-40 mix-blend-overlay" />
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(45deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
                    animation: `shimmer ${5 + Math.random() * 2}s infinite ${Math.random() * 5}s`,
                }}
            />
            {position.isImage ? <img src={position.blobUrl} className="size-full object-cover" /> : <div className="break-all">{position.blobId}</div>}
        </div>
    );
};

const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

export default function Component({ dataList }: { dataList: any[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [squares, setSquares] = useState<SquarePosition[]>([]);
    const totalSquares = 17; // 9 inner + 8 outer

    useEffect(() => {
        const generateSquares = () => {
            const newSquares: SquarePosition[] = [];
            const gridSize = 360;
            const squareSize = 112; // 28 * 4 (slightly larger than the actual square size)
            const innerGridSize = 240;

            // Generate inner squares
            for (let i = 0; i < 9; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                newSquares.push({
                    top: row * 80 + (Math.random() * 20 - 10) + (gridSize - innerGridSize) / 2,
                    left: col * 80 + (Math.random() * 20 - 10) + (gridSize - innerGridSize) / 2,
                    color: getRandomColor(),
                });
            }

            // Generate outer squares
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * 2 * Math.PI;
                const radius = gridSize / 2 - squareSize / 2;
                newSquares.push({
                    top: Math.sin(angle) * radius + gridSize / 2 - squareSize / 2 + (Math.random() * 20 - 10),
                    left: Math.cos(angle) * radius + gridSize / 2 - squareSize / 2 + (Math.random() * 20 - 10),
                    color: getRandomColor(),
                });
            }

            // Check and adjust for overlaps
            for (let i = 0; i < newSquares.length; i++) {
                for (let j = i + 1; j < newSquares.length; j++) {
                    const dx = newSquares[i].left - newSquares[j].left;
                    const dy = newSquares[i].top - newSquares[j].top;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < squareSize) {
                        const angle = Math.atan2(dy, dx);
                        const pushDistance = (squareSize - distance) / 2;
                        newSquares[i].left += Math.cos(angle) * pushDistance;
                        newSquares[i].top += Math.sin(angle) * pushDistance;
                        newSquares[j].left -= Math.cos(angle) * pushDistance;
                        newSquares[j].top -= Math.sin(angle) * pushDistance;
                    }
                }
            }
            const newSquaresReverse = newSquares.reverse();
            for (let i = 0; i < newSquares.length; i++) {
                if (dataList[i]) {
                    if (newSquaresReverse[i].blobId) {
                        continue;
                    }
                    newSquaresReverse[i] = { ...newSquaresReverse[i], ...dataList[i] };
                } else {
                    break;
                }
            }
            setSquares(newSquares.reverse());
        };
        generateSquares();
    }, [dataList]);

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.8; filter: brightness(1) contrast(1); }
        50% { opacity: 1; filter: brightness(1.2) contrast(1.1); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex-1 h-full flex items-center justify-center">
                    <div ref={containerRef} className="relative w-[360px] h-[360px]">
                        <div className="absolute inset-0 -m-4 bg-gray-900/30 rounded-3xl" />
                        {squares.map((position, index) => (
                            <IridescentSquare key={index} position={position} totalSquares={totalSquares} />
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-[#111] min-h-screen flex items-center justify-center">
                    <Walrus />
                </div>
            </div>
        </ErrorBoundary>
    );
}
