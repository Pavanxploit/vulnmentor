/**
 * Shared CSV encoding for every VulnMentor export.
 *
 * Quoting a field satisfies RFC 4180 parsing but does not stop a spreadsheet
 * from executing it: Excel, LibreOffice, and Google Sheets strip the surrounding
 * quotes during import and then evaluate any cell whose text begins with a
 * formula trigger. VulnMentor exports carry student-authored text (evidence
 * notebooks, display names) straight into an instructor's spreadsheet, so a
 * student could otherwise hand an instructor a payload like
 * `=cmd|'/c calc.exe'!A1` and have it run on open.
 *
 * Prefixing a single quote forces the cell to text. The apostrophe stays in the
 * data when the file is parsed by a program rather than a spreadsheet, which is
 * the accepted trade-off for this mitigation (OWASP: CSV Injection).
 */

const formulaTriggers = /^[=+\-@\t\r]/;

export function csvEscape(value: string | null | undefined) {
  const normalized = String(value ?? "");
  const guarded = formulaTriggers.test(normalized) ? `'${normalized}` : normalized;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function csvRow(values: Array<string | null | undefined>) {
  return values.map(csvEscape).join(",");
}

export function csvDocument(rows: Array<Array<string | null | undefined>>) {
  return rows.map(csvRow).join("\n");
}
