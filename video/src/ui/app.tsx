// Faithful rebuild of the linventaire.app shell (frontend/src/views/client/_layout)
import {
  ArrowPathIcon,
  BriefcaseIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  HomeIcon,
  InboxIcon,
  ReceiptRefundIcon,
  ShoppingCartIcon,
  UsersIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/solid";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  PrinterIcon,
  Squares2X2Icon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { AtSymbolIcon, ListBulletIcon } from "@heroicons/react/16/solid";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import React from "react";
import { c, font } from "../theme";

type Icon = React.FC<React.ComponentProps<"svg">>;

export type MenuKey =
  | "home"
  | "quotes"
  | "subscriptions"
  | "invoices"
  | "credit_notes"
  | "supplier_quotes"
  | "stock"
  | "service";

const Item: React.FC<{
  icon: Icon;
  label: string;
  active?: boolean;
  badge?: number;
  glow?: number;
}> = ({ icon: I, label, active, badge, glow = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 32,
      padding: "0 8px",
      borderRadius: 5,
      fontSize: 14,
      color: c.ink,
      background: active ? c.s100 : `rgba(35,31,35,${glow * 0.08})`,
    }}
  >
    <I style={{ width: 16, height: 16, color: c.ink }} />
    <span style={{ flex: 1 }}>{label}</span>
    {!!badge && (
      <span
        style={{
          fontSize: 11,
          border: `1px solid ${c.red}`,
          color: c.red,
          borderRadius: 4,
          padding: "0 5px",
        }}
      >
        {badge}
      </span>
    )}
  </div>
);

const Section: React.FC<{ label: string; plus?: boolean; children: React.ReactNode }> = ({
  label,
  plus,
  children,
}) => (
  <div style={{ marginTop: 22 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        color: c.s400,
        padding: "0 8px 6px",
      }}
    >
      {label}
      {plus && <PlusIcon style={{ width: 16, height: 16, color: c.s500 }} />}
    </div>
    {children}
  </div>
);

export const Sidebar: React.FC<{ active: MenuKey; badges?: Partial<Record<MenuKey, number>> }> = ({
  active,
  badges = {},
}) => (
  <div style={{ width: 232, padding: "0 10px", flexShrink: 0 }}>
    <div style={{ height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 6px" }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: c.purple,
          color: "white",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        AD
      </div>
      <b style={{ fontSize: 15 }}>Atelier Durand</b>
      <ChevronUpDownIcon style={{ width: 16, height: 16 }} />
    </div>
    <Item icon={HomeIcon} label="Tableau de bord" active={active === "home"} />
    <Item icon={InboxIcon} label="Notifications" />
    <Section label="Ventes" plus>
      <Item icon={DocumentIcon} label="Devis" active={active === "quotes"} badge={badges.quotes} />
      <Item icon={ArrowPathIcon} label="Abonnements" active={active === "subscriptions"} badge={badges.subscriptions} />
      <Item icon={DocumentCheckIcon} label="Factures" active={active === "invoices"} badge={badges.invoices} />
      <Item icon={ReceiptRefundIcon} label="Avoirs" active={active === "credit_notes"} />
    </Section>
    <Section label="Achats" plus>
      <Item icon={ShoppingCartIcon} label="Commandes" active={active === "supplier_quotes"} badge={badges.supplier_quotes} />
      <Item icon={DocumentArrowDownIcon} label="Factures d'achat" />
    </Section>
    <Section label="Activité">
      <Item icon={BriefcaseIcon} label="Service" active={active === "service"} />
      <Item icon={ViewColumnsIcon} label="Stock" active={active === "stock"} />
      <Item icon={CubeIcon} label="Articles" />
      <Item icon={UsersIcon} label="Contacts" />
      <Item icon={AtSymbolIcon} label="CRM" />
    </Section>
    <Section label="Comptabilité">
      <Item icon={ListBulletIcon} label="Opérations" />
      <Item icon={ChartBarIcon} label="Tableaux" />
    </Section>
    <Section label="Entreprise">
      <Item icon={UsersIcon} label="Utilisateurs" />
      <Item icon={Cog6ToothIcon} label="Paramètres" />
    </Section>
  </div>
);

export const Btn: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  icon?: Icon;
  pressed?: number;
  style?: React.CSSProperties;
}> = ({ children, variant = "primary", icon: I, pressed = 0, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 36,
      padding: "0 16px",
      borderRadius: 5,
      fontSize: 15,
      fontWeight: 500,
      whiteSpace: "nowrap",
      transform: `scale(${1 - pressed * 0.06})`,
      ...(variant === "primary"
        ? { background: c.accent, color: "white" }
        : variant === "outline"
          ? { background: "white", color: c.s600, border: `1px solid ${c.s200}` }
          : { color: c.s600 }),
      ...style,
    }}
  >
    {I && <I style={{ width: 16, height: 16 }} />}
    {children}
  </div>
);

