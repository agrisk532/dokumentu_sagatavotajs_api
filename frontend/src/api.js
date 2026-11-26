async function readError(response) {
  try {
    const data = await response.json();
    if (data && typeof data.error === "string" && data.error) return data.error;
  } catch {
    // The body is not JSON.
  }
  return "Serveris neatbildēja. Mēģiniet vēlreiz.";
}

export async function fetchTemplates() {
  const response = await fetch("/api/templates");
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Serveris neatgrieza dokumenta veidnes.");
  }
  return data;
}

export async function fetchPreview(payload) {
  const response = await fetch("/api/documents/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

function filenameFromDisposition(header) {
  if (!header) return "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return "";
    }
  }
  const plain = /filename="([^"]+)"/i.exec(header)?.[1];
  return plain || "";
}

export async function downloadPdf(payload) {
  const response = await fetch("/api/documents/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));

  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("Content-Disposition")) || "dokuments.pdf";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
