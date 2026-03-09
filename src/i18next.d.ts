import "react-i18next";
import type { ReactNode } from "react";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    returnNull: false;
  }

  // Fix ReactI18NextChildren not assignable to ReactNode
  export type ReactI18NextChildren = ReactNode;
}
