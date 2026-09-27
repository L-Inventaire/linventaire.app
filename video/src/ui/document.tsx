// Rebuild of the quote / invoice page (invoices-details.tsx + invoice-lines-input)
import { ArrowPathIcon, CheckCircleIcon, CubeIcon, TruckIcon } from "@heroicons/react/16/solid";
import { BriefcaseIcon, BuildingStorefrontIcon, CubeIcon as CubeSolid, EnvelopeIcon, UserIcon } from "@heroicons/react/24/solid";
import React from "react";
import { c, euros } from "../theme";
import { Banner, StatusTag, TagColor } from "./app";

export type Line = {
  kind: "product" | "service";
  name: string;
  desc?: string;
  qty: number;
  unit: string;
  price: number;
  monthly?: boolean;
};

export const LINES: Line[] = [
  { kind: "product", name: 'Caisse tactile 15"', desc: "Terminal de caisse tactile avec imprimante tickets", qty: 2, unit: "unité", price: 890 },
  { kind: "product", name: "Tiroir-caisse", desc: "Tiroir métallique 5 billets / 8 pièces", qty: 2, unit: "unité", price: 120 },
  { kind: "service", name: "Installation et formation", desc: "Installation sur site et formation de l'équipe", qty: 6, unit: "h", price: 65 },
  { kind: "service", name: "Maintenance & support", desc: "Support illimité et mises à jour", qty: 1, unit: "mois", price: 49, monthly: true },
];

export const TOTAL_HT = LINES.reduce((s, l) => s + l.qty * l.price, 0); // 2459
export const TOTAL_TTC = TOTAL_HT * 1.2; // 2950.80

const pctColor = (p: number) => (p >= 1 ? c.green : c.red);

export const ProgressTag: React.FC<{
  icon: React.FC<React.ComponentProps<"svg">>;
  value?: number;
  label?: string;
  color?: string;
}> = ({ icon: I, value = 0, label, color }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      border: `1px solid ${c.s100}`,
      borderRadius: 4,
      padding: "1px 6px",
      fontSize: 12.5,
      color: c.s700,
      background: "white",
    }}
  >
    <I style={{ width: 13, color: color || pctColor(value) }} />
    {label ?? Math.round(value * 100) + "%"}
  </span>
);

export type LineState = { appear: number; reserved?: number; delivered?: number; executed?: number };

