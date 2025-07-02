import environment from "../../config/environment";

export const getCaptchaToken = async (action: string): Promise<string> => {
  const grecaptcha = (window as any).grecaptcha.enterprise;
  return (
    action +
    ":" +
    (await grecaptcha.execute(environment.reCaptchaSiteKey, {
      action,
    }))
  );
};
