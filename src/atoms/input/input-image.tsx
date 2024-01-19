import Link from "@atoms/link";
import { Info, Title } from "@atoms/text";
import { debounce } from "@features/utils/debounce";
import { stringToColor } from "@features/utils/format/strings";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { PhotographIcon } from "@heroicons/react/solid";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const InputImage = ({
  shape,
  fallback,
  onChange,
}: {
  shape?: "circle" | "square";
  fallback?: string;
  onChange: (imageBase64: string) => void;
}) => {
  const { t } = useTranslation();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setImageBase64(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useControlledEffect(() => {
    if (imageBase64) onChange(imageBase64);
  }, [imageBase64]);

  useEffect(() => {
    debounce(
      () =>
        setPhotoName(
          fallback
            ? fallback
                .split(" ")
                .map((e) => e[0].toLocaleUpperCase())
                .join("")
                .slice(0, 2)
            : ""
        ),
      {
        key: "preferences:profile:photoName",
        timeout: 1000,
        doInitialCall: false,
      }
    );
  }, [fallback]);

  return (
    <>
      <div
        style={photoName ? { backgroundColor: stringToColor(photoName) } : {}}
        className={
          "w-20 h-20 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-opacity-75 flex items-center justify-center cursor-pointer " +
          (shape === "circle" ? "rounded-full" : "rounded-md")
        }
        onClick={() => document.getElementById("profileImageInput")?.click()}
      >
        {" "}
        {imageBase64 ? (
          <img
            src={imageBase64}
            alt="Profile"
            className={
              "w-full h-full object-cover " +
              (shape === "circle" ? "rounded-full" : "rounded-md")
            }
          />
        ) : photoName ? (
          <Title>{photoName}</Title>
        ) : (
          <PhotographIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="profileImageInput"
          onChange={handleImageChange}
        />
      </div>
      {!!imageBase64 && (
        <Info noColor>
          <Link onClick={() => setImageBase64(null)} className="text-red-500">
            {t("signin.signup.removePhoto")}
          </Link>
        </Info>
      )}
      {!imageBase64 && (
        <Info noColor>
          <Link
            onClick={() =>
              document.getElementById("profileImageInput")?.click()
            }
          >
            {t("signin.signup.addPhoto")}
          </Link>
        </Info>
      )}
    </>
  );
};
