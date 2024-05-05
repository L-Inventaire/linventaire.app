import Env from "@config/environment";
import { AuthJWT } from "@features/auth/jwt";
import { Files } from "../types/types";

export class FilesApiClient {
  static upload = async (
    client_id: string,
    entity: Partial<Files>,
    file: File,
    progressCallback?: (progress: number) => void
  ): Promise<Files> => {
    const url = "/api/files/v1/" + client_id + "/upload";
    const form = new FormData();
    form.append("file", file);
    form.append("entity", JSON.stringify(entity));

    const xhr = new XMLHttpRequest();
    const txtRes = await new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && progressCallback) {
          progressCallback(event.loaded / event.total);
        }
      });
      xhr.addEventListener("loadend", () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(xhr.status);
        }
      });
      xhr.open("POST", Env.server + url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${AuthJWT.token}`);
      xhr.send(form);
    });

    return JSON.parse(txtRes) as Files;
  };

  static getThumbnailUrl = (file: Pick<Files, "key" | "client_id">): string => {
    return (
      Env.server + `/api/files/v1/${file.client_id}/thumbnails/${file.key}`
    );
  };

  static getDownloadUrl = (
    file: Pick<Files, "key" | "client_id" | "name" | "mime">,
    preview?: boolean
  ): string => {
    return (
      Env.server +
      `/api/files/v1/${file.client_id}/download/${file.key}?name=${
        file.name
      }&mime=${file.mime}${preview ? "&preview=1" : ""}`
    );
  };
}
