import { Router } from "express";
import { Ctx } from "#src/services/utils";
import InternalAdapter from "./internal";
import multer from "multer";

const multerUpload = multer({ storage: multer.memoryStorage() });

export default function createInternalRoutes(adapter: InternalAdapter): Router {
  const router = Router();

  /**
   * Upload document PDF to signing session
   * POST /api/signing-sessions/internal/upload/:documentId
   */
  router.post(
    "/upload/:documentId",
    multerUpload.single("file") as any,
    async (req, res) => {
      try {
        const { documentId } = req.params;
        const pdfBuffer = req.file?.buffer;

        if (!pdfBuffer) {
          return res.status(400).json({ error: "No file provided" });
        }

        await adapter.uploadDocument(documentId, pdfBuffer);

        res.json({ success: true, documentId });
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * Get signing session by token
   * GET /api/signing-sessions/internal/session/:token
   */
  router.get("/session/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const session = await adapter.getSigningSessionByToken(token);

      res.json(session);
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(404).json({ error: error.message });
    }
  });

  /**
   * Sign document
   * POST /api/signing-sessions/internal/sign/:token
   * Body: { signatureBase64: string, metadata?: any }
   */
  router.post("/sign/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { signatureBase64, metadata } = req.body;

      if (!signatureBase64) {
        return res.status(400).json({ error: "Signature required" });
      }

      const signedPdfBuffer = await adapter.signDocument(
        token,
        signatureBase64,
        metadata
      );

      // Return the signed PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="signed_document.pdf"'
      );
      res.send(signedPdfBuffer);
    } catch (error) {
      console.error("Error signing document:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Mark session as viewed
   * POST /api/signing-sessions/internal/view/:token
   */
  router.post("/view/:token", async (req, res) => {
    try {
      const { token } = req.params;
      await adapter.markAsViewed(token);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking as viewed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Request verification code
   * POST /api/signing-sessions/internal/request-code/:token
   */
  router.post("/request-code/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const ctx = Ctx.get(req)?.context;
      await adapter.requestVerificationCode(ctx, token);

      res.json({ success: true });
    } catch (error) {
      console.error("Error requesting code:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Verify code
   * POST /api/signing-sessions/internal/verify-code/:token
   * Body: { code: string }
   */
  router.post("/verify-code/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Code required" });
      }

      const isValid = await adapter.verifyCode(token, code);

      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Cancel signing session
   * POST /api/signing-sessions/internal/cancel/:token
   */
  router.post("/cancel/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { reason } = req.body;

      await adapter.cancelSession(token, reason);

      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Download signed document
   * GET /api/signing-sessions/internal/download/:documentId
   */
  router.get("/download/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      const signedPdfBuffer = await adapter.downloadSignedDocument(documentId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="signed_document.pdf"'
      );
      res.send(signedPdfBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(404).json({ error: error.message });
    }
  });

  return router;
}
