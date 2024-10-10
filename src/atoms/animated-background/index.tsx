import "./index.css";

const random = Math.random();

export const AnimatedBackground = () => {
  return (
    <div className="animated-background-parent absolute flex flex-col w-full h-full top-0 left-0 overflow-hidden">
      <div className="animated-background flex flex-col w-full h-full top-0 left-0">
        {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => (
          <>
            <div className="grow"></div>
            <div
              className="animated-line-pulse line w-full h-px bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-10"
              style={{
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <div
                className="animated-line-move line-message w-1/6 h-px bg-black dark:bg-white"
                style={{
                  animationDelay: `${
                    (Math.ceil(random * 100 * i) % 100) * 0.3
                  }s`,
                }}
              ></div>
            </div>
          </>
        ))}
        <div className="grow"></div>
      </div>
    </div>
  );
};
