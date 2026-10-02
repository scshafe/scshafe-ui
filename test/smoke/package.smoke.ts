// Packed-install TypeScript smoke: typechecked in the consumer against the
// shipped .d.ts files (scripts/check-pack-install.mjs; the master smoke takes
// .ts, so the components are built with createElement rather than JSX).
import { createElement } from "react";
import { Stack, Button, Status, EmptyState, type StackProps } from "@scshafe/ui";
import { SuiProviders, createSuiStore, Toasts, type SuiProvidersProps, type CreateSuiStoreOptions } from "@scshafe/ui/state";
import { SUI_TOKENS, SUI_TOKEN_NAMES, type SuiToken } from "@scshafe/ui/tokens";
import { buildWebApp, type BuildWebAppOptions } from "@scshafe/ui/build";
import { useIdentity } from "@scshafe/ui/identity";

const options: CreateSuiStoreOptions = { slices: [Toasts] };
const store = createSuiStore(options);
const props: SuiProvidersProps = { store, children: null };
const first: SuiToken | undefined = SUI_TOKENS[0];
const names: readonly string[] = SUI_TOKEN_NAMES;
const stack: StackProps = { gap: "md", children: null };
const buildOptions: BuildWebAppOptions = { entry: "src/main.tsx", outfile: "dist/app.js" };
// @ts-expect-error unknown spacing token
const badStack: StackProps = { gap: "huge", children: null };

export function App() {
  return createElement(
    SuiProviders,
    props,
    createElement(
      Stack,
      stack,
      createElement(Status, { state: "running" }),
      createElement(Button, { label: "Save" }),
      createElement(EmptyState, { message: "Nothing here yet." })
    )
  );
}
void first; void names; void buildWebApp; void buildOptions; void useIdentity; void badStack;
