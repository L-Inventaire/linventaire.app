import { useEffect } from "react";
import "./index.css";

function allTopOfScreenConfetti() {
  for (let i = 0; i < 100; i++) {
    createConfetti(
      document.body,
      Math.random() * window.innerWidth,
      -Math.random() * 100
    );
  }
}

function createConfetti(container: any, x: number, y: number) {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#e67e22",
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const confetti = document.createElement("div");
  confetti.className = "animated-confetti-confetti";
  confetti.style.backgroundColor = randomColor;
  confetti.style.left = x + "px";
  confetti.style.top = y + "px";

  document.body.appendChild(confetti);

  const angle = Math.random() * Math.PI * 2;
  const velocity = 2 + Math.random() * 2;
  const rotationSpeed = (Math.random() - 0.5) * 10;

  let xVelocity = velocity * Math.cos(angle);
  let yVelocity = velocity * Math.sin(angle);
  const gravity = 0.1;

  function animateConfetti() {
    xVelocity *= 0.99;
    yVelocity += gravity;
    x += xVelocity;
    y += yVelocity;

    const currentRotation =
      parseFloat(
        confetti.style.transform.replace("rotate(", "").replace("deg)", "")
      ) || 0;
    confetti.style.transform = `rotate(${currentRotation + rotationSpeed}deg)`;

    confetti.style.left = x + "px";
    confetti.style.top = y + "px";

    if (y < window.innerHeight) {
      requestAnimationFrame(animateConfetti);
    } else {
      confetti.remove();
    }
  }

  requestAnimationFrame(animateConfetti);
}

export const Confetti = () => {
  useEffect(() => {
    allTopOfScreenConfetti();

    document
      .getElementsByClassName("intro-animated-root")?.[0]
      ?.classList.add("root-intro");
    setTimeout(() => {
      document
        .getElementsByClassName("intro-animated-root")?.[0]
        ?.classList.add("root-intro-from");
    }, 1000);
    setTimeout(() => {
      document
        .getElementsByClassName("intro-animated-root")?.[0]
        ?.classList.remove("root-intro");
      document
        .getElementsByClassName("intro-animated-root")?.[0]
        ?.classList.remove("root-intro-from");
    }, 4000);
  }, []);
  return <></>;
};
