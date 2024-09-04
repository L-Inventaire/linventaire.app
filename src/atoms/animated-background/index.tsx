import { useEffect } from "react";
import "./index.css";

let running = false;
let mPos = 0.5;
let previousMousePos = 0.5;
const smoothness = 0.1; // Smaller values make the movement slower and smoother

const handleAnimation = () => {
  const wall = document.getElementById("wall-1");
  const rotator = document.getElementById("rotator");

  if (wall) {
    const currentMousePos = mPos / window.innerWidth;

    // ease-in ease-out function
    const mousePos =
      currentMousePos * smoothness + previousMousePos * (1 - smoothness);

    previousMousePos = mousePos;

    const usedMov = (mousePos - 0.5) * 0.5 + 0.5;

    wall.style.width = usedMov * 100 + "%";
    rotator!.style.transform = `rotate(${usedMov * 360 * 5.5}deg)`;
  }

  if (running) {
    requestAnimationFrame(() => handleAnimation());
  }
};

const handleMouseMove = (e: MouseEvent) => {
  mPos = e.clientX;
};

export const AnimatedBackground = () => {
  useEffect(() => {
    running = true;
    handleAnimation();

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      running = false;
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute top-0 left-0 w-screen h-screen flex hidden">
      <div className="relative w-screen h-screen flex">
        <div id="wall-1" className="w-1/2 relative bg-slate-950">
          <div
            id="rotator"
            className="h-5 w-5 rounded-full bg-white absolute bottom-[10%] right-16"
          >
            <div
              className="h-24 w-1 rounded-full bg-white absolute bottom-0 right-0"
              style={{ transform: "translate(-200%, 38%)" }}
            />{" "}
            <div
              className="h-1 w-24 rounded-full bg-white absolute bottom-0 right-0"
              style={{ transform: "translate(38%, -200%)" }}
            />
          </div>
        </div>
        <div className="h-full grow" />
      </div>

      <div
        className="absolute top-0 left-0 w-screen h-screen flex"
        style={{ zIndex: -1 }}
      >
        {[1, 2, 3, 4, 5, 6, 7].map(() => (
          <>
            <div className="bg-slate-950 grow" />
            <div className="bg-white grow" />
          </>
        ))}
        <div className="bg-slate-950 grow" />
      </div>
    </div>
  );
};
