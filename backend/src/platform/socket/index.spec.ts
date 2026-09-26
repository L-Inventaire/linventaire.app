import { describe, expect, jest, test } from "@jest/globals";
import { handleJoinClientRoom } from "./index";

const fakeSocket = () => ({
  join: jest.fn(),
  emit: jest.fn(),
  request: { headers: {}, socket: { remoteAddress: "10.0.0.1" } } as any,
});

describe("handleJoinClientRoom", () => {
  test("joins the room when the user belongs to the client", async () => {
    const socket = fakeSocket();
    const authorizer = jest.fn(async () => true);

    await handleJoinClientRoom(
      socket as any,
      "user-1",
      { room: "client/client-1" },
      authorizer
    );

    expect(authorizer).toHaveBeenCalledWith({
      userId: "user-1",
      clientId: "client-1",
      request: socket.request,
    });
    expect(socket.join).toHaveBeenCalledWith("client/client-1");
    expect(socket.emit).toHaveBeenCalledWith("join:success", {
      room: "client/client-1",
    });
  });

  test("refuses to join a client the user does not belong to", async () => {
    const socket = fakeSocket();

    await handleJoinClientRoom(
      socket as any,
      "user-1",
      { room: "client/other-client" },
      async () => false
    );

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("join:error", {
      room: "client/other-client",
      error: "forbidden",
    });
  });

  test("refuses to join when the check throws (e.g. IP not allowed)", async () => {
    const socket = fakeSocket();

    await handleJoinClientRoom(
      socket as any,
      "user-1",
      { room: "client/client-1" },
      async () => {
        throw { status: 403, code: "IP_NOT_ALLOWED" };
      }
    );

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("join:error", {
      room: "client/client-1",
      error: "IP_NOT_ALLOWED",
    });
  });

  test("refuses to join when no authorizer is configured", async () => {
    const socket = fakeSocket();

    await handleJoinClientRoom(
      socket as any,
      "user-1",
      { room: "client/client-1" },
      null
    );

    expect(socket.join).not.toHaveBeenCalled();
  });

  test("ignores malformed join events", async () => {
    const socket = fakeSocket();
    const authorizer = jest.fn(async () => true);

    await handleJoinClientRoom(socket as any, "user-1", {}, authorizer);
    await handleJoinClientRoom(socket as any, "user-1", null, authorizer);
    await handleJoinClientRoom(
      socket as any,
      "user-1",
      { room: { $ne: "" } },
      authorizer
    );

    expect(authorizer).not.toHaveBeenCalled();
    expect(socket.join).not.toHaveBeenCalled();
  });
});
