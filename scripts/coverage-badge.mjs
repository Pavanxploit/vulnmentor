import { readFileSync, writeFileSync } from "node:fs";
const { lines } = JSON.parse(
  readFileSync("coverage/coverage-summary.json", "utf8"),
).total;
const file = "docs/coverage.json";
const output =
  JSON.stringify(
    {
      schemaVersion: 1,
      label: "API + lib line coverage",
      message: Math.round(lines.pct) + "%",
      color: "blue",
    },
    null,
    2,
  ) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(file, "utf8") !== output)
    throw new Error(
      "Regenerate docs/coverage.json with node scripts/coverage-badge.mjs",
    );
} else {
  writeFileSync(file, output);
}
