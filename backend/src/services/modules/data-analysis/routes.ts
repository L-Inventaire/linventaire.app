import { create } from "#src/services/rest/services/rest";
import { Ctx } from "#src/services/utils";
import config from "config";
import { Router } from "express";
import { DataAnalysisDefinition } from "./entities/data-analysis";
import platform from "#src/platform/index";
import { createRateLimiter } from "#src/services/rate-limiter";

// Validation helper functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, "");
};

// Rate limiter: 5 submissions per hour per IP
let contactFormRateLimiter: any = null;

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get("/collect", async (req, res) => {
    const ctx = Ctx.get(req)!.context;
    const email = req.query.email as string;
    const external_id = req.query.external_id as string;

    await create(
      { ...ctx, id: "-", role: "SYSTEM" },
      DataAnalysisDefinition.name,
      {
        email: req.query.email,
        external_id: req.query.external_id,
      }
    );

    // Envoyer un email de notification à contact@linventaire.app
    const emailBody = `
Nouvelle collecte de données (redirection Typeform)

Email: ${email}
ID externe: ${external_id}
    `.trim();

    await platform.PushEMail.push(ctx, "contact@linventaire.app", emailBody, {
      subject: "[Data Collection] Nouvelle soumission",
    });

    const url = new URL(config.get<string>("data-analysis.typeform-url"));
    url.searchParams.append("email", email);
    url.searchParams.append("external_id", external_id);

    res.redirect(url.toString());
  });

  router.post("/collect", async (req, res) => {
    try {
      const ctx = Ctx.get(req)!.context;
      const { email, external_id, name, subject, message, type } = req.body;

      // Initialize rate limiter if not already done
      if (!contactFormRateLimiter) {
        contactFormRateLimiter = await createRateLimiter("contact-form", {
          points: 5, // 5 submissions
          duration: 3600, // per hour (3600 seconds)
        });
      }

      // Rate limiting check
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      try {
        await contactFormRateLimiter.consume(clientIp);
      } catch (rateLimiterRes) {
        return res.status(429).json({
          success: false,
          error: "Too many requests",
          message: "Please wait before submitting another form",
        });
      }

      // Validation des champs obligatoires
      const errors: Record<string, string> = {};

      if (!email) {
        errors.email = "Email is required";
      } else if (!isValidEmail(email)) {
        errors.email = "Invalid email format";
      }

      if (!external_id) {
        errors.external_id = "External ID is required";
      } else if (!isValidUUID(external_id)) {
        errors.external_id = "Invalid UUID format";
      }

      if (!name) {
        errors.name = "Name is required";
      }

      if (!subject) {
        errors.subject = "Subject is required";
      }

      if (!message) {
        errors.message = "Message is required";
      } else if (message.length > 5000) {
        errors.message = "Message is too long (max 5000 characters)";
      }

      if (!type) {
        errors.type = "Type is required";
      } else if (type !== "contact_form") {
        errors.type = "Invalid type (must be 'contact_form')";
      }

      // Si des erreurs de validation existent, retourner 400
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: errors,
        });
      }

      // Sanitize inputs
      const sanitizedData = {
        email: email.trim(),
        external_id: external_id.trim(),
        name: sanitizeString(name),
        subject: sanitizeString(subject),
        message: sanitizeString(message),
        type: type.trim(),
      };

      // Sauvegarder dans la base de données
      await create(
        { ...ctx, id: "-", role: "SYSTEM" },
        DataAnalysisDefinition.name,
        sanitizedData
      );

      // Envoyer un email de notification à contact@linventaire.app
      const emailBody = `
Nouvelle soumission de formulaire de contact

Nom: ${sanitizedData.name}
Email: ${sanitizedData.email}
Sujet: ${sanitizedData.subject}

Message:
${sanitizedData.message}

---
ID externe: ${sanitizedData.external_id}
Type: ${sanitizedData.type}
      `.trim();

      await platform.PushEMail.push(ctx, "contact@linventaire.app", emailBody, {
        subject: `[Contact Form] ${sanitizedData.subject}`,
      });

      return res.status(200).json({
        success: true,
        message: "Contact form submitted successfully",
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });
};
