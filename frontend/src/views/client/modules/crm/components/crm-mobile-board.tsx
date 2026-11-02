import { useHasAccess } from "@features/access";
import { CRM_BOARD_STATES, CRMState } from "@features/crm/state/use-crm-board";
import { CRMItem } from "@features/crm/types/types";
import { formatNumber } from "@features/utils/format/strings";
import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { CRM_COLUMN_STYLES, useCreateCRMItem } from "./crm-column";
import { CRMItemsList } from "./crm-items-list";

const STORAGE_KEY = "crm-mobile-step";

const readStoredStep = (): CRMState | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as CRMState | null;
    return CRM_BOARD_STATES.some((s) => s.key === value) ? value : null;
  } catch {
    return null;
  }
};

/**
 * CRM on phones: one step at a time, chosen with tabs or by swiping left and
 * right, instead of columns side by side.
 */
export const CRMMobileBoard = ({
  query,
  counters,
  onMove,
}: {
  query: RestSearchQuery[];
  counters: Record<string, number | undefined>;
  onMove: (item: CRMItem, state: CRMState) => void;
}) => {
  const hasAccess = useHasAccess();
  const create = useCreateCRMItem();
  const [step, setStep] = useState<CRMState | null>(readStoredStep);

  // Without a step chosen before, open the first open step with items
  const countsLoaded = CRM_BOARD_STATES.every(
    (s) => counters[s.key] !== undefined,
  );
  const active: CRMState =
    step ||
    (countsLoaded
      ? CRM_BOARD_STATES.find((s) => s.key !== "won" && counters[s.key])?.key
      : undefined) ||
    "new";

  // Keep the step shown even if it becomes empty (last card moved away)
  useEffect(() => {
    if (!step && countsLoaded) setStep(active);
  }, [step, countsLoaded, active]);

  const select = (state: CRMState) => {
    setStep(state);
    try {
      localStorage.setItem(STORAGE_KEY, state);
    } catch {
      // Private browsing: the step is just not remembered
    }
  };

  // Keep the selected tab visible in the tabs bar
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsRef.current
      ?.querySelector(`[data-step="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  // Swipe left / right to go to the next / previous step
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    const index = CRM_BOARD_STATES.findIndex((s) => s.key === active);
    const next = CRM_BOARD_STATES[index + (dx < 0 ? 1 : -1)];
    if (next) select(next.key);
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={tabsRef}
        role="tablist"
        className="shrink-0 flex gap-2 overflow-x-auto px-3 py-2 border-b border-slate-100 dark:border-slate-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CRM_BOARD_STATES.map(({ key, label }) => {
          const selected = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              data-step={key}
              onClick={() => select(key)}
              className={twMerge(
                "shrink-0 flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-full border text-sm whitespace-nowrap transition-colors",
                selected
                  ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                  : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              <span
                className={twMerge(
                  "w-2 h-2 rounded-full",
                  CRM_COLUMN_STYLES[key].dot,
                )}
              />
              {label}
              <span
                className={twMerge(
                  "min-w-5 px-1 rounded-full text-xs",
                  selected
                    ? "bg-white/20 dark:bg-slate-900/10"
                    : "bg-slate-100 dark:bg-slate-800",
                )}
              >
                {formatNumber(counters[key] || 0)}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 min-h-0 relative"
        onTouchStart={(e) => {
          touch.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={onTouchEnd}
      >
        <CRMItemsList
          key={active}
          type={active}
          query={query}
          // Wait for the counters to pick the default step
          enabled={!!step || countsLoaded}
          draggable={false}
          onMove={onMove}
          className="absolute inset-0 px-3 pt-3 pb-24 bg-slate-25 dark:bg-slate-990"
        />
      </div>

      {hasAccess("CRM_WRITE") && (
        <button
          type="button"
          aria-label="Nouvelle opportunité"
          onClick={() => create(active)}
          className="fixed z-10 bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-slate-900 text-white dark:bg-white dark:text-slate-900 active:scale-95 transition-transform"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};
