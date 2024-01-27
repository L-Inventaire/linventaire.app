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
            alt="Simple"
          />
          <img
            className="mx-auto h-6 w-auto hidden dark:block"
            src="/medias/logo.svg"
            alt="Simple"
          />
          {!!props.title && (
            <h2 className="mt-6 text-left text-3xl font-extrabold text-gray-900 dark:text-white">
              {props.title}
            </h2>
          )}
          {!!props.subtitle && (
            <p className="mt-2 text-left text-sm text-gray-600 dark:text-slate-200">
              {props.subtitle}
            </p>
          )}
        </div>
      )}

      <div
        style={{ zIndex: 1 }}
        className="mt-0 mb-0 h-full sm:mb-12 sm:mt-8 sm:ml-32 lg:ml-64 sm:mr-auto sm:w-full sm:max-w-md"
      >
        <div className="py-8 px-4 sm:pb-8 pb-12 rounded-t-lg sm:rounded-lg sm:px-10 bg-white dark:bg-slate-800 shadow-lg">
          {props.insetLogo && (
            <>
              <img
                className="h-8 w-auto mb-7 mt-2 dark:hidden"
                src="/medias/logo-black.svg"
                alt="Simple"
              />
              <img
                className="h-8 w-auto mb-7 mt-2 hidden dark:block"
                src="/medias/logo.svg"
                alt="Simple"
              />
            </>
          )}
          <AnimatedHeight>{props.children}</AnimatedHeight>
        </div>
      </div>
    </div>
  );
}
