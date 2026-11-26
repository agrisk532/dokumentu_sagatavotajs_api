import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { contentDisposition, renderDocumentPdf } from "./pdf.js";
import { buildDocument, buildPdfFilename, templates } from "./templates.js";
import { readDocumentRequest } from "./validate.js";

const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "frontend",
  "dist",
);

function route(handler) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/templates", (_req, res) => {
    res.json(
      templates.map(({ id, label, description }) => ({
        id,
        label,
        description,
      })),
    );
  });

  app.post(
    "/api/documents/preview",
    route((req, res) => {
      const { template, input } = readDocumentRequest(req.body);
      const document = buildDocument(template, input);
      res.json({
        templateId: document.templateId,
        label: document.label,
        text: document.text,
        lines: document.lines,
      });
    }),
  );

  app.post(
    "/api/documents/pdf",
    route(async (req, res) => {
      const { template, input } = readDocumentRequest(req.body);
      const document = buildDocument(template, input);
      const pdf = await renderDocumentPdf(document.lines);
      const filename = buildPdfFilename(document.label, document.values);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", contentDisposition(filename));
      res.send(pdf);
    }),
  );

  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ error: "Nederīgs JSON." });
      return;
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
      error: status >= 500 ? "Neizdevās apstrādāt pieprasījumu." : error.message,
    });
  });

  return app;
}
