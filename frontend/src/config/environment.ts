const Env = {
  reCaptchaSiteKey: "6Lf5LxopAAAAALXErlTeGxlWy_x6M8RlKlJzZ4RB",
  server:
    // "https://api.linventaire.app" ||
    document.location.origin.replace(/:[0-9]+$/, "") + ":3000",
  // Public API documentation (in development: `npm run dev` in /api-docs)
  apiDocs: "http://localhost:3007",
  version: "1.3.0",
};

export default Env;
