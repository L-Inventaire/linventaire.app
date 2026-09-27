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
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
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
    <div style={{ position: "relative", width: W, height: 120, transform: `scale(${scale})`, transformOrigin: "top center" }}>
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
      {subscriptionOn !== undefined && (
        <div
          style={{
            position: "absolute",
            left: 4 * gap + 42,
            top: -2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 16,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
            background: subscriptionOn ? c.blueBg : "white",
            color: subscriptionOn ? c.blueText : c.s400,
            border: `2px solid ${subscriptionOn ? c.blue : c.s100}`,
          }}
        >
          <ArrowPathIcon style={{ width: 16 }} /> Abonnement
        </div>
      )}
    </div>
  );
};

export type Camera = { f: number; z: number; x: number; y: number }[];

export const StepLayout: React.FC<{
  step: number;
  num: number;
  subscriptionOn?: boolean;
  title: string;
  text: React.ReactNode;
  camera?: Camera;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ step, num, subscriptionOn = false, title, text, camera, extra, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], clamp);
  const t1 = pop(frame, fps, 4);
  const t2 = pop(frame, fps, 12);

  // Camera: zoom on a point of the app (in app coordinates)
  let z = 1,
    cx = APP_W / 2,
    cy = APP_H / 2;
  if (camera && camera.length) {
    const fs = camera.map((k) => k.f);
    const o = { ...clamp };
    z = camera.length > 1 ? interpolate(frame, fs, camera.map((k) => k.z), o) : camera[0].z;
    cx = camera.length > 1 ? interpolate(frame, fs, camera.map((k) => k.x), o) : camera[0].x;
    cy = camera.length > 1 ? interpolate(frame, fs, camera.map((k) => k.y), o) : camera[0].y;
  }
  const VIEW_W = 1240,
    VIEW_H = 775;
  const base = VIEW_W / APP_W;
  const s = base * z;
  // keep the focus point centered, but never show outside the app
  let tx = VIEW_W / 2 - cx * s;
  let ty = VIEW_H / 2 - cy * s;
  tx = Math.min(0, Math.max(VIEW_W - APP_W * s, tx));
  ty = Math.min(0, Math.max(VIEW_H - APP_H * s, ty));

  return (
    <AbsoluteFill style={{ background: c.s25, fontFamily: font, color: c.ink }}>
      <div style={{ position: "absolute", top: 44, left: 210, opacity: fade }}>
        <ChainBar current={step} subscriptionOn={subscriptionOn} />
      </div>
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
          Étape {num}
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
          top: 232,
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
