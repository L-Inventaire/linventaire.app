import fs from "fs";
import Framework from "../../../../platform";
import { v4 } from "uuid";
import { Context } from "../../../../types";
import { create } from "../../../rest/services/rest";
import { Files } from "../entities/files";
import {
  cleanFiles,
  generateThumbnails,
  getMimeTypeFromArrayBuffer,
} from "./thumbnails/service";

export const upload = async (ctx: Context, file: Files, data: Buffer) => {
  const key = v4();
  file.mime = file.mime || getMimeTypeFromArrayBuffer(data);

  if (file.mime === null) throw new Error("Failed to determine mime type");
  if (file.name === null) throw new Error("File name is required");
  if (!data) throw new Error("File data is required");

  const s3 = Framework.S3;
  await s3.upload(`files/${ctx.client_id}/${key}`, data);

  let hasThumbnail = true;
  try {
    const thumb = await generateThumbnails(ctx, data, file.mime, file.name);
    if (thumb.length === 0) throw new Error("Failed to generate thumbnails");
    const path = thumb[0].path;
    const buffer = fs.readFileSync(path);
    await s3.upload(`files/${ctx.client_id}/thumbnails/${key}`, buffer);
    await cleanFiles(thumb.map((t) => t.path));
  } catch (error) {
    hasThumbnail = false;
  }

  try {
    const row = await create<Files>(ctx, "files", {
      ...file,
      key,
      size: data.length,
      has_thumbnail: hasThumbnail,
      rel_unreferenced: file.rel_unreferenced || false,
    });
    if (row === null) throw new Error("Failed to create file");

    return row;
  } catch (error) {
    try {
      await s3.delete(`files/${file.client_id}/${key}`);
      if (hasThumbnail)
        await s3.delete(`files/${file.client_id}/thumbnails/${key}`);
    } catch (error) {
      console.error("Failed to clean up");
    }
    throw error;
  }
};

export const download = async (
  ctx: Context,
  file: Pick<Files, "client_id" | "key">
) => {
  if (ctx.role !== "SYSTEM" && ctx.client_id !== file.client_id) {
    throw new Error(
      `Unauthorized to download file from ${file.client_id} as ${ctx.client_id}`
    );
  }
  const s3 = Framework.S3;
  return await s3.download(`files/${file.client_id}/${file.key}`);
};

export const thumbnail = async (
  ctx: Context,
  file: Pick<Files, "client_id" | "key">
) => {
  const s3 = Framework.S3;
  return await s3.download(`files/${file.client_id}/thumbnails/${file.key}`);
};

export const deleteFile = async (
  ctx: Context,
  file: Pick<Files, "client_id" | "key">
) => {
  const s3 = Framework.S3;
  try {
    await s3.delete(`files/${file.client_id}/${file.key}`);
    await s3.delete(`files/${file.client_id}/thumbnails/${file.key}`);
  } catch (error) {
    console.error("Failed to delete file");
  }
};
