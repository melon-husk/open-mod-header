import { useEffect, useState } from "react";

export interface TourStep {
  selector: string;
  title: string;
  text: string;
  placement: "top" | "bottom" | "bottom-left" | "bottom-right";
}

export function TourOverlay({
  activeStep,
  steps,
  onNext,
  onPrev,
  onDismiss,
}: {
  activeStep: number;
  steps: TourStep[];
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const currentStep = steps[activeStep];

  useEffect(() => {
    function updateRect() {
      if (!currentStep) return;
      const element = document.querySelector(currentStep.selector);
      if (element) {
        setRect(element.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }

    // Run initially
    updateRect();

    // Re-run on layout change and window resize
    window.addEventListener("resize", updateRect);
    const interval = setInterval(updateRect, 300); // Poll in case of tab transitions or rendering delay

    return () => {
      window.removeEventListener("resize", updateRect);
      clearInterval(interval);
    };
  }, [activeStep, currentStep]);

  if (!currentStep) return null;

  const tooltipWidth = 320;
  const stepPlacement = currentStep.placement || "bottom";

  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    width: tooltipWidth,
    zIndex: 10001,
    background: "var(--card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--r-surface)",
    boxShadow: "var(--shadow-modal)",
    padding: "16px",
    color: "var(--ink)",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
  };

  let arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: "12px",
    height: "12px",
    background: "var(--card)",
    transform: "rotate(45deg)",
    zIndex: 10002,
    boxSizing: "border-box",
  };

  if (rect && rect.width > 0 && rect.height > 0) {
    if (stepPlacement === "bottom") {
      tooltipStyle.top = rect.bottom + 12;
      tooltipStyle.left = Math.max(
        16,
        Math.min(
          window.innerWidth - tooltipWidth - 16,
          rect.left + rect.width / 2 - tooltipWidth / 2
        )
      );
      arrowStyle.top = "-6px";
      arrowStyle.left = "calc(50% - 6px)";
      arrowStyle.borderLeft = "1px solid var(--border-subtle)";
      arrowStyle.borderTop = "1px solid var(--border-subtle)";
    } else if (stepPlacement === "top") {
      tooltipStyle.bottom = window.innerHeight - rect.top + 12;
      tooltipStyle.left = Math.max(
        16,
        Math.min(
          window.innerWidth - tooltipWidth - 16,
          rect.left + rect.width / 2 - tooltipWidth / 2
        )
      );
      arrowStyle.bottom = "-6px";
      arrowStyle.left = "calc(50% - 6px)";
      arrowStyle.borderRight = "1px solid var(--border-subtle)";
      arrowStyle.borderBottom = "1px solid var(--border-subtle)";
    } else if (stepPlacement === "bottom-left") {
      tooltipStyle.top = rect.bottom + 12;
      tooltipStyle.left = Math.max(16, rect.left);
      arrowStyle.top = "-6px";
      arrowStyle.left = "20px";
      arrowStyle.borderLeft = "1px solid var(--border-subtle)";
      arrowStyle.borderTop = "1px solid var(--border-subtle)";
    } else if (stepPlacement === "bottom-right") {
      tooltipStyle.top = rect.bottom + 12;
      tooltipStyle.left = Math.max(16, rect.right - tooltipWidth);
      arrowStyle.top = "-6px";
      arrowStyle.left = "calc(100% - 32px)";
      arrowStyle.borderLeft = "1px solid var(--border-subtle)";
      arrowStyle.borderTop = "1px solid var(--border-subtle)";
    }
  } else {
    // Fallback: Center on screen if target is not available/visible
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {/* Background Dim overlay with highlight cutout */}
      {rect && rect.width > 0 && rect.height > 0 && (
        <div
          style={{
            position: "fixed",
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px var(--scrim)",
            borderRadius: "var(--r-control)",
            border: "2px solid var(--purple)",
            pointerEvents: "none",
            zIndex: 10000,
            transition: "all 0.15s ease",
          }}
        />
      )}

      {/* Scrim overlay if target is not found/visible */}
      {(!rect || rect.width === 0 || rect.height === 0) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--scrim)",
            zIndex: 10000,
          }}
        />
      )}

      {/* Tooltip Popover */}
      <div style={tooltipStyle}>
        {rect && rect.width > 0 && rect.height > 0 && <div style={arrowStyle} />}
        <h4
          style={{
            fontSize: "14px",
            fontWeight: 700,
            margin: "0 0 8px 0",
            color: "var(--purple-strong)",
          }}
        >
          {currentStep.title}
        </h4>
        <p
          style={{
            fontSize: "12px",
            lineHeight: "1.45",
            margin: "0 0 16px 0",
            color: "var(--muted)",
          }}
        >
          {currentStep.text}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            Step {activeStep + 1} of {steps.length}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="ghost-btn"
              style={{
                padding: "4px 8px",
                fontSize: "11px",
              }}
              onClick={onDismiss}
            >
              Dismiss
            </button>
            {activeStep > 0 && (
              <button
                className="ghost-btn"
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                }}
                onClick={onPrev}
              >
                Back
              </button>
            )}
            <button
              className="primary-btn"
              style={{
                padding: "4px 10px",
                fontSize: "11px",
              }}
              onClick={onNext}
            >
              {activeStep === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
