import Env from "@config/environment";
import { useClients } from "@features/clients/state/use-clients";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { AuthJWT } from "../jwt";
import { useAuth } from "./use-auth";
import { queryClient } from "../../../index";
import { useRefreshRestHistory } from "@features/utils/rest/hooks/use-history";

let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

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

      socket.on("message", (event) => {
        if (event.event === "invalidated") {
          for (const doc of event.data) {
            const invalidated = [doc.doc_table];
            queryClient.invalidateQueries({
              queryKey: invalidated,
            });
            if (
              doc.doc_pk?.client_id &&
              doc.doc_table &&
              doc.doc_pk?.id &&
              doc.doc_table !== "comments"
            ) {
              refreshHistory(
                doc.doc_pk?.client_id,
                doc.doc_table,
                doc.doc_pk?.id
              ).catch(console.info);
            }
          }
        }
      });
    }
  }, [user?.id, clients.length]);
};
