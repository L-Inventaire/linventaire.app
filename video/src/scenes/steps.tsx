import { ArrowPathIcon, BriefcaseIcon, CheckIcon, CubeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { ArrowsRightLeftIcon, DocumentCheckIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AppShell, Btn, DocBar, Footer, Modal } from "../ui/app";
import { Cursor } from "../ui/cursor";
import { DocView, LINES, LineState, TOTAL_HT, TOTAL_TTC } from "../ui/document";
import { LogoMark } from "../ui/logo";
import { bouncy, c, clamp, euros, pop, prog } from "../theme";
import { Checklist, StepLayout } from "./chain-layout";

const Q_CRUMBS = ["L'inventaire", "Devis", "D-2026-1"];
const all = (s: Partial<LineState>): LineState[] => LINES.map(() => ({ appear: 1, ...s }));

// Footer primary button position (app coordinates)
const FOOT = { x: 1200, y: 762 };

/* ------------------------------------------------------------------ 1 */
export const StepQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const picks = [55, 95, 135, 175];
  const lineStates = LINES.map((_, i) => ({ appear: pop(frame, fps, picks[i] + 4) }));
  const picker = pop(frame, fps, 30) * (1 - prog(frame, 205, 215));
  const itemY = (i: number) => 200 + 70 + i * 52;
  const Y0 = 200;
  return (
    <StepLayout
      step={0}
      num={1}
      title="Le devis, pièce centrale"
      text={
        <>
          Vous y déposez tout ce que vous vendez&nbsp;: <b>produits</b> en stock, <b>services</b> et{" "}
          <b>abonnements</b>. Tout le reste en découle.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 40, z: 1.25, x: 780, y: 480 },
        { f: 200, z: 1.25, x: 780, y: 520 },
        { f: 240, z: 1, x: 640, y: 400 },
      ]}
    >
      <AppShell active="quotes" crumbs={Q_CRUMBS}>
        <DocBar right={<Btn>Sauvegarder</Btn>} />
        <DocView
          kind="Devis"
          reference="D-2026-1"
          status={{ label: "Brouillon", color: "gray" }}
          banner={{ color: "gray", content: <>Ce document est un <b>brouillon</b>.</> }}
          lineStates={lineStates}
          showProgress={false}
          scroll={interpolate(frame, [150, 200], [0, 120], clamp)}
        />
        {picker > 0 && (
          <div
            style={{
              position: "absolute",
              left: 700,
              top: Y0,
              width: 380,
              background: "white",
              borderRadius: 10,
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              border: `1px solid ${c.s100}`,
              padding: 14,
              opacity: picker,
              transform: `translateY(${(1 - picker) * 12}px)`,
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Choisir un article</div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                border: `1px solid ${c.s200}`,
                borderRadius: 5,
                padding: "7px 10px",
                color: c.s400,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              <MagnifyingGlassIcon style={{ width: 15 }} /> Rechercher un article...
            </div>
            {LINES.map((l, i) => {
              const hover = frame >= picks[i] - 12 && frame < picks[i] + 8;
              const added = frame >= picks[i];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 52,
                    padding: "0 8px",
                    borderRadius: 6,
                    background: hover ? c.s50 : "transparent",
                    fontSize: 14,
                  }}
                >
                  {l.kind === "product" ? <CubeIcon style={{ width: 16 }} /> : <BriefcaseIcon style={{ width: 16 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 12.5, color: c.s500 }}>
                      {l.kind === "product" ? "Stockable" : l.monthly ? "Service · Mensuel" : "Service"}
                    </div>
                  </div>
                  <div style={{ color: c.s600 }}>
                    {euros(l.price)} <span style={{ fontSize: 12 }}>/{l.unit}</span>
                  </div>
                  {added && <CheckIcon style={{ width: 16, color: c.green }} />}
                </div>
              );
            })}
          </div>
        )}
        <Cursor
          keys={[
            { f: 0, x: 1000, y: 700 },
            ...picks.flatMap((p, i) => [
              { f: p - 14, x: 850, y: itemY(i) + Y0 - 200 + 26 },
              { f: p, x: 850, y: itemY(i) + Y0 - 200 + 26, click: true },
            ]),
            { f: 230, x: 1100, y: 560 },
          ]}
        />
      </AppShell>
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 2 */
export const StepSend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const modal = pop(frame, fps, 34) * (1 - prog(frame, 96, 104));
  const sent = frame >= 100;
  return (
    <StepLayout
      step={1}
      num={2}
      title="Envoi en un clic"
      text={
        <>
          Le devis part par email avec la <b>signature électronique</b> intégrée. Plus d'impression, plus de scan.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 30, z: 1.35, x: 900, y: 560 },
        { f: 90, z: 1.35, x: 800, y: 420 },
        { f: 110, z: 1.5, x: 600, y: 220 },
      ]}
    >
      <AppShell active="quotes" crumbs={Q_CRUMBS}>
        <DocBar />
        <DocView
          kind="Devis"
          reference="D-2026-1"
          status={sent ? { label: "Envoyé", color: "blue", scale: 1 + 0.25 * (1 - pop(frame, fps, 100)) } : { label: "Brouillon", color: "gray" }}
          banner={
            sent
              ? { color: "blue", content: <>Le devis a été envoyé au client et est <b>en attente d'acceptation</b>.</> }
              : { color: "gray", content: <>Ce document est un <b>brouillon</b>.</> }
          }
          lineStates={all({})}
          showProgress={false}
        />
        <Footer>
          <Btn icon={PaperAirplaneIcon} pressed={frame > 28 && frame < 34 ? 1 : 0}>
            Envoyer
          </Btn>
        </Footer>
        <Modal title="Envoyer le document" appear={modal} width={460}>
          <div style={{ fontSize: 14, color: c.s500, marginBottom: 6 }}>Destinataires</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${c.s200}`,
              borderRadius: 5,
              padding: "8px 10px",
              fontSize: 14,
            }}
          >
            sophie@boulangerie-martin.fr
            <span style={{ background: c.s50, borderRadius: 4, padding: "2px 8px" }}>Signer</span>
          </div>
          <div style={{ fontSize: 14, color: c.s500, margin: "14px 0 6px" }}>Statut final</div>
          <div style={{ display: "flex", gap: 8, fontSize: 14 }}>
            <span style={{ border: `1px solid ${c.s200}`, borderRadius: 5, padding: "5px 10px", color: c.s500 }}>Brouillon</span>
            <span style={{ border: `2px solid ${c.accent}`, borderRadius: 5, padding: "4px 10px", fontWeight: 600 }}>Envoyé</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Btn icon={PaperAirplaneIcon} pressed={frame > 88 && frame < 94 ? 1 : 0}>
              Envoyer
            </Btn>
          </div>
        </Modal>
        <Cursor
          keys={[
            { f: 0, x: 900, y: 600 },
            { f: 26, x: FOOT.x + 8, y: FOOT.y },
            { f: 28, x: FOOT.x + 8, y: FOOT.y, click: true },
            { f: 70, x: 790, y: 497 },
            { f: 88, x: 790, y: 497, click: true },
            { f: 130, x: 700, y: 300 },
          ]}
        />
      </AppShell>
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 3 */
export const StepSign: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const checked = frame >= 48;
  const signed = frame >= 86;
  const client = 1 - prog(frame, 120, 134);
  const accepted = frame >= 128;
  return (
    <StepLayout
      step={2}
      num={3}
      title="Votre client signe en ligne"
      text={
        <>
          Il accepte le devis depuis son téléphone ou son ordinateur. Le devis passe automatiquement en{" "}
          <b>«&nbsp;Accepté&nbsp;»</b>.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 20, z: 1.5, x: 640, y: 440 },
        { f: 112, z: 1.5, x: 640, y: 440 },
        { f: 128, z: 1, x: 640, y: 400 },
        { f: 150, z: 1.5, x: 560, y: 210 },
      ]}
    >
      <AppShell active="quotes" crumbs={Q_CRUMBS} badges={accepted ? { quotes: 1 } : {}}>
        <DocBar right={<Btn variant="outline">Fournir les produits</Btn>} />
        <DocView
          kind="Devis"
          reference="D-2026-1"
          status={
            accepted
              ? { label: "Accepté", color: "orange", scale: 1 + 0.25 * (1 - pop(frame, fps, 132)) }
              : { label: "Envoyé", color: "blue" }
          }
          subtitle={accepted ? <span style={{ fontSize: 13.5, color: c.s600 }}>• Accepté le 30/09/2026</span> : null}
          banner={
            accepted
              ? { color: "orange", content: <>Le devis a été accepté par le client, certaines lignes ne sont pas encore complétées.</> }
              : { color: "blue", content: <>Le devis a été envoyé au client et est <b>en attente d'acceptation</b>.</> }
          }
          lineStates={all({})}
          showProgress={false}
        />
      </AppShell>
      {/* Client side: public signing page, drawn over the app */}
      {client > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(237,237,237,${client})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: client,
            zIndex: 30,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 44,
              background: "white",
              borderBottom: `1px solid ${c.s100}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
            }}
          >
            {["#ef4444", "#f59e0b", "#22c55e"].map((col) => (
              <span key={col} style={{ width: 11, height: 11, borderRadius: 6, background: col }} />
            ))}
            <div
              style={{
                marginLeft: 20,
                flex: 1,
                maxWidth: 560,
                height: 28,
                borderRadius: 14,
                background: c.s50,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontSize: 13.5,
                color: c.s600,
              }}
            >
              🔒 Lien de signature sécurisé reçu par email
            </div>
            <span style={{ marginLeft: "auto", fontSize: 13, color: c.s500 }}>Vue client</span>
          </div>
          <div
            style={{
              width: 560,
              background: "white",
              borderRadius: 12,
              border: `1px solid ${c.s100}`,
              padding: 32,
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              transform: `translateY(${(1 - pop(frame, fps, 0)) * 30}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LogoMark size={28} />
              <span style={{ fontSize: 13, color: c.s500 }}>Espace client · Atelier Durand</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 20 }}>Signature du document</div>
            <div
              style={{
                marginTop: 16,
                border: `1px solid ${c.s100}`,
                borderRadius: 8,
                padding: 14,
                fontSize: 15,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <b>Devis D-2026-1</b>
                <div style={{ color: c.s500 }}>Équipement caisse boutique</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <b>{euros(TOTAL_TTC)}</b>
                <div style={{ color: c.s500 }}>TTC</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, fontSize: 15 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${checked ? c.blue : c.s200}`,
                  background: checked ? c.blue : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checked && <CheckIcon style={{ width: 14, color: "white" }} />}
              </div>
              J'ai lu et j'accepte le contenu de ce document
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              {signed ? (
                <div
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 6,
                    background: c.greenBg,
                    color: c.greenText,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 16,
                    transform: `scale(${bouncy(frame, fps, 86)})`,
                  }}
                >
                  <CheckIcon style={{ width: 20 }} /> Devis signé
                </div>
              ) : (
                <>
                  <Btn variant="outline" style={{ height: 44 }}>
                    Refuser
                  </Btn>
                  <Btn style={{ flex: 1, height: 44, justifyContent: "center" }} pressed={frame > 80 && frame < 86 ? 1 : 0}>
                    Accepter et signer
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {client > 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 40 }}>
          <Cursor
            keys={[
              { f: 0, x: 900, y: 650 },
              { f: 36, x: 402, y: 456 },
              { f: 44, x: 402, y: 456, click: true },
              { f: 70, x: 689, y: 512 },
              { f: 80, x: 689, y: 512, click: true },
              { f: 120, x: 900, y: 650 },
            ]}
          />
        </div>
      )}
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 4 */
export const StepFulfil: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const furnish = frame >= 30 && frame < 100;
  const fOpen = pop(frame, fps, 30);
  const reserved = prog(frame, 112, 140);
  const delivered = prog(frame, 140, 168);
  const executed = prog(frame, 172, 200);
  const done = frame >= 204;
  return (
    <StepLayout
      step={3}
      num={4}
      title="Réalisation suivie ligne par ligne"
      text={
        <>
          Les produits sont <b>réservés en stock</b> ou <b>commandés</b> chez vos fournisseurs, les interventions
          planifiées. Le devis affiche l'avancement de chaque ligne.
        </>
      }
      extra={
        <Checklist
          items={[
            { at: 118, label: "Caisses réservées en stock" },
            { at: 140, label: "Commande fournisseur créée" },
            { at: 178, label: "Installation réalisée" },
          ]}
        />
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 100, z: 1, x: 640, y: 400 },
        { f: 125, z: 1.45, x: 700, y: 540 },
        { f: 200, z: 1.45, x: 700, y: 620 },
        { f: 225, z: 1.3, x: 600, y: 300 },
      ]}
    >
      <AppShell active={furnish ? "stock" : "quotes"} crumbs={Q_CRUMBS} badges={{ quotes: 1 }}>
        <DocBar right={<Btn variant="outline" pressed={frame > 22 && frame < 28 ? 1 : 0}>Fournir les produits</Btn>} />
        {furnish ? (
          <div style={{ flex: 1, padding: "30px 36px", opacity: fOpen }}>
            <div style={{ fontSize: 14, color: c.s400 }}>
              Définissez les articles que vous souhaitez retirer du stock ou commander chez vos fournisseurs
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, margin: "14px 0 20px" }}>Articles à fournir</div>
            <div style={{ display: "flex", fontSize: 13.5, color: c.s500, background: c.s25, padding: "6px 8px" }}>
              <div style={{ flex: 1.3 }}>Article</div>
              <div style={{ flex: 1 }}>Déjà commandé</div>
              <div style={{ flex: 1.8 }}>Fournir</div>
              <div style={{ flex: 1.2 }}>Status après l'opération</div>
            </div>
            {LINES.filter((l) => l.kind === "product").map((l, i) => {
              const set = frame >= 50 + i * 12;
              return (
                <div key={l.name} style={{ display: "flex", alignItems: "center", fontSize: 14.5, padding: "14px 8px", borderBottom: `1px solid ${c.s100}` }}>
                  <div style={{ flex: 1.3, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ flex: 1 }}>0 unité</div>
                  <div style={{ flex: 1.8 }}>
                    <span style={{ border: `1px solid ${c.s200}`, borderRadius: 5, padding: "6px 10px", color: set ? c.ink : c.s400 }}>
                      {set ? (i === 0 ? "2 unité · Stock" : "2 unité · Commande Fournisseur") : "Cliquer pour modifier"}
                    </span>
                  </div>
                  <div style={{ flex: 1.2, color: set ? c.green : c.red, fontWeight: 600 }}>{set ? 2 : 0} / 2 unité</div>
                </div>
              );
            })}
            <div style={{ position: "absolute", right: 14, bottom: 12 }}>
              <Btn pressed={frame > 84 && frame < 90 ? 1 : 0}>Créer 1 commande et réserver 2 éléments du stock</Btn>
            </div>
          </div>
        ) : (
          <DocView
            kind="Devis"
            reference="D-2026-1"
            status={done ? { label: "À facturer", color: "green", scale: 1 + 0.25 * (1 - pop(frame, fps, 204)) } : { label: "Accepté", color: "orange" }}
            subtitle={<span style={{ fontSize: 13.5, color: c.s600 }}>• Accepté le 30/09/2026</span>}
            banner={
              done
                ? { color: "green", content: <>Toutes les lignes sont complétées&nbsp;: le devis est <b>prêt à être facturé</b>.</> }
                : { color: "orange", content: <>Le devis a été accepté par le client, certaines lignes ne sont pas encore complétées.</> }
            }
            lineStates={LINES.map((l) => (l.kind === "product" ? { appear: 1, reserved, delivered } : { appear: 1, executed }))}
          />
        )}
        <Cursor
          keys={[
            { f: 0, x: 900, y: 500 },
            { f: 20, x: 1175, y: 74 },
            { f: 22, x: 1175, y: 74, click: true },
            { f: 45, x: 760, y: 256 },
            { f: 50, x: 760, y: 256, click: true },
            { f: 58, x: 760, y: 303 },
            { f: 62, x: 760, y: 303, click: true },
            { f: 82, x: 1067, y: 770 },
            { f: 84, x: 1067, y: 770, click: true },
            { f: 130, x: 1180, y: 720 },
          ]}
        />
      </AppShell>
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 5 */
const Tabs: React.FC<{ active: number; hover?: number }> = ({ active, hover }) => (
  <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${c.s100}`, marginBottom: 14 }}>
    {["Tout facturer", "Facture partielle", "Acompte"].map((t, i) => (
      <div
        key={t}
        style={{
          fontSize: 14,
          padding: "8px 12px",
          color: i === active ? c.ink : c.s500,
          borderBottom: i === active ? `2px solid ${c.accent}` : "2px solid transparent",
          background: i === hover && i !== active ? c.s25 : "transparent",
          fontWeight: i === active ? 600 : 400,
        }}
      >
        {t}
      </div>
    ))}
  </div>
);

export const InvoiceView: React.FC<{
  paid?: number;
  status?: { label: string; color: "blue" | "green"; scale?: number };
  after?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: number;
}> = ({ paid = 0, status = { label: "Paiement en attente", color: "blue" }, after, footer, scroll }) => (
  <AppShell active="invoices" crumbs={["L'inventaire", "Factures", "F-2026-1"]} badges={{}}>
    <DocBar right={<Btn variant="outline">Créer un avoir</Btn>} />
    <DocView
      kind="Facture"
      reference="F-2026-1"
      status={status}
      subtitle={
        <span style={{ fontSize: 13.5, color: paid >= 1 ? c.s600 : c.s600 }}>
          Paiement avant le 30/10/2026
        </span>
      }
      payTag={
        <span
          style={{
            fontSize: 13.5,
            padding: "2px 8px",
            borderRadius: 4,
            background: paid >= 1 ? c.greenBg : c.redBg,
            color: paid >= 1 ? c.greenText : c.redText,
            fontWeight: 600,
          }}
        >
          {euros(TOTAL_TTC * paid)} ({Math.round(paid * 100)}%)
        </span>
      }
      lineStates={all({})}
      showProgress={false}
      totalHT={TOTAL_HT}
      scroll={scroll}
      after={
        after ?? (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Origine</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>
              Devis d'origine&nbsp;: <b>D-2026-1</b> · Équipement caisse boutique
            </div>
          </div>
        )
      }
    />
    {footer}
  </AppShell>
);

export const StepInvoice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const modal = pop(frame, fps, 30) * (1 - prog(frame, 150, 158));
  const hover = frame >= 70 && frame < 90 ? 1 : frame >= 90 && frame < 110 ? 2 : undefined;
  const invoice = frame >= 156;
  const inv = pop(frame, fps, 156);
  return (
    <StepLayout
      step={4}
      num={5}
      title="Du devis à la facture"
      text={
        <>
          Facturez tout, une partie ou un <b>acompte</b>. Les lignes sont reprises automatiquement&nbsp;: rien n'est
          ressaisi, et le devis sait ce qu'il reste à facturer.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 35, z: 1.4, x: 760, y: 420 },
        { f: 150, z: 1.4, x: 760, y: 420 },
        { f: 165, z: 1, x: 640, y: 400 },
        { f: 200, z: 1.4, x: 800, y: 220 },
      ]}
    >
      {!invoice ? (
        <AppShell active="quotes" crumbs={Q_CRUMBS} badges={{ quotes: 1 }}>
          <DocBar right={<Btn variant="outline">Fournir les produits</Btn>} />
          <DocView
            kind="Devis"
            reference="D-2026-1"
            status={{ label: "À facturer", color: "green" }}
            subtitle={<span style={{ fontSize: 13.5, color: c.s600 }}>• Accepté le 30/09/2026</span>}
            banner={{ color: "green", content: <>Toutes les lignes sont complétées&nbsp;: le devis est <b>prêt à être facturé</b>.</> }}
            lineStates={all({ reserved: 1, delivered: 1, executed: 1 })}
          />
          <Footer>
            <Btn icon={DocumentCheckIcon} pressed={frame > 22 && frame < 28 ? 1 : 0}>
              Facturer
            </Btn>
          </Footer>
          <Modal title="Créer une facture" appear={modal} width={440}>
            <Tabs active={0} hover={hover} />
            {LINES.map((l) => (
              <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, padding: "5px 0" }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: c.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckIcon style={{ width: 13, color: "white" }} />
                </div>
                <span style={{ flex: 1 }}>
                  {l.name}{" "}
                  <span style={{ color: c.s500 }}>
                    ({l.qty} livré / {l.qty})
                  </span>
                </span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${c.s100}`, marginTop: 12, paddingTop: 12, fontSize: 14.5, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700 }}>Facture à générer</div>
              <div style={{ fontWeight: 700 }}>{euros(TOTAL_HT)} HT sur cette facture.</div>
              <div>0,00 € HT déjà facturé.</div>
              <div>0,00 € HT restera à facturer.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <Btn pressed={frame > 136 && frame < 142 ? 1 : 0}>Créer la facture</Btn>
            </div>
          </Modal>
          <Cursor
            keys={[
              { f: 0, x: 900, y: 500 },
              { f: 20, x: FOOT.x, y: FOOT.y },
              { f: 22, x: FOOT.x, y: FOOT.y, click: true },
              { f: 66, x: 624, y: 269 },
              { f: 86, x: 736, y: 269 },
              { f: 108, x: 736, y: 269 },
              { f: 134, x: 763, y: 563 },
              { f: 136, x: 763, y: 563, click: true },
            ]}
          />
        </AppShell>
      ) : (
        <div style={{ opacity: inv, transform: `scale(${0.98 + inv * 0.02})` }}>
          <InvoiceView />
        </div>
      )}
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 6 */
export const StepSubscription: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const months = ["octobre", "novembre", "décembre", "janvier"];
  return (
    <StepLayout
      step={4}
      num={6}
      subscriptionOn
      title="Les abonnements tournent seuls"
      text={
        <>
          La ligne mensuelle du devis devient un <b>abonnement</b>&nbsp;: une facture est générée automatiquement à
          chaque période.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 40, z: 1.3, x: 700, y: 330 },
      ]}
    >
      <AppShell active="subscriptions" crumbs={["L'inventaire", "Abonnements"]}>
        <div style={{ display: "flex", borderBottom: `1px solid ${c.s100}`, padding: "0 12px", height: 44, alignItems: "flex-end" }}>
          {["Actifs", "À vérifier", "Terminés"].map((t, i) => (
            <div
              key={t}
              style={{
                fontSize: 14,
                padding: "10px 14px",
                borderBottom: i === 0 ? `2px solid ${c.accent}` : "2px solid transparent",
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 13.5, color: c.s500, padding: "8px 20px", borderBottom: `1px solid ${c.s100}` }}>
          <div style={{ width: 170 }}>Référence</div>
          <div style={{ flex: 1 }}>Client</div>
          <div style={{ width: 150 }}>Statut</div>
          <div style={{ width: 200, textAlign: "right" }}>Montant</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 14.5, padding: "14px 20px", borderBottom: `1px solid ${c.s100}` }}>
          <div style={{ width: 170 }}>
            <b>D-2026-1</b>
            <div style={{ fontSize: 13, color: c.s500 }}>Maintenance & support</div>
          </div>
          <div style={{ flex: 1 }}>Boulangerie Martin</div>
          <div style={{ width: 150 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${c.s200}`, borderRadius: 4, padding: "2px 8px" }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: c.blue }} /> Abonnement
            </span>
          </div>
          <div style={{ width: 200, textAlign: "right" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${c.s100}`, borderRadius: 4, padding: "2px 8px" }}>
              <ArrowPathIcon style={{ width: 14, color: c.blue }} /> {euros(58.8)} / mois
            </span>
          </div>
        </div>
        <div style={{ padding: "20px 20px 0", fontSize: 14, color: c.s500 }}>
          Démarre le 30/09/2026, prochaine facture le 30/10/2026 · Tacite reconduction
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {months.map((m, i) => {
            const a = pop(frame, fps, 40 + i * 28);
            return (
              <div
                key={m}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid ${c.s100}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 14.5,
                  opacity: a,
                  transform: `translateX(${(1 - a) * 40}px)`,
                  width: 700,
                }}
              >
                <ArrowPathIcon style={{ width: 18, color: c.blue }} />
                <b style={{ width: 90 }}>F-2026-{i + 2}</b>
                <span style={{ flex: 1, color: c.s600 }}>Période de récurrence · {m}</span>
                <span style={{ fontWeight: 600 }}>{euros(58.8)}</span>
                <span
                  style={{
                    fontSize: 12.5,
                    background: c.blueBg,
                    color: c.blueText,
                    borderRadius: 4,
                    padding: "2px 8px",
                  }}
                >
                  Générée automatiquement
                </span>
              </div>
            );
          })}
        </div>
      </AppShell>
    </StepLayout>
  );
};

