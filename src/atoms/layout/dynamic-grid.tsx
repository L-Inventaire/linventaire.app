import React, { useEffect, useRef, useState } from "react";

export const DynamicGrid = (props: {
  children: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;

      if (width >= 1536) setColumns(8);
      else if (width >= 1200) setColumns(6);
      else if (width >= 800) setColumns(4);
      else if (width >= 600) setColumns(3);
      else if (width >= 400) setColumns(2);
      else setColumns(1);
    };

    updateColumns();

    window.addEventListener("resize", updateColumns);
    return () => {
      window.removeEventListener("resize", updateColumns);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
      className={props.className}
    >
      {!!columns && props.children}
    </div>
  );
};
