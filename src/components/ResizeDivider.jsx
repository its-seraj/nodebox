import React, { useRef, forwardRef } from "react";
import "./ResizeDivider.css";

/**
 * A draggable vertical resize handle between two panes.
 */
const ResizeDivider = forwardRef(function ResizeDivider({ onMouseDown }, ref) {
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    const el = e.currentTarget;
    el.classList.add("is-dragging");

    const cleanup = () => {
      isDragging.current = false;
      el.classList.remove("is-dragging");
      window.removeEventListener("mouseup", cleanup);
    };
    window.addEventListener("mouseup", cleanup);
    onMouseDown(e);
  };

  return (
    <div
      ref={ref}
      className="resize-divider"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      tabIndex={0}
    >
      <div className="resize-divider__track">
        <div className="resize-divider__dots">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
});

export default ResizeDivider;
