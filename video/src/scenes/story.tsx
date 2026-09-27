import {
  ArrowPathIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentCheckIcon,
  GlobeEuropeAfricaIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark } from "../ui/logo";
import { bouncy, c, clamp, euros, font, pop, prog } from "../theme";
import { LINES, TOTAL_TTC } from "../ui/document";
import { ChainBar } from "./chain-layout";

const useFade = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], clamp);
};

const Page: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <AbsoluteFill
    style={{
      background: dark ? c.accent : c.s25,
      color: dark ? "white" : c.ink,
      fontFamily: font,
      opacity: useFade(),
    }}
  >
    {children}
  </AbsoluteFill>
);

/* Intro -------------------------------------------------------------- */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = bouncy(frame, fps, 0);
  const t = pop(frame, fps, 18);
  const tag = pop(frame, fps, 34);
  return (
    <Page dark>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Official wordmark (frontend/public/medias/logo-text.svg): the mark pops, then the name is revealed */}
        <div style={{ transform: `scale(${0.9 + 0.1 * m})` }}>
          <Img
            src={staticFile("logo-text.svg")}
            style={{ height: 220, display: "block", clipPath: `inset(0 ${(1 - t) * 76}% 0 0)`, opacity: Math.min(1, m * 1.5) }}
          />
        </div>
        <div style={{ fontSize: 42, color: c.s300, marginTop: 40, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
          Le co-pilote ERP de votre entreprise
        </div>
      </AbsoluteFill>
    </Page>
  );
};

/* Positioning: everything revolves around the quote ------------------- */
const Node: React.FC<{
  x: number;
  y: number;
  appear: number;
  icon: React.FC<React.ComponentProps<"svg">>;
  label: string;
  sub: string;
  color?: string;
}> = ({ x, y, appear, icon: I, label, sub, color = c.ink }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 360,
      height: 96,
      background: "white",
      borderRadius: 16,
      border: `1px solid ${c.s100}`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "0 22px",
      opacity: appear,
      transform: `scale(${0.9 + 0.1 * appear})`,
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: c.s50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <I style={{ width: 28, color }} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 19, color: c.s500 }}>{sub}</div>
    </div>
  </div>
);

// Animated connector between two points (dashes flow toward the target)
const Wire: React.FC<{ from: [number, number]; to: [number, number]; p: number; flow: number }> = ({ from, to, p, flow }) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  return (
    <>
      <path d={d} stroke={c.s200} strokeWidth={3} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      {p >= 1 && (
        <path d={d} stroke={c.accent} strokeWidth={3} fill="none" strokeDasharray="8 16" strokeDashoffset={-flow} />
      )}
    </>
  );
};

export const Positioning: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = pop(frame, fps, 0);
  const center = bouncy(frame, fps, 20);
  const ins = [
    { icon: CubeIcon, label: "Produits", sub: "vendus depuis le stock", color: c.ink },
    { icon: WrenchScrewdriverIcon, label: "Services", sub: "prestations, interventions", color: c.ink },
    { icon: ArrowPathIcon, label: "Abonnements", sub: "mensuels, annuels…", color: c.blue },
  ];
  const outs = [
    { icon: ShoppingCartIcon, label: "Stock & achats", sub: "approvisionnement", color: c.ink },
    { icon: BriefcaseIcon, label: "Interventions", sub: "planning et suivi", color: c.ink },
    { icon: DocumentCheckIcon, label: "Factures", sub: "totales, partielles, récurrentes", color: c.ink },
    { icon: BanknotesIcon, label: "Paiements", sub: "suivi de trésorerie", color: c.green },
  ];
  const CX = 960,
    CY = 610;
  const inY = (i: number) => 360 + i * 150;
  const outY = (i: number) => 300 + i * 132;
  const flow = frame * 1.2;
  return (
    <Page>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 20}px)` }}>
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1.5 }}>Tout part du devis.</div>
        <div style={{ fontSize: 32, color: c.s500, marginTop: 12 }}>
          On y dépose ce que l'on vend. Tout le reste s'enchaîne automatiquement.
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {ins.map((_, i) => (
          <Wire key={i} from={[440, inY(i) + 48]} to={[CX - 190, CY]} p={prog(frame, 50 + i * 12, 80 + i * 12)} flow={flow} />
        ))}
        {outs.map((_, i) => (
          <Wire key={i} from={[CX + 190, CY]} to={[1480, outY(i) + 48]} p={prog(frame, 130 + i * 14, 160 + i * 14)} flow={flow} />
        ))}
      </svg>
      {ins.map((n, i) => (
        <Node key={n.label} x={80} y={inY(i)} appear={pop(frame, fps, 40 + i * 12)} {...n} />
      ))}
      {outs.map((n, i) => (
        <Node key={n.label} x={1480} y={outY(i)} appear={pop(frame, fps, 150 + i * 14)} {...n} />
      ))}
      {/* the quote */}
      <div
        style={{
          position: "absolute",
          left: CX - 190,
          top: CY - 190,
          width: 380,
          height: 380,
          background: c.accent,
          color: "white",
          borderRadius: 28,
          padding: 30,
          boxShadow: "0 30px 80px rgba(17,17,15,0.3)",
          transform: `scale(${center})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoMark size={30} color="white" />
          <span style={{ fontSize: 18, color: c.s300 }}>Devis D-2026-1</span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 18 }}>Le devis</div>
        <div style={{ marginTop: 18 }}>
          {LINES.map((l, i) => {
            const a = pop(frame, fps, 70 + i * 12);
            return (
              <div
                key={l.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 17,
                  padding: "7px 0",
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                  opacity: a,
                }}
              >
                <span>{l.name}</span>
                <span style={{ color: c.s300 }}>{l.monthly ? "/ mois" : euros(l.qty * l.price)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, marginTop: 10, opacity: pop(frame, fps, 120) }}>
          <span>Total TTC</span>
          <span>{euros(TOTAL_TTC)}</span>
        </div>
      </div>
    </Page>
  );
};

