import config from "config";
import { Context as Context } from "../../types";
import { PlatformService } from "../types";
import _ from "lodash";

export default class I18n implements PlatformService {
  private default = "fr";
  private languages = ["en", "fr"];
  private locales = {};

  async init(): Promise<this> {
    this.languages.forEach((lang) => {
      this.locales[lang] = flattenJSON(
        require(`../../../assets/locales/${lang}.json`) || {}
      );
    });

    return this;
  }

  getLanguage(ctx: Pick<Context, "lang">, country?: string): string {
    const proposal = (ctx.lang || "").slice(0, 2).toLocaleLowerCase();
    const proposalCountry = (country || "").slice(0, 2).toLocaleLowerCase();
    return (
      this.languages.find((lang) => lang === proposal) ||
      this.languages.find((lang) => lang === proposalCountry) ||
      this.default
    );
  }

  t(
    ctx: Pick<Context, "lang">,
    key: string | string[],
    options?: {
      replacements?: {
        [key: string]: string;
      };
      fallback?: string;
    }
  ): string {
    const lang = this.getLanguage(ctx);
    const keys = Array.isArray(key) ? key : [key];
    let translation =
      keys
        .map(
          (key) =>
            this.locales[lang]?.[key] || this.locales[this.default]?.[key]
        )
        .find((a) => a) ||
      options?.fallback ||
      _.last(keys);

    translation = translation.replace(
      new RegExp("{{domain}}", "gm"),
      config.get<string>("server.domain")
    );

    for (const replacementKey of Object.keys(options?.replacements || {})) {
      const val = options.replacements[replacementKey];
      translation = translation.replace(
        new RegExp("{{" + replacementKey + "}}", "gm"),
        val
      );
    }
    return translation;
  }
}

const flattenJSON = (obj = {}, res = {}, extraKey = "") => {
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      res[extraKey + key] = obj[key];
    } else {
      flattenJSON(obj[key], res, `${extraKey}${key}.`);
    }
  }
  return res;
};