const LineCard: React.FC<{ line: Line; st: LineState; showProgress: boolean }> = ({ line, st, showProgress }) => {
  const Icon = line.kind === "product" ? CubeSolid : BriefcaseIcon;
  return (
    <div
      style={{
        border: `1px solid ${c.s100}`,
        borderRadius: 8,
        marginBottom: 10,
        opacity: st.appear,
        transform: `translateY(${(1 - st.appear) * 16}px)`,
        maxHeight: 120 * st.appear,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", fontSize: 14 }}>
        <div style={{ flex: 1, padding: "10px 12px", display: "flex", gap: 10 }}>
          <Icon style={{ width: 16, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>{line.name}</div>
            <div style={{ color: c.s500 }}>{line.desc || "-"}</div>
          </div>
        </div>
        <div style={{ width: 130, borderLeft: `1px solid ${c.s100}`, padding: "10px 12px", textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>
            {line.qty} {line.unit}
          </div>
          {line.monthly ? (
            <span style={{ fontSize: 11.5, background: c.blueBg, color: c.blueText, padding: "0 5px", borderRadius: 3 }}>
              Mensuel
            </span>
          ) : (
            <div style={{ color: c.s500 }}>-</div>
          )}
        </div>
        <div style={{ width: 130, borderLeft: `1px solid ${c.s100}`, padding: "10px 12px", textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{euros(line.price)}</div>
          <div style={{ color: c.s500 }}>TVA 20%</div>
        </div>
        <div style={{ width: 170, borderLeft: `1px solid ${c.s100}`, padding: "10px 12px", textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{euros(line.price * line.qty)}</div>
          <div style={{ color: c.s500, fontSize: 13, whiteSpace: "nowrap" }}>Coût non renseigné</div>
        </div>
      </div>
      {showProgress && (
        <div style={{ borderTop: `1px solid ${c.s100}`, padding: "7px 12px", display: "flex", gap: 6 }}>
          {line.kind === "product" ? (
            <>
              <ProgressTag icon={CubeIcon} value={st.reserved} />
              <ProgressTag icon={TruckIcon} value={st.delivered} />
            </>
          ) : (
            <ProgressTag icon={CheckCircleIcon} value={st.executed} />
          )}
          {line.monthly && <ProgressTag icon={ArrowPathIcon} label="Mensuel" color={c.blue} />}
        </div>
      )}
    </div>
  );
};

export const DocView: React.FC<{
  kind: "Devis" | "Facture";
  reference: string;
  status: { label: string; color: TagColor; scale?: number };
  banner?: { color: TagColor; content: React.ReactNode } | null;
  subtitle?: React.ReactNode;
  lineStates: LineState[];
  showProgress?: boolean;
  totalsAppear?: number;
  totalHT?: number;
  payTag?: React.ReactNode;
  after?: React.ReactNode;
  scroll?: number;
}> = ({
  kind,
  reference,
  status,
  banner,
  subtitle,
  lineStates,
  showProgress = true,
  totalsAppear = 1,
  totalHT,
  payTag,
  after,
  scroll = 0,
}) => {
  const ht = totalHT ?? LINES.reduce((s, l, i) => s + l.qty * l.price * Math.min(1, lineStates[i]?.appear ?? 0), 0);
  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
      <div style={{ width: 800, margin: "0 auto", paddingTop: 28, transform: `translateY(${-scroll}px)` }}>
        {banner && <div style={{ marginBottom: 16 }}><Banner color={banner.color}>{banner.content}</Banner></div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <StatusTag label={status.label} color={status.color} scale={status.scale} />
          {payTag}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 21, fontWeight: 800 }}>
            {kind} {reference}
          </span>
          <span style={{ fontSize: 13.5, color: c.s600 }}>Émis le 27/09/2026</span>
          {subtitle}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>Équipement caisse boutique</div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {[
            { lbl: "Client", val: "Boulangerie Martin", I: UserIcon, V: BuildingStorefrontIcon },
            { lbl: "Contact (optionnel)", val: "Sophie Martin", I: EnvelopeIcon, V: UserIcon },
          ].map(({ lbl, val, I, V }) => (
            <div
              key={lbl}
              style={{
                flex: 1,
                border: `1px solid ${c.s200}`,
                borderRadius: 5,
                padding: "8px 12px",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <I style={{ width: 16 }} />
              <div>
                <div style={{ fontSize: 12.5, color: c.s400 }}>{lbl}</div>
                <div style={{ fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  <V style={{ width: 13 }} /> {val}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 26, marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800 }}>Contenu</span>
          <span style={{ fontSize: 13, background: c.s50, borderRadius: 4, padding: "0 6px" }}>
            {lineStates.filter((s) => s.appear > 0.5).length}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            border: `1px solid ${c.s100}`,
            borderRadius: 5,
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1, padding: "4px 12px" }}>Article</div>
          <div style={{ width: 130, padding: "4px 12px", textAlign: "right", borderLeft: `1px solid ${c.s100}` }}>Quantité</div>
          <div style={{ width: 130, padding: "4px 12px", textAlign: "right", borderLeft: `1px solid ${c.s100}` }}>Prix U.</div>
          <div style={{ width: 170, padding: "4px 12px", textAlign: "right", borderLeft: `1px solid ${c.s100}` }}>Résumé HT</div>
        </div>
        {LINES.map((l, i) => (
          <LineCard key={i} line={l} st={lineStates[i] || { appear: 0 }} showProgress={showProgress} />
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", opacity: totalsAppear }}>
          <div style={{ width: 270, border: `1px solid ${c.s100}`, borderRadius: 5, padding: "8px 10px", fontSize: 14, marginTop: 6 }}>
            {[
              ["Total HT", euros(ht)],
              ["TVA", euros(ht * 0.2)],
              ["Total TTC", euros(ht * 1.2)],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: i === 2 ? 800 : 400 }}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {after}
      </div>
    </div>
  );
};
