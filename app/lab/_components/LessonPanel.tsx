"use client";

import { useEffect, useState } from "react";
import type { Lesson, LessonStep } from "../_lib/lesson-types";

type Props<S> = {
  lesson: Lesson<S>;
  state: S;                    // current machine state
  stepIdx: number;             // -1 = intro screen, lesson.steps.length = reward screen
  onAdvance: () => void;
  onExit: () => void;
  // Called when a step's check passes (so the parent can advance automatically)
  onStepComplete?: (idx: number) => void;
};

export function LessonPanel<S>({
  lesson,
  state,
  stepIdx,
  onAdvance,
  onExit,
  onStepComplete,
}: Props<S>) {
  const isIntro = stepIdx < 0;
  const isReward = stepIdx >= lesson.steps.length;
  const step: LessonStep<S> | undefined = !isIntro && !isReward ? lesson.steps[stepIdx] : undefined;
  const [showHint, setShowHint] = useState(false);
  const total = lesson.steps.length;

  // Auto-advance: when check passes, fire onStepComplete (parent decides
  // when to actually call onAdvance — usually after a short celebrate delay).
  useEffect(() => {
    if (!step) return;
    setShowHint(false);
    const hintTimer = window.setTimeout(() => setShowHint(true), 7000);
    // poll the state via the check — but since state is a closed-over prop
    // we get re-runs whenever React re-renders. Just check once per render.
    if (step.check(state)) {
      onStepComplete?.(stepIdx);
    }
    return () => window.clearTimeout(hintTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, step, stepIdx]);

  return (
    <div
      className="border-2 border-lamp bg-ink-2 mb-3 overflow-hidden"
      style={{ boxShadow: "0 0 0 1px rgba(242,183,5,0.15), 4px 4px 0 rgba(242,183,5,0.18)" }}
    >
      <div className="flex items-stretch border-b border-lamp/60">
        <div className="bg-lamp text-ink px-3 py-2 font-mono text-[10px] tracking-[.16em] uppercase font-bold flex items-center">
          LESSON
        </div>
        <div className="flex-1 flex items-center justify-between px-3 py-2 gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="font-display font-bold uppercase text-[14px] tracking-[-0.005em] text-paper leading-tight">
              {lesson.title}
            </div>
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">
              · {lesson.origin}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[10px] tracking-[.14em] uppercase text-on-dark">
              {isIntro ? "INTRO" : isReward ? "DONE" : `STEP ${stepIdx + 1} / ${total}`}
            </div>
            <button
              onClick={onExit}
              className="font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 hover:text-redline transition-colors"
              aria-label="Exit lesson"
            >
              exit ×
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        {isIntro ? (
          <div>
            <p className="font-serif italic text-[15px] text-paper leading-snug max-w-[760px]">
              {lesson.intro}
            </p>
            <button
              onClick={onAdvance}
              className="mt-3 font-display font-semibold text-[13px] tracking-[.04em] uppercase px-4 py-2 border-2 border-lamp bg-lamp text-ink hover:bg-paper hover:border-paper transition-colors"
            >
              start →
            </button>
          </div>
        ) : isReward ? (
          <div>
            <div className="font-mono text-[10px] tracking-[.16em] uppercase text-lamp mb-1">
              ✓ COMPLETE
            </div>
            <p className="font-serif italic text-[15px] text-paper leading-snug max-w-[760px]">
              {lesson.reward}
            </p>
            <button
              onClick={onExit}
              className="mt-3 font-display font-semibold text-[13px] tracking-[.04em] uppercase px-4 py-2 border-2 border-paper text-paper hover:bg-paper hover:text-ink transition-colors"
            >
              keep playing →
            </button>
          </div>
        ) : step ? (
          <div>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <div className="font-display font-bold uppercase text-[18px] tracking-[-0.005em] text-paper leading-tight">
                {step.title}
              </div>
            </div>
            <p className="font-serif italic text-[14px] text-paper-2 leading-snug max-w-[760px]">
              {step.body}
            </p>
            {showHint && step.hint && (
              <p className="font-mono text-[11px] tracking-[.06em] text-lamp mt-2 max-w-[760px] leading-snug">
                ↳ {step.hint}
              </p>
            )}
            {/* progress ticks */}
            <div className="flex gap-1 mt-3 items-center">
              {lesson.steps.map((_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 max-w-[40px] transition-colors"
                  style={{
                    background:
                      i < stepIdx ? "#F2B705" : i === stepIdx ? "#F2B70588" : "#3A362E",
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
