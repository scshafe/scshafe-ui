// A small CSS reader for the stylesheet contract tests: comments stripped,
// rules and at-rules split by brace matching (no nesting beyond at-rules).
import { readFileSync } from "node:fs";

export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

export function readStylesheet(name) {
  return readFileSync(new URL(`../../${name}`, import.meta.url), "utf8");
}

/** Parse into [{ prelude, body, rules? }]: `rules` is set for at-rule blocks. */
export function parseRules(css) {
  const source = stripComments(css);
  const rules = [];
  let index = 0;
  while (index < source.length) {
    const open = source.indexOf("{", index);
    if (open === -1) break;
    const prelude = source.slice(index, open).trim();
    let depth = 1;
    let cursor = open + 1;
    while (depth > 0 && cursor < source.length) {
      if (source[cursor] === "{") depth += 1;
      else if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    const body = source.slice(open + 1, cursor - 1);
    rules.push(prelude.startsWith("@") ? { prelude, body, rules: parseRules(body) } : { prelude, body });
    index = cursor;
  }
  return rules;
}

/** Declarations of a rule body as [property, value] pairs, in order. */
export function declarations(body) {
  return body.split(";")
    .map((part) => /^\s*([-\w]+)\s*:\s*([\s\S]+?)\s*$/.exec(part))
    .filter(Boolean)
    .map((match) => [match[1], match[2]]);
}

/** Split a selector list on top-level commas (not those inside :where(…) etc.). */
export function splitSelectors(selectorList) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of selectorList) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Every style rule, flattened out of at-rules, with the at-rule preludes it sits in. */
export function styleRules(rules, context = []) {
  return rules.flatMap((rule) => rule.rules
    ? styleRules(rule.rules, [...context, rule.prelude])
    : [{ ...rule, context }]);
}
