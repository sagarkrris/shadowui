import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RESUME_UPLOAD_LIMIT_BYTES,
  decodeResumeUploadRequest,
  extractResumeTextFromBuffer,
  getResumeFileKind,
} from "../lib/resumeExtract.mjs";

const SAMPLE_PDF = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 72 >>
stream
BT /F1 24 Tf 100 700 Td (Java Spring Boot Resume) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000363 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
433
%%EOF`;

test("detects supported resume file kinds by extension or mime type", () => {
  assert.equal(getResumeFileKind({ fileName: "sagar-resume.pdf" }), "pdf");
  assert.equal(getResumeFileKind({ fileName: "resume.DOCX" }), "docx");
  assert.equal(getResumeFileKind({ fileName: "profile.markdown" }), "text");
  assert.equal(getResumeFileKind({ fileName: "upload", mimeType: "application/pdf" }), "pdf");
  assert.equal(getResumeFileKind({ fileName: "upload", mimeType: "text/plain" }), "text");
  assert.equal(getResumeFileKind({ fileName: "resume.doc" }), "doc");
  assert.equal(getResumeFileKind({ fileName: "resume.png", mimeType: "image/png" }), null);
});

test("extracts plain text resumes from text and markdown buffers", async () => {
  const text = await extractResumeTextFromBuffer({
    buffer: Buffer.from("Java, Spring Boot, React, SQL"),
    fileName: "resume.md",
  });

  assert.equal(text, "Java, Spring Boot, React, SQL");
});

test("extracts resume text from a PDF buffer", async () => {
  const text = await extractResumeTextFromBuffer({
    buffer: Buffer.from(SAMPLE_PDF),
    fileName: "resume.pdf",
  });

  assert.match(text, /Java Spring Boot Resume/);
});

test("extracts resume text from a DOCX buffer", async () => {
  const buffer = await readFile("node_modules/mammoth/test/test-data/single-paragraph.docx");
  const text = await extractResumeTextFromBuffer({
    buffer,
    fileName: "resume.docx",
  });

  assert.match(text, /Walking on imported air/);
});

test("rejects legacy DOC resumes with a clear next step", async () => {
  await assert.rejects(
    () => extractResumeTextFromBuffer({ buffer: Buffer.from("legacy"), fileName: "resume.doc" }),
    /DOCX, PDF, TXT, or paste/i,
  );
});

test("decodes valid upload requests and rejects unsafe payloads", () => {
  const decoded = decodeResumeUploadRequest({
    fileName: "resume.txt",
    mimeType: "text/plain",
    fileBase64: Buffer.from("Java").toString("base64"),
  });

  assert.equal(decoded.ok, true);
  assert.equal(decoded.value.kind, "text");
  assert.equal(decoded.value.buffer.toString("utf8"), "Java");

  const tooLarge = decodeResumeUploadRequest({
    fileName: "resume.pdf",
    mimeType: "application/pdf",
    fileBase64: Buffer.alloc(RESUME_UPLOAD_LIMIT_BYTES + 1).toString("base64"),
  });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.status, 413);

  const invalid = decodeResumeUploadRequest({
    fileName: "resume.pdf",
    mimeType: "application/pdf",
    fileBase64: "not valid base64!!!",
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 400);
});
