import { useCallback, useEffect } from "react";

let currentTarget: null | Element = null;

function showTooltip(that: any) {
  const tooltipText = that.getAttribute("data-tooltip");
  const position = that.getAttribute("data-position") || "top";
  const tooltip = document.createElement("div");
  tooltip.className = `tooltip text-sm tooltip-${position}`;

  tooltip.textContent =
    `${tooltipText}` === "true" ? that.innerText : tooltipText;

  that.addEventListener("click", () => {
    const clickedText = that.getAttribute("data-click");
    if (clickedText) tooltip.textContent = clickedText;
  });

  const rect = that.getBoundingClientRect();

  switch (position) {
    case "top":
      tooltip.style.left = (rect.left + rect.right) / 2 + "px";
      tooltip.style.top = rect.top - 8 + "px";
      tooltip.style.transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      tooltip.style.left = (rect.left + rect.right) / 2 + "px";
      tooltip.style.top = rect.bottom + 8 + "px";
      tooltip.style.transform = "translate(-50%, 0)";
      break;
    case "left":
      tooltip.style.left = rect.left - 10 + "px";
      tooltip.style.top = rect.top + "px";
      tooltip.style.transform = "translate(-100%, 0)";
      break;
    case "right":
      tooltip.style.left = rect.right + 10 + "px";
      tooltip.style.top = rect.top + "px";
      tooltip.style.transform = "translate(0, 0)";
      break;
  }

  tooltip.style.opacity = "0";
  document.body.appendChild(tooltip);
  setTimeout(() => {
    tooltip.style.opacity = "1";
  }, 10);
}

function hideTooltips() {
  const tooltips = document.querySelectorAll(".tooltip");
  tooltips.forEach((tooltip: any) => {
    if (tooltip) {
      if (currentTarget) {
        tooltip.remove();
        return;
      }
      tooltip.style.opacity = "0";
      setTimeout(() => {
        tooltip.remove();
      }, 300);
    }
  });
}

export const Tooltip = () => {
  const updatePosition = useCallback(() => {
    if (currentTarget) showTooltip(currentTarget);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  useEffect(() => {
    document.body.addEventListener("mouseover", function (event) {
      const target =
        (event.target as any)?.closest &&
        (event.target as any)?.closest("[data-tooltip]");
      if (target && target === currentTarget) return;
      currentTarget = target;
      hideTooltips();
      if (target) showTooltip(target);
    });

    // CSS part
    document.head.insertAdjacentHTML(
      "beforeend",
      `
      <style>
        .tooltip {
          position: absolute;
          padding: 3px 6px;
          background: black;
          color: white;
          border-radius: 5px;
          pointer-events: none;
          transition: opacity 0.1s ease-in-out;
          z-index: 9999;
        }
        .tooltip::before {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-width: 5px;
          border-color: transparent;
          border-style: solid;
        }
        .tooltip-top::before {
          border-bottom: 5px solid black;
          left: 50%;
          bottom: -10px;
          transform: translateX(-50%) rotate(180deg);
        }
        .tooltip-bottom::before {
          border-top: 5px solid black;
          left: 50%;
          top: -10px;
          transform: translateX(-50%) rotate(180deg);
        }
        .tooltip-left::before {
          border-left: 5px solid black;
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
        }
        .tooltip-right::before {
          border-right: 5px solid black;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
        }
        
      </style>
      `
    );
  }, []);

  return <></>;
};
