// const path = require("path");

import { type Config } from "next-i18n-router/dist/types";

const i18nConfig:Config = {
  locales: ["cn", "en"],
  defaultLocale: "en",
  localeDetector: false,
  prefixDefault: false,
  // localePath: path.resolve("./public/locales"),
};

export default i18nConfig;
