import environment from "../../config/environment";

let reCaptcha: Promise<any> | null = null;

/**
 * Load reCAPTCHA once and resolve when it is ready. It is needed on the logged
 * out pages but also when logged in (MFA asked to change the password, add an
 * email or a phone).
 */
export const loadReCaptcha = (): Promise<any> => {
  reCaptcha =
    reCaptcha ||
    new Promise((resolve, reject) => {
      const getEnterprise = () => (window as any).grecaptcha?.enterprise;
      let failed = false;
      const fail = () => {
        if (failed) return;
        failed = true;
        reCaptcha = null;
        reject(new Error("Couldn't load reCAPTCHA"));
      };

      if (!getEnterprise()) {
        const script = document.createElement("script");
        script.src =
          "https://www.google.com/recaptcha/enterprise.js?render=" +
          environment.reCaptchaSiteKey;
        script.async = true;
        script.defer = true;
        script.onerror = fail;
        document.body.appendChild(script);
      }

      // enterprise.js defines grecaptcha.enterprise after its own loading
      const startedAt = Date.now();
      const waitForEnterprise = () => {
        if (failed) return;
        const enterprise = getEnterprise();
        if (enterprise?.ready) {
          enterprise.ready(() => resolve(enterprise));
        } else if (Date.now() - startedAt > 15000) {
          fail();
        } else {
          setTimeout(waitForEnterprise, 100);
        }
      };
      waitForEnterprise();
    });
  return reCaptcha;
};

export const getCaptchaToken = async (action: string): Promise<string> => {
  const grecaptcha = await loadReCaptcha();
  return (
    action +
    ":" +
    (await grecaptcha.execute(environment.reCaptchaSiteKey, {
      action,
    }))
  );
};
