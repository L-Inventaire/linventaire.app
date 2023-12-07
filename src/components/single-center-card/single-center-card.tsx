import { AnimatedHeight } from "@components/animated-height";

export default function SingleCenterCard(props: {
  logo?: boolean;
  insetLogo?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col justify-end sm:justify-center py-0 bg-transparent">
      {(!!props.logo || !!props.title || !!props.subtitle) && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-6 w-auto dark:hidden"
            src="/medias/logo.png"
            alt="Lydim"
          />
          <img
            className="mx-auto h-6 w-auto hidden dark:block"
            src="/medias/logo.svg"
            alt="Lydim"
          />
          {!!props.title && (
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {props.title}
            </h2>
          )}
          {!!props.subtitle && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-200">
              {props.subtitle}
            </p>
          )}
        </div>
      )}

      <div
        style={{ zIndex: 1 }}
        className="mt-0 mb-0 h-full sm:mb-12 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="py-8 px-4 sm:pb-8 pb-12 rounded-t-lg sm:rounded-lg sm:px-10 bg-white dark:bg-slate-800 backdrop-blur-sm bg-opacity-75">
          {props.insetLogo && (
            <>
              <img
                className="mx-auto h-8 w-auto mb-4 dark:hidden"
                src="/medias/logo-black.png"
                alt="Lydim"
              />
              <img
                className="mx-auto h-8 w-auto mb-4 hidden dark:block"
                src="/medias/logo.svg"
                alt="Lydim"
              />
            </>
          )}
          <AnimatedHeight>{props.children}</AnimatedHeight>
        </div>
      </div>
    </div>
  );
}
