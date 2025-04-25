import sharp from "sharp";
import { cleanFiles, getTmpFile } from "../service";

export type ThumbnailResult = {
  path: string;
  width: number;
  height: number;
  type: string;
  size: number;
};

export async function generatePreview(
  inputs: (Buffer | string)[],
  options: {
    width: number;
    height: number;
  } = {
    width: 400,
    height: 250,
  }
): Promise<{
  output: ThumbnailResult[];
  done: boolean;
  error?: string;
}> {
  const output: ThumbnailResult[] = [];

  for (const inputBuffer of inputs) {
    let result: sharp.OutputInfo;
    const outputPath = getTmpFile();
    try {
      const inputMetadata = await sharp(inputBuffer).metadata();
      const outputFormat = computeNewFormat(inputMetadata, options);

      result = await sharp(inputBuffer)
        .rotate()
        .resize(outputFormat)
        .toFile(outputPath);
      output.push({
        path: outputPath,
        width: result.width,
        height: result.height,
        type: "image/png",
        size: result.size,
      });
    } catch (error) {
      cleanFiles([outputPath]);
      throw Error("Can't resize thumnail with Sharp");
    }
  }

  return {
    output,
    done: true,
  };
}

function computeNewFormat(
  inputMetadata: sharp.Metadata,
  options?: {
    width: number;
    height: number;
  }
): { width: number; height: number } {
  const maxOutputWidth = options?.width || 600;
  const maxOutputHeight = options?.height || 400;
  const inputWidth = inputMetadata.width;
  const inputHeight = inputMetadata.height;
  const scale = Math.max(
    inputWidth / maxOutputWidth,
    inputHeight / maxOutputHeight
  );
  return {
    width: Math.round(inputWidth / scale),
    height: Math.round(inputHeight / scale),
  };
}
