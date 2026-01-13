import { useState, useEffect, useCallback } from 'react';

interface ResizeHandleProps {
    direction: 'horizontal' | 'vertical';
    onResize: (delta: number) => void;
    className?: string;
}

export function ResizeHandle({ direction, onResize, className = '' }: ResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            const delta = direction === 'vertical' ? e.movementY : e.movementX;
            onResize(delta);
        },
        [isDragging, direction, onResize]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = direction === 'vertical' ? 'ns-resize' : 'ew-resize';
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, direction]);

    const baseClasses =
        direction === 'vertical'
            ? 'shrink-0 grow-0 h-1 cursor-ns-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors'
            : 'shrink-0 grow-0 w-1 cursor-ew-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors';

    const activeClass = isDragging ? 'bg-blue-500' : 'bg-zinc-800';

    return (
        <div
            className={`${baseClasses} ${activeClass} ${className}`}
            onMouseDown={handleMouseDown}
        />
    );
}