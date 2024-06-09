import { useCallback, useEffect } from "react";

let currentTarget: null | Element = null;

function showTooltip(that: any) {
  let tooltipText = that.getAttribute("data-tooltip");
  const position = that.getAttribute("data-position") || "top";
  const tooltip = document.createElement("div");
  tooltip.className = `tooltip bg-white text-black dark:bg-slate-900 dark:text-white shadow-lg text-sm border-[0.5px] border-slate-100 dark:border-slate-700 rounded tooltip-${position}`;

  // Apply some markdown-like formatting
  tooltipText = tooltipText.replace(/`([^`]+)`/gm, (_: any, p1: string) => {
    return `<span class='font-mono border-[0.5px] border-slate-100 dark:border-slate-800 rounded px-1 shadow-sm'>${p1}</span>`;
  });

  tooltip.innerHTML =
    `${tooltipText}` === "true" ? that.innerHTML : tooltipText;

  that.addEventListener("click", () => {
    const clickedText = that.getAttribute("data-click");
    if (clickedText) tooltip.textContent = clickedText;
  });

  const rect = that.getBoundingClientRect();

  switch (position) {
    case "top":
      tooltip.style.left = (rect.left + rect.right) / 2 + "px";
      tooltip.style.top = rect.top - 4 + "px";
      tooltip.style.transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      tooltip.style.left = (rect.left + rect.right) / 2 + "px";
      tooltip.style.top = rect.bottom + 4 + "px";
      tooltip.style.transform = "translate(-50%, 0)";
      break;
    case "left":
      tooltip.style.left = rect.left - 6 + "px";
      tooltip.style.top = rect.top + "px";
      tooltip.style.transform = "translate(-100%, 0)";
      break;
    case "right":
      tooltip.style.left = rect.right + 6 + "px";
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

// The first time the tooltip is shown, it will be shown with a delay
// This is to prevent the tooltip from being shown when the user is just scrolling
// But then all the other tooltips will be shown instantly
let inTooltipRoll = false;
let inTooltipRollTimeout: any;

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
      if (inTooltipRollTimeout) clearTimeout(inTooltipRollTimeout);
      if (target && target?.getAttribute("data-tooltip")) {
        inTooltipRollTimeout = setTimeout(
          () => {
            inTooltipRoll = true;
            showTooltip(target);
          },
          inTooltipRoll ? 0 : 500
        );
      } else {
        inTooltipRollTimeout = setTimeout(() => {
          inTooltipRoll = false;
        }, 1000);
      }
    });

    // CSS part
    document.head.insertAdjacentHTML(
      "beforeend",
      `
      <style>
        .tooltip {
          position: absolute;
          padding: 3px 6px;
          pointer-events: none;
          transition: opacity 0.1s ease-in-out;
          z-index: 9999;
        }
      </style>
      `
    );
  }, []);

  return <></>;
};
