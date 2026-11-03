import { describe, expect, test } from "@jest/globals";
import { getInvoicePdfFileName, getPdfContentDisposition } from "./utils";

describe("getInvoicePdfFileName", () => {
  test("the reference is the file name", () => {
    expect(getInvoicePdfFileName({ reference: "FA-2026-0012" })).toBe(
      "FA-2026-0012.pdf"
    );
  });

  test("characters not allowed in file names are replaced", () => {
    expect(getInvoicePdfFileName({ reference: "FA/2026/12" })).toBe(
      "FA-2026-12.pdf"
    );
  });

  test("a document without reference still gets a name", () => {
    expect(getInvoicePdfFileName({ reference: "" })).toBe("document.pdf");
  });
});

describe("getPdfContentDisposition", () => {
  test("ASCII fallback and UTF-8 name", () => {
    expect(getPdfContentDisposition("Avoir-é1.pdf", "inline")).toBe(
      `inline; filename="Avoir-_1.pdf"; filename*=UTF-8''Avoir-%C3%A91.pdf`
    );
  });

  test("download", () => {
    expect(getPdfContentDisposition("FA-1.pdf", "attachment")).toBe(
      `attachment; filename="FA-1.pdf"; filename*=UTF-8''FA-1.pdf`
    );
  });
});
