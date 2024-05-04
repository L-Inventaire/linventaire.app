import Env from "@config/environment";
import { fetchServer } from "@features/utils/fetch-server";
import { Files } from "../types/types";

export class FilesApiClient {
  static upload = async (
    client_id: string,
    entity: Partial<Files>,
    file: File
  ): Promise<Files> => {
    const url = "/api/files/v1/" + client_id + "/upload";
    const form = new FormData();
    form.append("file", file);
    form.append("entity", JSON.stringify(entity));
    const res = await fetchServer(url, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: form,
    });
    return await res.json();
  };

  static getThumbnailUrl = (file: Pick<Files, "key" | "client_id">): string => {
    return (
      Env.server + `/api/files/v1/${file.client_id}/thumbnails/${file.key}`
    );
  };

  static getDownloadUrl = (file: Pick<Files, "key" | "client_id">): string => {
    return Env.server + `/api/files/v1/${file.client_id}/download/${file.key}`;
  };
}
