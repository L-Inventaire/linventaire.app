import React from "react";
import { Composition, Series } from "remotion";
import {
  StepFulfil,
  StepInvoice,
  StepPayment,
  StepQuote,
  StepSend,
  StepSign,
  StepSubscription,
} from "./scenes/steps";
import { Dashboard } from "./scenes/dashboard";
import { Features, HowItWorks, Intro, Outro, Positioning, Recap } from "./scenes/story";

// Durations in frames (30 fps)
export const SCENES: [string, React.FC, number][] = [
  ["intro", Intro, 110],
  ["features", Features, 170],
  ["how", HowItWorks, 70],
  ["positioning", Positioning, 300],
  ["quote", StepQuote, 250],
  ["send", StepSend, 150],
  ["sign", StepSign, 180],
  ["fulfil", StepFulfil, 240],
  ["invoice", StepInvoice, 230],
  ["subscription", StepSubscription, 180],
  ["payment", StepPayment, 200],
  ["recap", Recap, 200],
  ["dashboard", Dashboard, 270],
  ["outro", Outro, 120],
];

const Film: React.FC = () => (
  <Series>
    {SCENES.map(([name, Component, duration]) => (
      <Series.Sequence key={name} name={name} durationInFrames={duration}>
        <Component />
      </Series.Sequence>
    ))}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Presentation"
      component={Film}
      durationInFrames={SCENES.reduce((sum, [, , d]) => sum + d, 0)}
      fps={30}
      width={1920}
      height={1080}
    />
    {/* Each scene alone, handy for iterating in the Studio */}
    {SCENES.map(([name, Component, duration]) => (
      <Composition
        key={name}
        id={"scene-" + name}
        component={Component}
        durationInFrames={duration}
        fps={30}
        width={1920}
        height={1080}
      />
    ))}
  </>
);
