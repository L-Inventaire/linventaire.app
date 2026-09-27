import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Terminal } from "../Terminal";
import { Appear, Card, colors, Scene, Title } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const shot = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  return (
    <Scene>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ fontSize: 140, transform: `scale(${s})` }}>📒</div>
        <div style={{ fontSize: 110, fontWeight: 800, transform: `scale(${s})` }}>
          linventaire<span style={{ color: colors.accent }}>.app</span>
        </div>
        <Appear delay={15} style={{ fontSize: 40, color: colors.muted, marginTop: 10 }}>
          Le co-pilote ERP de votre entreprise — Agile. Flexible. Rapide.
        </Appear>
        <Img
          src={staticFile("screenshot.png")}
          style={{
            marginTop: 50,
            width: 1000,
            borderRadius: 16,
            border: `2px solid ${colors.border}`,
            opacity: shot,
            transform: `translateY(${interpolate(shot, [0, 1], [80, 0])}px)`,
          }}
        />
      </div>
    </Scene>
  );
};

const features = [
  ["🧾", "Devis & factures", "avoirs, factures récurrentes"],
  ["🤝", "CRM & contacts", "pipeline kanban, sociétés, personnes"],
  ["📦", "Stock", "numéros de série, emplacements"],
  ["🛒", "Achats", "commandes et factures fournisseurs"],
  ["⏱️", "Service", "tâches et suivi du temps"],
  ["📡", "E-invoicing", "Peppol / PPF via SuperPDP"],
];

export const WhatIsIt: React.FC = () => (
  <Scene>
    <Title kicker="Qu'est-ce que c'est ?">Un ERP open-source, tout-en-un</Title>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 32,
      }}
    >
      {features.map(([icon, title, sub], i) => (
        <Card key={title} delay={10 + i * 8}>
          <div style={{ fontSize: 64 }}>{icon}</div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 10 }}>{title}</div>
          <div style={{ fontSize: 28, color: colors.muted, marginTop: 6 }}>{sub}</div>
        </Card>
      ))}
    </div>
  </Scene>
);

const Box: React.FC<{
  delay: number;
  title: string;
  sub: string;
  color: string;
}> = ({ delay, title, sub, color }) => (
  <Card delay={delay} style={{ borderColor: color, textAlign: "center", flex: 1 }}>
    <div style={{ fontSize: 44, fontWeight: 800, color }}>{title}</div>
    <div style={{ fontSize: 28, color: colors.muted, marginTop: 10 }}>{sub}</div>
  </Card>
);

const Arrow: React.FC<{ delay: number }> = ({ delay }) => (
  <Appear delay={delay} style={{ fontSize: 60, color: colors.muted, alignSelf: "center" }}>
    ⇄
  </Appear>
);

export const Architecture: React.FC = () => (
  <Scene>
    <Title kicker="Architecture">Un monorepo, trois paquets</Title>
    <div style={{ display: "flex", gap: 30 }}>
      <Box delay={10} title="frontend/" sub="React 18 · Vite · Tailwind · React Query" color={colors.accent} />
      <Arrow delay={20} />
      <Box delay={25} title="backend/" sub="Node · Express · API REST générique" color={colors.accent2} />
      <Arrow delay={35} />
      <Box delay={40} title="PostgreSQL" sub="+ Redis, S3, RabbitMQ (optionnels)" color={colors.warn} />
    </div>
    <Card delay={55} style={{ marginTop: 40, textAlign: "center" }}>
      <span style={{ fontSize: 40, fontWeight: 800, color: "#a855f7" }}>shared/</span>
      <span style={{ fontSize: 32, color: colors.muted }}>
        {"  "}— types et utilitaires TypeScript communs au front et au back
      </span>
    </Card>
  </Scene>
);

const concepts = [
  ["🏢", "Multi-tenant", "Chaque donnée porte un client_id. Le contexte ctx isole chaque entreprise."],
  ["🔌", "API REST générique", "/api/rest/v1/{table} : CRUD + recherche plein texte pour toutes les entités."],
  ["🗑️", "Soft delete", "On ne supprime jamais : is_deleted, avec restauration possible."],
  ["📜", "Audit automatique", "Chaque modification est tracée dans la table events (avant / après)."],
];

export const Concepts: React.FC = () => (
  <Scene>
    <Title kicker="Les notions de base">4 idées à retenir</Title>
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {concepts.map(([icon, title, sub], i) => (
        <Card
          key={title}
          delay={10 + i * 20}
          style={{ display: "flex", alignItems: "center", gap: 36, padding: 28 }}
        >
          <div style={{ fontSize: 60 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 30, color: colors.muted }}>{sub}</div>
          </div>
        </Card>
      ))}
    </div>
  </Scene>
);

export const GettingStarted: React.FC = () => (
  <Scene>
    <Title kicker="Démarrer">Lancer le projet en local</Title>
    <Terminal
      title="linventaire.app"
      lines={[
        { at: 10, comment: "Récupérer le code", cmd: "git clone https://github.com/L-Inventaire/linventaire.app.git" },
        { at: 80, cmd: "cd linventaire.app" },
        { at: 105, comment: "Installer les hooks git (versions synchronisées)", cmd: "./scripts/install-hooks.sh" },
        { at: 150, comment: "Tout lancer : front, back, base de données", cmd: "docker-compose up --build" },
      ]}
    />
    <Appear delay={200} style={{ fontSize: 34, color: colors.muted, marginTop: 36 }}>
      👉 Puis ouvrir <b style={{ color: colors.text }}>http://localhost:3000</b>
    </Appear>
  </Scene>
);

export const NewBranch: React.FC = () => (
  <Scene>
    <Title kicker="Contribuer">Démarrer une nouvelle branche</Title>
    <Terminal
      title="git"
      lines={[
        { at: 10, comment: "Partir de la branche de développement à jour", cmd: "git checkout development && git pull" },
        { at: 75, comment: "Créer sa branche", cmd: "git checkout -b feat/ma-fonctionnalite" },
        { at: 135, comment: "Coder, tester, committer", cmd: "git commit -am \"feat(invoices): ...\"" },
        { at: 190, comment: "Pousser puis ouvrir une Pull Request vers development", cmd: "git push -u origin feat/ma-fonctionnalite" },
      ]}
    />
  </Scene>
);

const tips = [
  "Versions identiques dans frontend/ et backend/package.json (hook pre-commit)",
  "Messages de commit : feat(module): …, fix(module): …",
  "Toujours passer le ctx : il porte le client_id",
  "Tests backend : cd backend && yarn test · Lint : yarn linter",
];

export const Tips: React.FC = () => (
  <Scene>
    <Title kicker="Avant de pousser">Les bons réflexes</Title>
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {tips.map((t, i) => (
        <Appear key={t} delay={10 + i * 15} style={{ fontSize: 42, display: "flex", gap: 24 }}>
          <span style={{ color: colors.accent2 }}>✔</span>
          {t}
        </Appear>
      ))}
    </div>
  </Scene>
);

export const Outro: React.FC = () => (
  <Scene>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Appear style={{ fontSize: 90, fontWeight: 800 }}>À vous de jouer ! 🚀</Appear>
      <Appear delay={15} style={{ fontSize: 40, color: colors.muted, marginTop: 30 }}>
        github.com/L-Inventaire/linventaire.app
      </Appear>
    </div>
  </Scene>
);
