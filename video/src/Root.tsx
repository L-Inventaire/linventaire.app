import React from "react";
import { Composition, Series } from "remotion";
import { planScene, TimedScene } from "./timing";
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

// Final plan of each scene: stretched to the voice-over when there is one
const PLANS = SCENES.map(([name, Component, base]) => ({ name, Component, base, plan: planScene(name, base) }));

const Film: React.FC = () => (
  <Series>
    {PLANS.map(({ name, Component, base, plan }) => (
      <Series.Sequence key={name} name={name} durationInFrames={plan.duration}>
        <TimedScene plan={plan} base={base}>
          <Component />
        </TimedScene>
      </Series.Sequence>
    ))}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Presentation"
      component={Film}
      durationInFrames={PLANS.reduce((sum, p) => sum + p.plan.duration, 0)}
      fps={30}
      width={1920}
      height={1080}
    />
    {/* Each scene alone, handy for iterating in the Studio */}
    {PLANS.map(({ name, Component, base, plan }) => (
      <Composition
        key={name}
        id={"scene-" + name}
        component={() => (
          <TimedScene plan={plan} base={base}>
            <Component />
          </TimedScene>
        )}
        durationInFrames={plan.duration}
        fps={30}
        width={1920}
        height={1080}
      />
    ))}
  </>
);
