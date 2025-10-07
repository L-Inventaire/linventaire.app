import { useCallback, useEffect, useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startPos: Position;
  initialPos: Position;
  currentPos: Position;
}

export const useDragModal = () => {
  const draggableRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [, setIsAnimating] = useState(false);
  const dragState = useRef<DragState>({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    initialPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging || !draggableRef.current) return;

    const deltaX = e.clientX - dragState.current.startPos.x;
    const deltaY = e.clientY - dragState.current.startPos.y;

    const newPosition = {
      x: dragState.current.initialPos.x + deltaX,
      y: dragState.current.initialPos.y + deltaY,
    };

    // Directly update the transform without state
    dragState.current.currentPos = newPosition;
    const transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;
    draggableRef.current.style.transform = transform;
    draggableRef.current.style.transition = ""; // Remove any transition during drag
  }, []);

  const handleMouseUp = useCallback((e: any) => {
    if (dragState.current.isDragging) {
      dragState.current.isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!draggableRef.current) return;

    // Test if any class .draggable-handle is in the path, or the dragHandleRef itself
    if (
      dragHandleRef.current &&
      !e.composedPath().includes(dragHandleRef.current) &&
      !e
        .composedPath()
        .some((el) =>
          (el as HTMLElement).classList?.contains("draggable-handle")
        )
    ) {
      return;
    }

    dragState.current.isDragging = true;
    dragState.current.startPos = { x: e.clientX, y: e.clientY };
    dragState.current.initialPos = { ...dragState.current.currentPos };

    document.body.style.cursor = "move";
    document.body.style.userSelect = "none";

    e.preventDefault();
  }, []);

  const handleDoubleClick = useCallback((e: any) => {
    if (!draggableRef.current) return;

    setIsAnimating(true);
    dragState.current.currentPos = { x: 0, y: 0 };

    // Apply transition and center the modal
    draggableRef.current.style.transition = "transform 0.3s ease-out";
    draggableRef.current.style.transform = "translate(0px, 0px)";

    // Remove animation class after transition completes
    setTimeout(() => {
      setIsAnimating(false);
      if (draggableRef.current) {
        draggableRef.current.style.transition = "";
      }
    }, 300);
  }, []);

  useEffect(() => {
    const draggable = draggableRef.current;
    if (!draggable) return;

    draggable.addEventListener("mousedown", handleMouseDown);
    draggable.addEventListener("dblclick", handleDoubleClick);
    draggable.addEventListener("mouseup", handleMouseUp);

    return () => {
      draggable.removeEventListener("mousedown", handleMouseDown);
      draggable.removeEventListener("dblclick", handleDoubleClick);
      draggable.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleDoubleClick]);

  useEffect(() => {
    // Attach mouse events to window to prevent losing events when moving fast
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    draggableRef,
    dragHandleRef,
    isDragging: dragState.current.isDragging,
  };
};
