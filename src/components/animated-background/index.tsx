import { useEffect } from "react";
import "./index.css";

const createBlob = () => {
  const colors = ["#FBE7C6", "#B4F8C8", "#A0E7E5", "#FFAEBC"]; // Random colors palette
  const screenSize = window.innerHeight;
  const blobSize = 0.1 * screenSize + Math.random() * screenSize * 0.2; // Random size in % of screen height
  const position = Math.random() > 0 ? "right" : "left"; // Random position
  const duration = (Math.random() * 20 + 50) * (window.innerHeight / 600); // Random duration between 5 to 10 seconds
  const delay = Math.random() * 50 * (window.innerHeight / 600);

  const blob = document.createElement("div");
  blob.classList.add("blob");
  blob.style.backgroundColor =
    colors[Math.floor(Math.random() * colors.length)];
  blob.style.height = `${blobSize}px`;
  blob.style.width = `${blobSize}px`;

  // Positioning the blob outside of the screen
  blob.style.top = `${Math.random() * 100}%`;
  if (position === "right") {
    blob.style.right = `-${blobSize}px`;
    blob.classList.add("move-left");
  } else {
    blob.style.left = `-${blobSize}px`;
    blob.classList.add("move-right");
  }

  blob.style.animationDuration = `${duration}s`;
  blob.style.animationDelay = `${delay}s`;

  // Adding the blob to the lava div
  (window as any).document.querySelector(".lava").appendChild(blob);

  // Removing the blob after animation
  blob.addEventListener("animationend", () => {
    blob.remove();
    createBlob();
  });
};

export const AnimatedBackground = () => {
  useEffect(() => {
    Array.from({ length: 50 }).forEach(() => createBlob());
  }, []);

  return (
    <>
      <div className="lamp">
        <div className="lava"></div>
      </div>
      <svg
        className="absolute top-0"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="25"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 180 -70"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
};
