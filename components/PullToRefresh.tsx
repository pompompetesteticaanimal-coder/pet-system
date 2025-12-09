import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '' }) => {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const PULL_THRESHOLD = 80;
    const MAX_PULL = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startY || isRefreshing) return;

        // Check if we are at the top
        if (scrollRef.current && scrollRef.current.scrollTop > 0) {
            setStartY(0);
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Add resistance
            const dampedDiff = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(dampedDiff);
            // Prevent native scroll/refresh if we are pulling
            if (e.cancelable && diff > 5) {
                // Note: passive listeners can't preventDefault, but we are in React synthetic events
                // Usually we rely on CSS overscroll-behavior: none
            }
        }
    };

    const handleTouchEnd = async () => {
        if (!startY) return;

        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(60); // Hold position for spinner
            try {
                await onRefresh();
            } finally {
                // Wait a bit to show success state if desired, or just close
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 500);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    return (
        <div
            ref={scrollRef}
            className={`relative overflow-y-auto overscroll-none ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull Indicator / Spinner */}
            <div
                className="absolute top-0 left-0 w-full flex justify-center pointer-events-none"
                style={{
                    height: `${pullDistance}px`,
                    transition: isRefreshing ? 'height 0.2s ease-out' : 'height 0s'
                }}
            >
                <div className="flex items-end pb-4 overflow-hidden">
                    {isRefreshing ? (
                        <div className="bg-white p-2 rounded-full shadow-md border border-gray-100 animate-in fade-in zoom-in duration-200">
                            <Loader2 className="animate-spin text-brand-600" size={24} />
                        </div>
                    ) : (
                        <div
                            className={`bg-white p-2 rounded-full shadow-md border border-gray-100 transition-all duration-200 ${pullDistance > 10 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                            style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
                        >
                            <ArrowDown className={`text-brand-500 transition-colors ${pullDistance > PULL_THRESHOLD ? 'text-brand-600' : 'text-gray-400'}`} size={24} />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isRefreshing ? 'transform 0.2s cubic-bezier(0,0,0.2,1)' : 'transform 0.1s ease-out'
                }}
                className="min-h-full"
            >
                {children}
            </div>
        </div>
    );
};
