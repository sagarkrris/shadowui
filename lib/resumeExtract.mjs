export const RESUME_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;

const SUPPORTED_MIME_KINDS = new Map([
  ["text/plain", "text"],
  ["text/markdown", "text"],
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/msword", "doc"],
]);

const EXTENSION_KINDS = new Map([
  ["txt", "text"],
  ["md", "text"],
  ["markdown", "text"],
  ["pdf", "pdf"],
  ["docx", "docx"],
  ["doc", "doc"],
]);

function getExtension(fileName = "") {
  const match = String(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export function getResumeFileKind({ fileName = "", mimeType = "" } = {}) {
  const extensionKind = EXTENSION_KINDS.get(getExtension(fileName));
  if (extensionKind) return extensionKind;

  return SUPPORTED_MIME_KINDS.get(String(mimeType).toLowerCase()) || null;
}

function normalizeExtractedText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function buildUnsupportedError(fileName, mimeType) {
  const kind = getResumeFileKind({ fileName, mimeType });
  if (kind === "doc") {
    return new Error("Legacy .doc resumes are not supported yet. Please upload DOCX, PDF, TXT, or paste the resume text.");
  }

  return new Error("Unsupported resume file type. Please upload DOCX, PDF, TXT, Markdown, or paste the resume text.");
}

function installPdfTextExtractionPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
        this.is2D = true;
        this.isIdentity = true;
      }

      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      translateSelf() { return this; }
      scaleSelf() { return this; }
      rotateSelf() { return this; }
      invertSelf() { return this; }
      transformPoint(point = {}) { return point; }
    };
  }

  if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = class ImageData {
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D {};
  }
}

export async function extractResumeTextFromBuffer({ buffer, fileName = "", mimeType = "" } = {}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Resume file payload is missing.");
  }

  const kind = getResumeFileKind({ fileName, mimeType });
  if (!kind || kind === "doc") {
    throw buildUnsupportedError(fileName, mimeType);
  }

  if (buffer.byteLength > RESUME_UPLOAD_LIMIT_BYTES) {
    throw new Error("Resume file is too large. Please upload a file under 5 MB or paste the key resume text.");
  }

  if (kind === "text") {
    return normalizeExtractedText(buffer.toString("utf8"));
  }

  if (kind === "pdf") {
    installPdfTextExtractionPolyfills();
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return normalizeExtractedText(result?.text);
    } finally {
      await parser.destroy?.();
    }
  }

  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.default.extractRawText({ buffer });
    return normalizeExtractedText(result?.value);
  }

  throw buildUnsupportedError(fileName, mimeType);
}

function cleanBase64Payload(value) {
  return String(value || "")
    .replace(/^data:[^;]+;base64,/i, "")
    .replace(/\s/g, "");
}

export function decodeResumeUploadRequest(body = {}) {
  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim();
  const kind = getResumeFileKind({ fileName, mimeType });

  if (!fileName) {
    return { ok: false, status: 400, error: "Resume file name is required." };
  }

  if (!kind) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported resume file type. Please upload DOCX, PDF, TXT, Markdown, or paste the resume text.",
    };
  }

  if (kind === "doc") {
    return {
      ok: false,
      status: 415,
      error: "Legacy .doc resumes are not supported yet. Please upload DOCX, PDF, TXT, or paste the resume text.",
    };
  }

  const fileBase64 = cleanBase64Payload(body.fileBase64);
  if (!fileBase64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(fileBase64) || fileBase64.length % 4 !== 0) {
    return { ok: false, status: 400, error: "Invalid resume file payload." };
  }

  const estimatedBytes = Math.floor((fileBase64.length * 3) / 4) - (fileBase64.endsWith("==") ? 2 : fileBase64.endsWith("=") ? 1 : 0);
  if (estimatedBytes > RESUME_UPLOAD_LIMIT_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "Resume file is too large. Please upload a file under 5 MB or paste the key resume text.",
    };
  }

  const buffer = Buffer.from(fileBase64, "base64");
  if (!buffer.byteLength) {
    return { ok: false, status: 400, error: "Resume file payload is empty." };
  }

  return {
    ok: true,
    value: {
      buffer,
      fileName,
      mimeType,
      kind,
      bytes: buffer.byteLength,
    },
  };
}
