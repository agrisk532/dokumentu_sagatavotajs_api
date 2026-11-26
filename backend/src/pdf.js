import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const fontsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fonts");
const regularFont = path.join(fontsDir, "SourceSerif4-Regular.ttf");
const boldFont = path.join(fontsDir, "SourceSerif4-Bold.ttf");

export function renderDocumentPdf(lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 54, left: 48, right: 48 },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("body", regularFont);
    doc.registerFont("body-bold", boldFont);
    doc.font("body").fontSize(12).fillColor("#1a1a1a");

    for (const line of lines) {
      if (line.kind === "spacer") {
        doc.moveDown(0.7);
        continue;
      }

      if (line.kind === "title") {
        doc.font("body-bold").fontSize(16).text(line.text, { align: "center", characterSpacing: 1.2 });
        const y = doc.y + 3;
        const center = doc.page.width / 2;
        doc
          .save()
          .lineWidth(0.8)
          .strokeColor("#1a1a1a")
          .moveTo(center - 28, y)
          .lineTo(center + 28, y)
          .stroke()
          .moveTo(center - 28, y + 3)
          .lineTo(center + 28, y + 3)
          .stroke()
          .restore();
        doc.y = y + 16;
        doc.font("body").fontSize(12);
        continue;
      }

      doc.font("body").fontSize(12).text(line.text || " ", { align: "left", lineGap: 2 });
    }

    doc.end();
  });
}

export function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]+/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
