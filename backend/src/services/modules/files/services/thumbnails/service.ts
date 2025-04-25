import { existsSync, mkdirSync, writeFileSync } from "fs";
import { unlink } from "fs/promises";
import { v4 } from "uuid";
import { Context } from "../../../../../types";
import {
  ThumbnailResult,
  generatePreview as thumbnailsFromImages,
} from "./converters/image";
import mimes, {
  imageExtensions,
  officeExtensions,
  pdfExtensions,
  videoExtensions,
} from "./mime";
import { convertFromOffice } from "./converters/office";
import { convertFromPdf } from "./converters/pdf";
import { generateVideoPreview } from "./converters/video";

export function getMimeTypeFromArrayBuffer(arrayBuffer: Buffer) {
  const uint8arr = new Uint8Array(arrayBuffer);

  const len = 4;
  if (uint8arr.length >= len) {
    const signatureArr = new Array(len);
    for (let i = 0; i < len; i++)
      signatureArr[i] = new Uint8Array(arrayBuffer)[i].toString(16);
    const signature = signatureArr.join("").toUpperCase();

    switch (signature) {
      case "89504E47":
        return "image/png";
      case "47494638":
        return "image/gif";
      case "25504446":
        return "application/pdf";
      case "FFD8FFDB":
      case "FFD8FFE0":
        return "image/jpeg";
      case "504B0304":
        return "application/zip";
      default:
        return null;
    }
  }
  return null;
}

export function isFileType(
  fileMime: string,
  fileName: string,
  requiredExtensions: string[]
): boolean {
  const extension = fileName.split(".").pop();
  const secondaryExtensions = Object.keys(mimes).filter(
    (k) => mimes[k] === fileMime
  );
  const fileExtensions = [extension, ...secondaryExtensions];
  return fileExtensions.some((e) => requiredExtensions.includes(e));
}

export const cleanFiles = async (paths: string[]): Promise<void> => {
  for (const path of paths) {
    if (existsSync(path)) await unlink(path);
  }
};

export const getTmpFile = (suffix = ""): string => {
  const targetDir = "/tmp/";
  mkdirSync(targetDir, { recursive: true });
  return `${targetDir}${v4()}${suffix}`;
};

export const generateThumbnails = async (
  _ctx: Context,
  data: Buffer,
  mime?: string,
  name?: string
): Promise<ThumbnailResult[]> => {
  const filename = name || "document";
  const size = data.length;
  const tooBig = size > 50000000; // 50MB
  mime = mime || getMimeTypeFromArrayBuffer(data);

  if (isFileType(mime, filename, officeExtensions) && filename && !tooBig) {
    const path = getTmpFile("-" + filename);
    const images = (
      await convertFromOffice(path, {
        numberOfPages: 1,
      })
    ).output;
    await cleanFiles([path]);
    if (!images) return [];
    const thumbs = (await thumbnailsFromImages([images])).output;
    await cleanFiles([images]);
    return thumbs;
  }

  if (isFileType(mime, filename, pdfExtensions)) {
    const thumbnailPath = await convertFromPdf(data, {
      numberOfPages: 1,
    });
    const images = (await thumbnailsFromImages(thumbnailPath.output)).output;
    await cleanFiles(thumbnailPath.output);
    return images;
  }

  if (isFileType(mime, filename, imageExtensions)) {
    const images = (await thumbnailsFromImages([data])).output;
    return images;
  }

  if (isFileType(mime, filename, videoExtensions) && !tooBig) {
    try {
      const path = getTmpFile(".mp4");
      writeFileSync(path, data);
      const videoSnapshots = await generateVideoPreview([path]);
      await cleanFiles([path]);
      const images = (
        await thumbnailsFromImages(videoSnapshots.map((a) => a.path))
      ).output;
      await cleanFiles(videoSnapshots.map((a) => a.path));
      return images;
    } catch (error) {
      throw Error("failed to generate video preview");
    }
  }

  throw "Can not proccess, file type can't be defined";
};
