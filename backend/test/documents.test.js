import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { buildDocument, fillTemplate, findTemplate, formatDateLv } from "../src/templates.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function withServer(run) {
  const server = await listen(createApp());
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("formatē datumu latviešu pierakstā", () => {
  assert.equal(formatDateLv("2026-11-26"), "26.11.2026.");
  assert.equal(formatDateLv(""), "");
});

test("aizstāj veidnes mainīgos", () => {
  const text = fillTemplate("Sveiks, {vards} {uzvards}.", {
    vards: "Jānis",
    uzvards: "Bērziņš",
  });
  assert.equal(text, "Sveiks, Jānis Bērziņš.");
});

test("priekšskatījums nāk no API", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/documents/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        templateId: "iesniegums",
        vards: "Anna",
        uzvards: "Kalniņa",
        iestade: "Rīgas dome",
        datums: "2026-11-26",
        saturs: "Lūdzu izskatīt jautājumu.",
      }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.label, "Iesniegums");
    assert.match(body.text, /IESNIEGUMS/);
    assert.match(body.text, /Anna Kalniņa/);
    assert.match(body.text, /26\.11\.2026\./);
    assert.equal(body.lines[0].kind, "title");
  });
});

test("PDF tiek atgriezts kā fails", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/documents/pdf`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        templateId: "akts",
        vards: "Jānis",
        uzvards: "Ozols",
        iestade: "Pārvalde",
        datums: "2026-01-05",
        saturs: "Konstatēts, ka dokuments ir sagatavots.",
      }),
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /application\/pdf/);
    const disposition = response.headers.get("content-disposition") || "";
    const encodedName = /filename\*=UTF-8''([^;]+)/.exec(disposition)?.[1] ?? "";
    assert.equal(decodeURIComponent(encodedName), "Akts_Jānis_Ozols.pdf");
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
    assert.ok(bytes.length > 1000);
  });
});

test("noraida nezināmu veidni", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/documents/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId: "cits", vards: "A" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /veidne/);
  });
});

test("veidņu saraksts nesatur veidnes tekstu", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/templates`);
    const body = await response.json();
    assert.deepEqual(
      body.map((item) => item.id),
      ["iesniegums", "atbilde", "akts"],
    );
    assert.equal("body" in body[0], false);
  });

  const document = buildDocument(findTemplate("akts"), {
    vards: "",
    uzvards: "",
    iestade: "",
    datums: "",
    saturs: "",
  });
  assert.match(document.text, /AKTS/);
});
