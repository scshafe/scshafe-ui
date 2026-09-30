// axe-core over every catalog component, rendered by React into jsdom with
// the package stylesheets, in the light and the dark theme. Runs the WCAG 2.0,
// 2.1 and 2.2 A/AA rules plus axe's best practices. Rules that need a real
// layout engine or judge a whole page are off (docs/ACCESSIBILITY.md):
//   - color-contrast: jsdom does not paint; test/contrast.test.mjs computes
//     contrast from the tokens instead;
//   - region, landmark-one-main, page-has-heading-one: a component rendered on
//     its own is not a page.
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";

installDom();
const { default: axe } = await import("axe-core");
const { CATALOG, renderEntry } = await import("./support/catalog.mjs");
const { SUI_THEMES, SUI_THEME_ATTRIBUTE } = await import("@scshafe/ui/tokens");

const OPTIONS = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "page-has-heading-one": { enabled: false }
  },
  resultTypes: ["violations"]
};

for (const theme of SUI_THEMES) {
  test(`axe finds no WCAG 2.2 AA or best-practice violations (${theme} theme)`, async () => {
    document.documentElement.setAttribute(SUI_THEME_ATTRIBUTE, theme);
    const violations = [];
    let checked = 0;
    for (const entry of CATALOG) {
      const view = await render(renderEntry(entry));
      try {
        const result = await axe.run(view.container, OPTIONS);
        checked += 1;
        for (const violation of result.violations) {
          for (const node of violation.nodes) violations.push(`${entry.name}: ${violation.id} (${violation.impact}) ${node.html.slice(0, 100)}`);
        }
      } finally {
        await view.unmount();
      }
    }
    document.documentElement.removeAttribute(SUI_THEME_ATTRIBUTE);
    assert.equal(checked, CATALOG.length);
    assert.deepEqual(violations, []);
  });
}

test("the axe run detects violations (positive control)", async () => {
  const view = await render((await import("react")).createElement("button", { type: "button" }));
  try {
    const result = await axe.run(view.container, OPTIONS);
    assert.ok(result.violations.some((violation) => violation.id === "button-name"), "an unnamed button is reported");
  } finally {
    await view.unmount();
  }
});