export type TagColor = "gray" | "blue" | "orange" | "green" | "red";
const dot: Record<TagColor, string> = {
  gray: c.s500,
  blue: c.blue,
  orange: c.orange,
  green: c.green,
  red: c.red,
};

export const StatusTag: React.FC<{ label: string; color: TagColor; scale?: number }> = ({
  label,
  color,
  scale = 1,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      border: `1px solid ${c.s200}`,
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 14,
      background: "white",
      transform: `scale(${scale})`,
      transformOrigin: "left center",
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: 5, background: dot[color] }} />
    {label}
  </div>
);

const bannerColors: Record<TagColor, [string, string]> = {
  gray: [c.s50, c.s700],
  blue: [c.blueBg, c.blueText],
  orange: [c.orangeBg, c.orangeText],
  green: [c.greenBg, c.greenText],
  red: [c.redBg, c.redText],
};

export const Banner: React.FC<{ color: TagColor; children: React.ReactNode }> = ({
  color,
  children,
}) => (
  <div
    style={{
      background: bannerColors[color][0],
      color: bannerColors[color][1],
      borderRadius: 8,
      padding: "14px 16px",
      fontSize: 14,
    }}
  >
    {children}
  </div>
);

export const Topbar: React.FC<{ crumbs: string[] }> = ({ crumbs }) => (
  <div style={{ height: 48, display: "flex", alignItems: "center", fontSize: 14 }}>
    <div style={{ width: 400, color: c.s500 }}>
      {crumbs.map((cr, i) => (
        <span key={i}>
          {i > 0 && " / "}
          <span style={i === crumbs.length - 1 ? { color: c.ink, fontWeight: 700 } : {}}>{cr}</span>
        </span>
      ))}
    </div>
    <div
      style={{
        width: 360,
        height: 28,
        background: "white",
        border: `1px solid ${c.s100}`,
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 10px",
        color: c.s400,
      }}
    >
      <Squares2X2Icon style={{ width: 15 }} /> Aller à...
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", gap: 20, paddingRight: 16, color: c.s600 }}>
      <GlobeAltIcon style={{ width: 18 }} />
      <BookOpenIcon style={{ width: 18 }} />
      <SunIcon style={{ width: 18 }} />
    </div>
  </div>
);

// Top bar of a document page (document-bar/)
export const DocBar: React.FC<{ right?: React.ReactNode; iconsOnly?: boolean }> = ({ right }) => (
  <div
    style={{
      height: 50,
      borderBottom: `1px solid ${c.s100}`,
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      gap: 18,
      color: c.s600,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        border: `1px solid ${c.s200}`,
        borderRadius: 5,
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ArrowLeftIcon style={{ width: 14 }} />
    </div>
    <div style={{ flex: 1 }} />
    <DocumentDuplicateIcon style={{ width: 18 }} />
    <LinkIcon style={{ width: 18 }} />
    <PrinterIcon style={{ width: 18 }} />
    <PencilSquareIcon style={{ width: 18 }} />
    <EllipsisHorizontalIcon style={{ width: 18 }} />
    {right}
  </div>
);

export const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      height: 60,
      borderTop: `1px solid ${c.s100}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
      padding: "0 14px",
      background: "white",
      flexShrink: 0,
    }}
  >
    <EllipsisHorizontalIcon style={{ width: 20, color: c.s600 }} />
    {children}
  </div>
);

export const APP_W = 1280;
export const APP_H = 800;

// The whole app window: sidebar + topbar + white page card
export const AppShell: React.FC<{
  active: MenuKey;
  crumbs: string[];
  badges?: Partial<Record<MenuKey, number>>;
  children: React.ReactNode;
}> = ({ active, crumbs, badges, children }) => (
  <div
    style={{
      width: APP_W,
      height: APP_H,
      background: c.bgApp,
      display: "flex",
      fontFamily: font,
      color: c.ink,
      overflow: "hidden",
      position: "relative",
    }}
  >
    <Sidebar active={active} badges={badges} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingRight: 8, minWidth: 0 }}>
      <Topbar crumbs={crumbs} />
      <div
        style={{
          flex: 1,
          background: "white",
          border: `1px solid ${c.s100}`,
          borderRadius: 8,
          marginBottom: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

// Modal dialog with dimmed backdrop, positioned over the page card
export const Modal: React.FC<{
  title: string;
  width?: number;
  appear: number;
  children: React.ReactNode;
}> = ({ title, width = 420, appear, children }) =>
  appear <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `rgba(0,0,0,${0.25 * appear})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width,
          background: "white",
          borderRadius: 10,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 20}px) scale(${0.96 + appear * 0.04})`,
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{title}</div>
        {children}
      </div>
    </div>
  );