/* ------------------------------------------------------------------ 7 */
export const StepPayment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const modal = pop(frame, fps, 30) * (1 - prog(frame, 112, 120));
  const paid = prog(frame, 122, 150);
  const done = frame >= 150;
  return (
    <StepLayout
      step={5}
      num={7}
      title="Paiement reçu, dossier bouclé"
      text={
        <>
          Enregistrez le règlement&nbsp;: la facture est soldée, le devis clôturé et votre <b>trésorerie</b> à jour.
        </>
      }
      camera={[
        { f: 0, z: 1, x: 640, y: 400 },
        { f: 35, z: 1.35, x: 760, y: 420 },
        { f: 115, z: 1.35, x: 760, y: 420 },
        { f: 135, z: 1.5, x: 720, y: 180 },
      ]}
    >
      <InvoiceView
        paid={paid}
        status={
          done ? { label: "Payé", color: "green", scale: 1 + 0.25 * (1 - pop(frame, fps, 150)) } : { label: "Paiement en attente", color: "blue" }
        }
        footer={
          <>
            <Footer>
              <Btn icon={ArrowsRightLeftIcon} pressed={frame > 22 && frame < 28 ? 1 : 0}>
                Enregistrer un paiement
              </Btn>
            </Footer>
            <Modal title="Déclarer une opération" appear={modal} width={440}>
              {[
                ["Montant", euros(TOTAL_TTC)],
                ["Date", "15/10/2026"],
                ["Moyen de paiement", "Virement"],
                ["Factures / avoirs liés", "F-2026-1 · Boulangerie Martin"],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: c.s500, marginBottom: 4 }}>{k}</div>
                  <div style={{ border: `1px solid ${c.s200}`, borderRadius: 5, padding: "7px 10px", fontSize: 14.5 }}>{v}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <Btn pressed={frame > 100 && frame < 106 ? 1 : 0}>Enregistrer</Btn>
              </div>
            </Modal>
            <Cursor
              keys={[
                { f: 0, x: 900, y: 500 },
                { f: 20, x: 1160, y: FOOT.y },
                { f: 22, x: 1160, y: FOOT.y, click: true },
                { f: 98, x: 781, y: 550 },
                { f: 100, x: 781, y: 550, click: true },
                { f: 150, x: 1000, y: 300 },
              ]}
            />
          </>
        }
      />
    </StepLayout>
  );
};
