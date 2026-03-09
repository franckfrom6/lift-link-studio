// Fix react-i18next augmenting React.FunctionComponent children type
// which conflicts with Radix UI component types
import "react";

declare module "react" {
  // Override the augmented children type back to ReactNode
  interface FunctionComponent {
    (props: any): React.ReactElement<any, any> | null;
  }
}