/* Recap ------------------------------------------------------------- */
export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const done = interpolate(frame, [10, 90], [0, 6], clamp);
  const t = pop(frame, fps, 95);
  return (
    <Page>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 30, color: c.s500, marginBottom: 50, fontWeight: 600 }}>
          Devis D-2026-1 · Boulangerie Martin
        </div>
        <ChainBar current={done >= 6 ? -1 : done} done={done} subscriptionOn={done > 4.5} />
        <div style={{ marginTop: 70, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>Un seul document pilote tout.</div>
          <div style={{ fontSize: 32, color: c.s500, marginTop: 14 }}>
            Aucune ressaisie, aucun oubli de facturation, une vision claire de chaque affaire.
          </div>
        </div>
      </AbsoluteFill>
    </Page>
  );
};

/* Features ---------------------------------------------------------- */
export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { icon: UsersIcon, t: "Contacts & CRM", s: "Clients, fournisseurs, pipeline commercial" },
    { icon: CubeIcon, t: "Stock", s: "Numéros de série, emplacements, réceptions" },
    { icon: WrenchScrewdriverIcon, t: "Service", s: "Interventions et temps passé" },
    { icon: ChartBarIcon, t: "Comptabilité", s: "Opérations, tableaux de bord, exports" },
    { icon: GlobeEuropeAfricaIcon, t: "Facture électronique", s: "Envoi et réception via Peppol / PPF" },
    { icon: CodeBracketIcon, t: "API & webhooks", s: "Connectez vos outils" },
  ];
  const title = pop(frame, fps, 0);
  return (
    <Page>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", opacity: title }}>
        <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: -1 }}>Et autour du devis, tout votre ERP.</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 160,
          right: 160,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 36,
        }}
      >
        {items.map((it, i) => {
          const a = pop(frame, fps, 14 + i * 7);
          const I = it.icon;
          return (
            <div
              key={it.t}
              style={{
                background: "white",
                borderRadius: 18,
                border: `1px solid ${c.s100}`,
                padding: 34,
                opacity: a,
                transform: `translateY(${(1 - a) * 30}px)`,
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  background: c.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <I style={{ width: 32, color: "white" }} />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 22 }}>{it.t}</div>
              <div style={{ fontSize: 24, color: c.s500, marginTop: 6 }}>{it.s}</div>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

/* Outro ------------------------------------------------------------- */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = bouncy(frame, fps, 0);
  const t = pop(frame, fps, 14);
  return (
    <Page dark>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${m})` }}>
          <Img src={staticFile("logo-text.svg")} style={{ height: 150 }} />
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, marginTop: 50, opacity: t }}>Simplifiez votre gestion, du devis au paiement.</div>
        <div
          style={{
            marginTop: 40,
            fontSize: 34,
            fontWeight: 700,
            background: "white",
            color: c.accent,
            borderRadius: 12,
            padding: "16px 34px",
            opacity: pop(frame, fps, 28),
            transform: `scale(${0.9 + 0.1 * pop(frame, fps, 28)})`,
          }}
        >
          linventaire.app
        </div>
      </AbsoluteFill>
    </Page>
  );
};
