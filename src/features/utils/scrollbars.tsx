import { ReactNode } from "react";
import Scrollbars from "react-custom-scrollbars";
import { twMerge } from "tailwind-merge";

export function renderTrackHorizontalDefault({ style, ...props }: any) {
  const finalStyle = {
    ...style,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 3,
  };
  return <div style={finalStyle} {...props} />;
}

export function renderTrackVerticalDefault({ style, ...props }: any) {
  const finalStyle = {
    ...style,
    right: 2,
    bottom: 2,
    top: 2,
    borderRadius: 3,
    zIndex: 100,
  };
  return <div style={finalStyle} {...props} />;
}

export function renderThumbHorizontalDefault({
  style,
  className,
  ...props
}: any) {
  const finalStyle = {
    ...style,
    borderRadius: "inherit",
    backgroundColor: "rgba(0,0,0,.2)",
  };
  return (
    <div
      style={finalStyle}
      className={className + " scroll-track"}
      {...props}
    />
  );
}

export function renderThumbVerticalDefault({
  style,
  className,
  ...props
}: any) {
  const finalStyle = {
    ...style,
    borderRadius: "inherit",
    backgroundColor: "rgba(0,0,0,.2)",
  };
  return (
    <div
      style={finalStyle}
      className={className + " scroll-track"}
      {...props}
    />
  );
}

export const DefaultScrollbars = ({
  children,
  className,
  style,
  autoHeight,
  autoHeightMax,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  autoHeight?: boolean;
  autoHeightMax?: number | string;
}) => {
  return (
    <Scrollbars
      renderView={({
        className: initialClassNames,
        style: initialStyles,
        ...props
      }) => (
        <div
          {...props}
          className={twMerge(initialClassNames, className)}
          style={{ ...initialStyles, ...(style || {}) }}
        />
      )}
      renderTrackVertical={(props) => renderTrackVerticalDefault(props)}
      renderTrackHorizontal={(props) => renderTrackHorizontalDefault(props)}
      renderThumbVertical={(props) => renderThumbVerticalDefault(props)}
      renderThumbHorizontal={(props) => renderThumbHorizontalDefault(props)}
      autoHeight={autoHeight}
      autoHeightMax={autoHeightMax}
      className="scroll-parent"
    >
      {children}
    </Scrollbars>
  );
};
