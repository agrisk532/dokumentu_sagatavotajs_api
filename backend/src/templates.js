export const PLACEHOLDERS = ["vards", "uzvards", "iestade", "datums", "saturs"];

export const templates = [
  {
    id: "iesniegums",
    label: "Iesniegums",
    description: "Oficiāls iesniegums iestādei ar lūgumu izskatīt jautājumu.",
    body: `IESNIEGUMS

{iestade}

{datums}

Iesniedzējs: {vards} {uzvards}

{saturs}

Lūdzu izskatīt šo iesniegumu un sniegt atbildi normatīvajos aktos noteiktajā termiņā.

Ar cieņu
{vards} {uzvards}`,
  },
  {
    id: "atbilde",
    label: "Atbildes vēstule",
    description: "Atbilde uz saņemtu iesniegumu vai informācijas pieprasījumu.",
    body: `ATBILDES VĒSTULE

{iestade}

{datums}

Sagatavotājs: {vards} {uzvards}

{saturs}

Šī vēstule sagatavota kā atbilde uz saņemto pieprasījumu. Ja nepieciešams precizējums, lūdzam sazināties ar norādīto iestādi.

Ar cieņu
{vards} {uzvards}
{iestade}`,
  },
  {
    id: "akts",
    label: "Akts",
    description: "Akts par konstatētajiem apstākļiem un to fiksēšanu.",
    body: `AKTS

Datums: {datums}
Iestāde: {iestade}
Sastādītājs: {vards} {uzvards}

{saturs}

Akts sastādīts, pamatojoties uz konstatētajiem apstākļiem.

Sastādītājs
{vards} {uzvards}`,
  },
];

export function findTemplate(templateId) {
  return templates.find((item) => item.id === templateId) ?? null;
}

export function fillTemplate(template, values) {
  const filled = template.replace(/\{(vards|uzvards|iestade|datums|saturs)\}/g, (_, key) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });

  return filled
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatDateLv(isoDate) {
  if (!isoDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  return `${match[3]}.${match[2]}.${match[1]}.`;
}

const TITLE_LETTERS = /[A-ZĀČĒĢĪĶĻŅŠŪŽ]/;

export function classifyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return "spacer";

  const hasLetter = TITLE_LETTERS.test(trimmed);
  const isHeading =
    hasLetter &&
    trimmed === trimmed.toLocaleUpperCase("lv-LV") &&
    trimmed.length <= 48 &&
    !trimmed.includes(":");

  return isHeading ? "title" : "text";
}

export function buildDocument(template, input) {
  const values = {
    vards: input.vards.trim(),
    uzvards: input.uzvards.trim(),
    iestade: input.iestade.trim(),
    datums: formatDateLv(input.datums.trim()),
    saturs: input.saturs.trim(),
  };
  const text = fillTemplate(template.body, values);
  const lines = text.split("\n").map((lineText) => ({
    kind: classifyLine(lineText),
    text: lineText,
  }));

  return {
    templateId: template.id,
    label: template.label,
    text,
    lines,
    values,
  };
}

function fileSlug(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .slice(0, 40);
}

export function buildPdfFilename(templateLabel, values) {
  const parts = [templateLabel, values.vards, values.uzvards].map(fileSlug).filter(Boolean);
  return `${parts.join("_") || "dokuments"}.pdf`;
}
