import React from "react";
import { Composition, Series } from "remotion";
import {
  Architecture,
  Concepts,
  GettingStarted,
  Intro,
  NewBranch,
  Outro,
  Tips,
  WhatIsIt,
} from "./scenes";

// Durations in frames (30 fps)
const scenes: [React.FC, number][] = [
  [Intro, 150],
  [WhatIsIt, 180],
  [Architecture, 180],
  [Concepts, 210],
  [GettingStarted, 270],
  [NewBranch, 300],
  [Tips, 180],
  [Outro, 100],
];

const Onboarding: React.FC = () => (
  <Series>
    {scenes.map(([Component, duration], i) => (
      <Series.Sequence key={i} durationInFrames={duration}>
        <Component />
      </Series.Sequence>
    ))}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Onboarding"
    component={Onboarding}
    durationInFrames={scenes.reduce((sum, [, d]) => sum + d, 0)}
    fps={30}
    width={1920}
    height={1080}
  />
);
