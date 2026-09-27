// Rebuild of the main dashboard (frontend/src/views/client/modules/dashboard)
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  ClockIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  DocumentIcon,
  PaperAirplaneIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/solid";
import { useSceneFrame } from "../timing";
import React from "react";

import { AppShell } from "../ui/app";
import { c, prog } from "../theme";
import { Checklist, StepLayout } from "./chain-layout";

// Demo figures (k€), January → September
const GAINS = [14.2, 16.8, 18.1, 21.4, 19.7, 23.9, 22.5, 17.8, 29.9];
const CHARGES = [9.8, 10.4, 11.2, 12.9, 12.1, 13.8, 14.2, 11.0, 17.4];
const RESULT = GAINS.map((g, i) => +(g - CHARGES[i]).toFixed(1));
const RESULT_LAST_YEAR = [2.1, 3.4, 4.0, 5.2, 4.1, 6.3, 5.0, 3.9, 7.8, 8.4, 6.9, 9.2];
const MONTHS = "JFMAMJJASOND".split("");

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const kEuros = (k: number) => Math.round(k * 1000).toLocaleString("fr-FR").replace(/[   ]/g, " ") + ",00 €";

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: c.s25, borderRadius: 8, padding: "14px 16px", ...style }}>{children}</div>
);

// Smooth line chart with area gradient and point labels, drawn progressively
const LineChart: React.FC<{
  series: { values: number[]; color: string; id: string }[];
  draw: number;
  width: number;
  height: number;
}> = ({ series, draw, width, height }) => {
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.15;
  const px = (i: number) => 16 + (i * (width - 32)) / 11;
  const py = (v: number) => 18 + (height - 44) * (1 - v / max);
  const path = (vals: number[]) =>
    vals
      .map((v, i) => {
        if (i === 0) return `M ${px(0)} ${py(v)}`;
        const x0 = px(i - 1),
          x1 = px(i);
        const mx = (x0 + x1) / 2;
        return `C ${mx} ${py(vals[i - 1])}, ${mx} ${py(v)}, ${x1} ${py(v)}`;
      })
      .join(" ");
  const visibleX = 16 + draw * (width - 32);
  return (
    <svg width={width} height={height}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={"g-" + s.id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
        <clipPath id={"clip-" + series[0].id}>
          <rect x={0} y={0} width={visibleX + 6} height={height} />
        </clipPath>
      </defs>
      {MONTHS.map((m, i) => (
        <g key={i}>
          <line x1={px(i)} x2={px(i)} y1={10} y2={height - 22} stroke={c.s100} />
          <text x={px(i)} y={height - 6} fontSize={11} textAnchor="middle" fill={c.s600}>
            {m}
          </text>
        </g>
      ))}
      <g clipPath={`url(#clip-${series[0].id})`}>
        {series.map((s) => (
          <g key={s.id}>
            <path
              d={`${path(s.values)} L ${px(s.values.length - 1)} ${height - 22} L ${px(0)} ${height - 22} Z`}
              fill={`url(#g-${s.id})`}
            />
            <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} />
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={px(i)} cy={py(v)} r={4} fill={s.color} />
                <text x={px(i)} y={py(v) - 9} fontSize={10} textAnchor="middle" fill={c.ink} fontWeight={600}>
                  {Math.round(v)}k€
                </text>
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
};

const NumberCard: React.FC<{
  title: string;
  icon: React.FC<React.ComponentProps<"svg">>;
  value: number;
  total?: number;
  t: number;
}> = ({ title, icon: I, value, total, t }) => (
  <Card style={{ height: 118, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
      {title}
      <I style={{ width: 16 }} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#2563eb" }}>{Math.round(value * t)}</div>
      {total && <div style={{ fontSize: 13, color: c.s500 }}>sur {total}</div>}
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const frame = useSceneFrame();
  const t = prog(frame, 20, 70);
  const draw1 = prog(frame, 40, 110);
  const draw2 = prog(frame, 70, 140);
  const kpis = [
    { label: "Chiffre d'affaires", k: sum(GAINS), color: "#16a34a" },
    { label: "Charges", k: sum(CHARGES), color: "#dc2626" },
    { label: "Résultat", k: sum(RESULT), color: "#2563eb" },
  ];
  return (
    <StepLayout
      kicker="Au quotidien"
      title="Pilotez toute votre entreprise"
      text={
        <>
          Chiffre d'affaires, charges, résultat, devis signés, factures en retard&nbsp;: votre{" "}
          <b>tableau de bord</b> est à jour en temps réel.
        </>
      }
      extra={
        <Checklist
          items={[
            { at: 60, label: "Ventes et achats" },
            { at: 110, label: "Trésorerie et résultat" },
            { at: 170, label: "Relances à faire" },
          ]}
        />
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 25, z: 1, x: 640, y: 400 },
        { f: 60, z: 1.4, x: 560, y: 230 },
        { f: 100, z: 1.4, x: 560, y: 420 },
        { f: 150, z: 1.4, x: 1050, y: 330 },
        { f: 200, z: 1.4, x: 1050, y: 330 },
        { f: 240, z: 1, x: 640, y: 400 },
      ]}
    >
      <AppShell active="home" crumbs={["L'inventaire", "Tableau de bord"]} badges={{ quotes: 3, invoices: 5 }}>
        <div style={{ padding: "18px 20px", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>Tableau de bord</span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${c.s200}`,
                borderRadius: 5,
                padding: "5px 10px",
                fontSize: 14,
              }}
            >
              Exercice 2026 <ChevronDownIcon style={{ width: 14 }} />
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1.3, display: "flex", flexDirection: "column", gap: 8 }}>
              <Card style={{ display: "flex" }}>
                {kpis.map((k) => (
                  <div key={k.label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 16 }}>{k.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{kEuros(k.k * t)}</div>
                    <div style={{ fontSize: 12, color: c.s400 }}>{kEuros((k.k * 12 * t) / 9)} estimé à cloture</div>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize: 16 }}>Chiffre d'affaires et charges</div>
                <LineChart
                  width={520}
                  height={220}
                  draw={draw1}
                  series={[
                    { id: "gains", values: GAINS, color: "#16a34a" },
                    { id: "charges", values: CHARGES, color: "#dc2626" },
                  ]}
                />
              </Card>
              <Card>
                <div style={{ fontSize: 16 }}>Résultat 2026 / 2025</div>
                <LineChart
                  width={520}
                  height={200}
                  draw={draw2}
                  series={[
                    { id: "last", values: RESULT_LAST_YEAR, color: "#cccccc" },
                    { id: "result", values: RESULT, color: "#2563eb" },
                  ]}
                />
              </Card>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
              <NumberCard title="Devis signés" icon={DocumentIcon} value={38} total={52} t={prog(frame, 120, 160)} />
              <NumberCard title="Devis envoyés" icon={PaperAirplaneIcon} value={14} t={prog(frame, 125, 165)} />
              <NumberCard title="Factures payées" icon={DocumentCheckIcon} value={126} total={131} t={prog(frame, 130, 170)} />
              <NumberCard title="Factures en retard" icon={ClockIcon} value={5} t={prog(frame, 135, 175)} />
              <NumberCard title="Commandes en attente" icon={ShoppingCartIcon} value={3} t={prog(frame, 140, 180)} />
              <NumberCard title="Commandes à payer" icon={DocumentArrowDownIcon} value={2} t={prog(frame, 145, 185)} />
            </div>
          </div>
        </div>
      </AppShell>
    </StepLayout>
  );
};
