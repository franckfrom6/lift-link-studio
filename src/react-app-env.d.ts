// This file fixes the react-i18next type augmentation that breaks
// Radix UI components by overriding React's children type.
// See: https://github.com/i18next/react-i18next/issues/1587

import "react";

declare module "react" {
  // Reset PropsWithChildren to use standard ReactNode
  // instead of ReactI18NextChildren from react-i18next
  type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };
}
