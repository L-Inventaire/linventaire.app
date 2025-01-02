import { useClients } from "@features/clients/state/use-clients";
import { useEffect } from "react";
import { useAuth } from "./use-auth";

// let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

export const useWebsockets = () => {
  const { user } = useAuth();
  const { clients } = useClients();
  //const refreshHistory = useRefreshRestHistory();

  useEffect(() => {
    /*
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
    }*/
  }, [user?.id, clients.length]);
};
