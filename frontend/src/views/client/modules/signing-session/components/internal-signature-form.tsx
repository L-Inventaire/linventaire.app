import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Input } from "@atoms/input/input-text";
import InputCode from "@atoms/input/input-code";
import { SigningSession } from "@features/documents/types";
import { InvoiceLine } from "@features/invoices/types/types";
import {
  CheckIcon,
  ChevronDownIcon,
  PencilIcon,
} from "@heroicons/react/16/solid";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { fetchServer } from "@features/utils/fetch-server";

interface InternalSignatureFormProps {
  signingSession: SigningSession;
  options: (InvoiceLine & { _index: number })[];
  onOptionChange: (optionId: string, value: boolean) => void;
  onSigned: () => void;
}

type Step = "form" | "otp" | "success";

export const InternalSignatureForm = ({
  signingSession,
  options,
  onOptionChange,
  onSigned,
}: InternalSignatureFormProps) => {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState(signingSession.recipient_email || "");
  const [hasReadDocument, setHasReadDocument] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const [isSignatureExpanded, setIsSignatureExpanded] = useState(false);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const [tempSignatureData, setTempSignatureData] = useState<string | null>(
    null
  );

  // Restore signature if it was temporarily saved
  useEffect(() => {
    if (tempSignatureData && sigCanvas.current) {
      sigCanvas.current.fromDataURL(tempSignatureData);
    }
  }, [tempSignatureData]);

  // Timer for resend button
  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [step, resendTimer]);

  // Request OTP and move to verification step
  const handleSubmitForm = async () => {
    if (!hasReadDocument) {
      toast.error("Veuillez confirmer avoir lu le document");
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error("Veuillez signer le document");
      return;
    }

    setIsLoading(true);
    try {
      // Capture signature data before moving to next step
      const signatureBase64 = sigCanvas.current!.toDataURL();
      setSignatureData(signatureBase64);

      // Call the backend to send the verification code
      const response = await fetchServer(
        `/api/signing-sessions/v1/${signingSession.id}/request-verification`,
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du code");
      }

      setStep("otp");
      setResendTimer(10);
      setCanResend(false);
      toast.success("Un code de vérification a été envoyé à votre email");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du code de vérification");
      console.error("Request verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and sign document
  const handleVerifyOtp = async (code: string) => {
    // Prevent multiple submissions
    if (otpLoading) {
      return;
    }

    if (!signatureData) {
      toast.error("Signature manquante");
      return;
    }

    // Check if already signed
    if (signingSession.state === "signed") {
      toast.error("Ce document a déjà été signé");
      return;
    }

    setOtpLoading(true);
    try {
      // Verify code and sign in one call
      const response = await fetchServer(
        `/api/signing-sessions/v1/${signingSession.id}/verify-and-sign`,
        {
          method: "POST",
          body: JSON.stringify({
            code,
            signatureBase64: signatureData,
            options,
            metadata: {
              userAgent: navigator.userAgent,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Code invalide");
      }

      setStep("success");
      toast.success("Document signé avec succès !");
      onSigned();
    } catch (error: any) {
      toast.error(
        error.message || "Code invalide ou erreur lors de la signature"
      );
      console.error("Verify and sign error:", error);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    setIsLoading(true);
    setCanResend(false);
    setResendTimer(10);
    try {
      const response = await fetchServer(
        `/api/signing-sessions/v1/${signingSession.id}/request-verification`,
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du code");
      }

      toast.success("Code renvoyé avec succès");
    } catch (_error) {
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setHasSignature(false);
    setTempSignatureData(null);
  };

  // Save signature data on each stroke to prevent loss on scroll
  const handleSignatureEnd = () => {
    const isEmpty = sigCanvas.current?.isEmpty();
    setHasSignature(!isEmpty);
    if (!isEmpty && sigCanvas.current) {
      setTempSignatureData(sigCanvas.current.toDataURL());
    }
  };

  // Success state
  if (step === "success" || signingSession.state === "signed") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">
            Document signé !
          </h3>
          <p className="text-sm text-gray-500 text-center">
            Le document signé vous sera envoyé par email.
          </p>
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <div className="flex flex-col h-full p-4">
        <h3 className="font-medium text-sm mb-4">Vérification par email</h3>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            Un code de vérification a été envoyé à <strong>{email}</strong>
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Entrez le code à 8 chiffres reçu par email :
        </p>

        <div className="mb-4">
          <InputCode onComplete={handleVerifyOtp} loading={otpLoading} />
        </div>

        <div className="mb-2">
          <Button
            theme="invisible"
            className="w-full"
            onClick={handleResendCode}
            disabled={!canResend || isLoading}
          >
            {canResend
              ? "Envoyer de nouveau"
              : `Renvoyer le code (${resendTimer}s)`}
          </Button>
        </div>

        <div className="m-2">
          <Button
            theme="invisible"
            className="w-full"
            onClick={() => setStep("form")}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Main form step
  return (
    <div className="flex flex-col h-full">
      {/* Mobile collapsed state - button only */}
      <div className="md:hidden">
        {!isSignatureExpanded ? (
          <div className="p-4">
            <Button
              className="w-full"
              onClick={() => setIsSignatureExpanded(true)}
              icon={(p) => <PencilIcon {...p} />}
            >
              Démarrer la signature
            </Button>
          </div>
        ) : (
          <>
            {/* Collapse button when expanded */}
            <div className="p-2 border-b border-gray-200 flex justify-center">
              <button
                onClick={() => setIsSignatureExpanded(false)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 py-2"
              >
                <ChevronDownIcon className="w-4 h-4" />
                <span>Réduire</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-medium text-sm mb-4">
                Signature du document
              </h3>

              {/* Optional lines */}
              {options.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-medium text-sm mb-2">Options</h4>
                  <div className="flex flex-col gap-2">
                    {options.map((option) => (
                      <Checkbox
                        key={option._id}
                        disabled={
                          signingSession.state === "signed" ||
                          signingSession.state === "sent"
                        }
                        onChange={(value) =>
                          onOptionChange(option._id || "", value)
                        }
                        label={option.name}
                        size="sm"
                        value={option.optional_checked}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  disabled
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Un code de vérification sera envoyé à cette adresse
                </p>
              </div>

              {/* Signature canvas */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 rounded bg-white ${
                    !hasSignature ? "border-gray-300" : "border-green-400"
                  }`}
                  style={{ touchAction: "none" }}
                >
                  <SignatureCanvas
                    ref={sigCanvas}
                    onEnd={handleSignatureEnd}
                    canvasProps={{
                      className: "w-full h-32 touch-none",
                      style: {
                        width: "100%",
                        height: "128px",
                        touchAction: "none",
                      },
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Effacer la signature
                  </button>
                  {!hasSignature && (
                    <span className="text-xs text-gray-500">
                      Signature obligatoire
                    </span>
                  )}
                </div>
              </div>

              {/* Read confirmation checkbox */}
              <div className="mb-4">
                <Checkbox
                  label="J'ai lu et j'accepte le contenu de ce document"
                  value={hasReadDocument}
                  onChange={(value) => setHasReadDocument(value)}
                  size="sm"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="p-4 border-t border-gray-200">
              <Button
                className="w-full"
                onClick={handleSubmitForm}
                disabled={isLoading || !hasReadDocument || !hasSignature}
                icon={(p) => <CheckIcon {...p} />}
              >
                {isLoading ? "Envoi en cours..." : "Signer le document"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Desktop view - always expanded */}
      <div className="hidden md:flex md:flex-col md:h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-medium text-sm mb-4">Signature du document</h3>

          {/* Optional lines */}
          {options.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h4 className="font-medium text-sm mb-2">Options</h4>
              <div className="flex flex-col gap-2">
                {options.map((option) => (
                  <Checkbox
                    key={option._id}
                    disabled={
                      signingSession.state === "signed" ||
                      signingSession.state === "sent"
                    }
                    onChange={(value) =>
                      onOptionChange(option._id || "", value)
                    }
                    label={option.name}
                    size="sm"
                    value={option.optional_checked}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              disabled
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Un code de vérification sera envoyé à cette adresse
            </p>
          </div>

          {/* Signature canvas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 rounded bg-white ${
                !hasSignature ? "border-gray-300" : "border-green-400"
              }`}
              style={{ touchAction: "none" }}
            >
              <SignatureCanvas
                ref={sigCanvas}
                onEnd={handleSignatureEnd}
                canvasProps={{
                  className: "w-full h-32 touch-none",
                  style: {
                    width: "100%",
                    height: "128px",
                    touchAction: "none",
                  },
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Effacer la signature
              </button>
              {!hasSignature && (
                <span className="text-xs text-gray-500">
                  Signature obligatoire
                </span>
              )}
            </div>
          </div>

          {/* Read confirmation checkbox */}
          <div className="mb-4">
            <Checkbox
              label="J'ai lu et j'accepte le contenu de ce document"
              value={hasReadDocument}
              onChange={(value) => setHasReadDocument(value)}
              size="sm"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            className="w-full"
            onClick={handleSubmitForm}
            disabled={isLoading || !hasReadDocument || !hasSignature}
            icon={(p) => <CheckIcon {...p} />}
          >
            {isLoading ? "Envoi en cours..." : "Signer le document"}
          </Button>
        </div>
      </div>
    </div>
  );
};
