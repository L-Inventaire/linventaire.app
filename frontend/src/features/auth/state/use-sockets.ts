import Env from "@config/environment";
import { useClients } from "@features/clients/state/use-clients";
import { useRefreshRestHistory } from "@features/utils/rest/hooks/use-history";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { queryClient } from "../../../index";
import { AuthJWT } from "../jwt";
import { useAuth } from "./use-auth";

let socket: Socket<any, any> | null = null;

export const useWebsockets = () => {
  const { user } = useAuth();
  const { clients } = useClients();
  const refreshHistory = useRefreshRestHistory();

  useEffect(() => {
    if (user?.id) {
      if (socket) socket.close();
      const endpoint = Env.server.replace(/\/$/, "").replace(/^http/, "ws");
      socket = io(endpoint + "/websockets", {
        reconnectionDelayMax: 10000,
        withCredentials: true,
        auth: {
          token: AuthJWT.token,
        },
      });

      socket.on("connect", () => {
        for (const client of clients) {
          socket?.emit("join", { room: "client/" + client?.client_id });
        }
      });

      socket.on("message", (event: any) => {
        if (event.event === "invalidated") {
          for (const doc of event.data) {
            // Only update a single document for now
            const invalidated =
              doc.doc_pk?.client_id && doc.doc_pk?.id
                ? [doc.doc_table, doc.doc_pk?.client_id, doc.doc_pk?.id]
                : [doc.doc_table];
            queryClient.invalidateQueries({
              queryKey: invalidated,
            });

            if (["threads", "notifications"].includes(doc.doc_table)) {
              // Refresh lists
              queryClient.invalidateQueries({
                queryKey: [doc.doc_table],
              });
            }

            // Update history if needed
            if (
              doc.doc_pk?.client_id &&
              doc.doc_table &&
              doc.doc_pk?.id &&
              doc.doc_table !== "comments"
            ) {
              const state = queryClient.getQueryState([
                "history",
                doc.doc_table,
                doc.doc_pk?.id,
              ]);
              // If history is currently observed
              if (state) {
                refreshHistory(
                  doc.doc_pk?.client_id,
                  doc.doc_table,
                  doc.doc_pk?.id
                ).catch(console.info);
              }
            }
          }
        }
      });
    }
  }, [user?.id, clients.length]);
};
