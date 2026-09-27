import {
  ArrowPathIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  TableCellsIcon,
  ReceiptRefundIcon,
  GlobeEuropeAfricaIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import { useSceneFrame, useSceneConfig } from "../timing";
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { LogoMark } from "../ui/logo";
import { bouncy, c, clamp, euros, font, pop, prog } from "../theme";
import { LINES, TOTAL_TTC } from "../ui/document";
import { ChainBar } from "./chain-layout";

const useFade = () => {
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
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
// Scattered tools, then everything gathers into the logo
const CHAOS = [
  { icon: TableCellsIcon, label: "devis_2026_v3_final.xlsx", x: -560, y: -250, r: -6 },
  { icon: DocumentTextIcon, label: "Factures : un autre logiciel", x: 330, y: -300, r: 5 },
  { icon: CubeIcon, label: "Stock : suivi de tête", x: -620, y: 170, r: 4 },
  { icon: EnvelopeIcon, label: "Relance client oubliée", x: 360, y: 230, r: -4 },
  { icon: ArrowPathIcon, label: "Abonnements refacturés à la main", x: -170, y: 360, r: 2 },
];
const LOGO_AT = 74;

export const Intro: React.FC = () => {
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
  const gather = prog(frame, 58, 76);
  const m = bouncy(frame, fps, LOGO_AT);
  const t = pop(frame, fps, LOGO_AT + 18);
  const tag = pop(frame, fps, LOGO_AT + 34);
  return (
    <Page dark>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {CHAOS.map((it, i) => {
          const a = bouncy(frame, fps, 6 + i * 9);
          const I = it.icon;
          const wobble = Math.sin((frame + i * 20) / 14) * 6;
          return (
            <div
              key={it.label}
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "white",
                color: c.ink,
                borderRadius: 14,
                padding: "16px 22px",
                fontSize: 30,
                fontWeight: 600,
                boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                opacity: Math.min(1, a) * (1 - gather),
                transform: `translate(${it.x * (1 - gather)}px, ${(it.y + wobble) * (1 - gather)}px) rotate(${it.r * (1 - gather)}deg) scale(${a * (1 - 0.7 * gather)})`,
              }}
            >
              <I style={{ width: 30, color: i === 3 ? c.red : c.s600 }} />
              {it.label}
            </div>
          );
        })}
        {frame >= LOGO_AT - 2 && (
          <>
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
          </>
        )}
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
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
  const title = pop(frame, fps, 0);
  const center = bouncy(frame, fps, 20);
  // Left: the operations the quote organises. Right: the finance it generates.
  const ins = [
    { icon: UsersIcon, label: "Clients", sub: "fiche client et contacts", color: c.ink },
    { icon: CubeIcon, label: "Produits", sub: "réservés ou livrés du stock", color: c.ink },
    { icon: WrenchScrewdriverIcon, label: "Interventions", sub: "planifiées et suivies", color: c.ink },
    { icon: ShoppingCartIcon, label: "Achats", sub: "commandes fournisseurs", color: c.ink },
  ];
  const outs = [
    { icon: DocumentCheckIcon, label: "Factures", sub: "totales ou partielles", color: c.ink },
    { icon: ReceiptRefundIcon, label: "Avoirs", sub: "remboursements", color: c.ink },
    { icon: ArrowPathIcon, label: "Abonnements", sub: "factures récurrentes", color: c.blue },
    { icon: BanknotesIcon, label: "Paiements", sub: "encaissements suivis", color: c.green },
  ];
  const CX = 960,
    CY = 610;
  const inY = (i: number) => 300 + i * 132;
  const outY = (i: number) => 300 + i * 132;
  const flow = frame * 1.2;
  return (
    <Page>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 20}px)` }}>
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1.5 }}>Tout part du devis.</div>
        <div style={{ fontSize: 32, color: c.s500, marginTop: 12 }}>
          Il organise vos opérations et génère toute la partie financière.
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {ins.map((_, i) => (
          <Wire key={i} from={[CX - 190, CY]} to={[440, inY(i) + 48]} p={prog(frame, 50 + i * 12, 80 + i * 12)} flow={flow} />
        ))}
        {outs.map((_, i) => (
          <Wire key={i} from={[CX + 190, CY]} to={[1480, outY(i) + 48]} p={prog(frame, 130 + i * 14, 160 + i * 14)} flow={flow} />
        ))}
      </svg>
      {[
        { x: 80, label: "Opérations", at: 36 },
        { x: 1480, label: "Finances", at: 140 },
      ].map((h) => (
        <div
          key={h.label}
          style={{
            position: "absolute",
            left: h.x,
            top: 246,
            width: 360,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: c.s400,
            opacity: pop(frame, fps, h.at),
          }}
        >
          {h.label}
        </div>
      ))}
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
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
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
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>Et voilà, c'est aussi simple que ça !</div>
          <div style={{ fontSize: 32, color: c.s500, marginTop: 14 }}>
            Un seul document, du premier contact au paiement : aucune ressaisie, aucun oubli de facturation.
          </div>
        </div>
      </AbsoluteFill>
    </Page>
  );
};

/* Features ---------------------------------------------------------- */
export const Features: React.FC = () => {
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
  const items = [
    { icon: DocumentCheckIcon, t: "Devis & factures", s: "Du devis au paiement, sans ressaisie" },
    { icon: ArrowPathIcon, t: "Abonnements", s: "Facturation récurrente automatique" },
    { icon: UsersIcon, t: "Contacts & CRM", s: "Clients, fournisseurs, pipeline" },
    { icon: CubeIcon, t: "Stock", s: "Numéros de série, emplacements" },
    { icon: WrenchScrewdriverIcon, t: "Service", s: "Interventions et temps passé" },
    { icon: ChartBarIcon, t: "Comptabilité", s: "Opérations, tableaux de bord" },
    { icon: GlobeEuropeAfricaIcon, t: "Facture électronique", s: "Envoi et réception Peppol / PPF" },
    { icon: CodeBracketIcon, t: "API & webhooks", s: "Connectez vos outils" },
  ];
  const title = pop(frame, fps, 0);
  return (
    <Page>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", opacity: title }}>
        <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: -1 }}>Un ERP complet pour votre entreprise.</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 28,
        }}
      >
        {items.map((it, i) => {
          const a = pop(frame, fps, 14 + i * 6);
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
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 22 }}>{it.t}</div>
              <div style={{ fontSize: 22, color: c.s500, marginTop: 6 }}>{it.s}</div>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

/* Outro ------------------------------------------------------------- */
export const Outro: React.FC = () => {
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
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

/* Section divider ---------------------------------------------------- */
export const HowItWorks: React.FC = () => {
  const frame = useSceneFrame();
  const { fps } = useSceneConfig();
  const t = pop(frame, fps, 4);
  const u = pop(frame, fps, 16);
  return (
    <Page dark>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <LogoMark size={70} color="white" />
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 30, letterSpacing: -2, opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
          Comment ça marche&nbsp;?
        </div>
        <div style={{ height: 4, width: 220 * u, background: "white", marginTop: 30, borderRadius: 2 }} />
      </AbsoluteFill>
    </Page>
  );
};
