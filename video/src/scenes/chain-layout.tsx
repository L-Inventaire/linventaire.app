// Layout shared by every step of the quote life: the chain diagram on top,
// the explanation on the left, the app window on the right.
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { APP_H, APP_W } from "../ui/app";
import { c, clamp, font, pop } from "../theme";

export const STEPS = [
  { label: "Devis", icon: DocumentTextIcon },
  { label: "Envoi", icon: PaperAirplaneIcon },
  { label: "Signature", icon: PencilSquareIcon },
  { label: "Réalisation", icon: TruckIcon },
  { label: "Facturation", icon: DocumentCheckIcon },
  { label: "Paiement", icon: BanknotesIcon },
];

// Step index in the chain bar; 4.5 = subscription loop under "Facturation"
export const ChainBar: React.FC<{ current: number; done?: number; scale?: number; subscriptionOn?: boolean }> = ({
  current,
  done = current,
  scale = 1,
  subscriptionOn,
}) => {
  const W = 1500;
  const gap = W / (STEPS.length - 1);
  return (
    <div style={{ position: "relative", width: W, height: 170, transform: `scale(${scale})`, transformOrigin: "top center" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 31, height: 3, background: c.s100 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 31,
          height: 3,
          width: Math.max(0, Math.min(done, STEPS.length - 1)) * gap,
          background: c.accent,
        }}
      />
      {STEPS.map((s, i) => {
        const isCur = Math.floor(current) === i;
        const isDone = i < done;
        const I = s.icon;
        return (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: i * gap - 60,
              width: 120,
              top: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: isCur || isDone ? c.accent : "white",
                border: `3px solid ${isCur || isDone ? c.accent : c.s200}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${isCur ? 1.15 : 1})`,
                boxShadow: isCur ? "0 0 0 8px rgba(35,31,35,0.12)" : "none",
              }}
            >
              {isDone && !isCur ? (
                <CheckIcon style={{ width: 28, color: "white" }} />
              ) : (
                <I style={{ width: 28, color: isCur ? "white" : c.s400 }} />
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 21,
                fontWeight: isCur ? 800 : 600,
                color: isCur || isDone ? c.ink : c.s400,
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
      {/* Subscription: billing and payment loop back every period */}
      <svg
        width={gap + 40}
        height={80}
        style={{ position: "absolute", left: 4 * gap - 20, top: 96, overflow: "visible" }}
      >
        <defs>
          <marker id="loopArrow" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
            <path d="M0,1 L12,6 L0,11 z" fill={subscriptionOn ? c.blue : c.s300} />
          </marker>
        </defs>
        <path
          d={`M ${gap + 20} 6 C ${gap + 20} 62, 20 62, 20 10`}
          fill="none"
          stroke={subscriptionOn ? c.blue : c.s200}
          strokeWidth={3}
          strokeDasharray={subscriptionOn ? "none" : "6 6"}
          markerEnd="url(#loopArrow)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 4 * gap,
          width: gap,
          top: 132,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 16,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            background: subscriptionOn ? c.blueBg : c.s25,
            color: subscriptionOn ? c.blueText : c.s400,
          }}
        >
          <ArrowPathIcon style={{ width: 16 }} /> Abonnement : chaque mois
        </div>
      </div>
    </div>
  );
};

export type Camera = { f: number; z: number; x: number; y: number }[];

export const StepLayout: React.FC<{
  step?: number;
  num?: number;
  kicker?: string;
  subscriptionOn?: boolean;
  title: string;
  text: React.ReactNode;
  camera?: Camera;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ step, num, kicker, subscriptionOn = false, title, text, camera, extra, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp);
  const t1 = pop(frame, fps, 4);
  const t2 = pop(frame, fps, 12);

  // Camera: each keyframe (zoom + focus point, app coordinates) is turned into
  // the visible rectangle, clamped inside the app. Rectangles are then eased
  // between keyframes: zoom and pan move together, never outside the app.
  const VIEW_W = 1240,
    VIEW_H = 775;
  const base = VIEW_W / APP_W;
  const keys = camera && camera.length ? camera : [{ f: 0, z: 1, x: APP_W / 2, y: APP_H / 2 }];
  const rects = keys.map((k) => {
    const w = VIEW_W / (base * k.z);
    const h = VIEW_H / (base * k.z);
    return {
      w,
      x: Math.min(APP_W - w, Math.max(0, k.x - w / 2)),
      y: Math.min(APP_H - h, Math.max(0, k.y - h / 2)),
    };
  });
  const ease = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };
  const fs = keys.map((k) => k.f);
  const at = (vals: number[]) => (keys.length > 1 ? interpolate(frame, fs, vals, ease) : vals[0]);
  const w = at(rects.map((r) => r.w));
  const s = VIEW_W / w;
  const tx = -at(rects.map((r) => r.x)) * s;
  const ty = -at(rects.map((r) => r.y)) * s;

  return (
    <AbsoluteFill style={{ background: c.s25, fontFamily: font, color: c.ink }}>
      {step !== undefined && (
        <div style={{ position: "absolute", top: 44, left: 210, opacity: fade }}>
          <ChainBar current={step} subscriptionOn={subscriptionOn} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 250,
          width: 470,
          opacity: fade,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: c.s400,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: t1,
          }}
        >
          {kicker ?? `Étape ${num}`}
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: 8,
            opacity: t1,
            transform: `translateY(${(1 - t1) * 20}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 27,
            lineHeight: 1.45,
            color: c.s600,
            marginTop: 26,
            opacity: t2,
            transform: `translateY(${(1 - t2) * 20}px)`,
          }}
        >
          {text}
        </div>
        {extra}
      </div>
      <div
        style={{
          position: "absolute",
          left: 600,
          top: step === undefined ? 152 : 232,
          width: VIEW_W,
          height: VIEW_H,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(17,17,15,0.18), 0 0 0 1px rgba(17,17,15,0.08)",
          opacity: fade,
          background: c.bgApp,
        }}
      >
        <div
          style={{
            width: APP_W,
            height: APP_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${s})`,
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Small floating label pointing at something in the app (app coordinates)
export const Callout: React.FC<{ x: number; y: number; appear: number; children: React.ReactNode }> = ({
  x,
  y,
  appear,
  children,
}) =>
  appear <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 50,
        background: c.accent,
        color: "white",
        fontSize: 15,
        fontWeight: 600,
        padding: "8px 12px",
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        opacity: appear,
        transform: `translateY(${(1 - appear) * 10}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );

// Items ticked one after the other under the step explanation
export const Checklist: React.FC<{ items: { at: number; label: string }[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((it) => {
        const a = pop(frame, fps, it.at);
        return (
          <div
            key={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 25,
              fontWeight: 600,
              opacity: a,
              transform: `translateX(${(1 - a) * -20}px)`,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: c.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${a})`,
              }}
            >
              <CheckIcon style={{ width: 20, color: "white" }} />
            </div>
            {it.label}
          </div>
        );
      })}
    </div>
  );
};
