import { useMemo, useSyncExternalStore } from "react";
import { Client, Room } from "colyseus.js";

type Selector<S, R> = (state: S) => R;

export function createColyseus<S = unknown>(endpoint: string) {
  const client = new Client(endpoint);

  // External store holding the active room
  let activeRoom: Room<S> | undefined;
  const roomSubscribers = new Set<() => void>();

  const notifyRoom = () => {
    roomSubscribers.forEach((cb) => cb());
  };

  const subscribeRoom = (cb: () => void) => {
    roomSubscribers.add(cb);
    return () => roomSubscribers.delete(cb);
  };

  const getRoomSnapshot = () => activeRoom;

  async function connectToColyseus(
    roomName: string,
    options: Record<string, unknown> = {}
  ) {
    const room = await client.joinOrCreate<S>(roomName, options);
    // Wire minimal lifecycle
    room.onLeave(() => {
      if (activeRoom === room) {
        activeRoom = undefined;
        notifyRoom();
      }
    });
    activeRoom = room;
    notifyRoom();
  }

  async function disconnectFromColyseus() {
    if (activeRoom) {
      try {
        await activeRoom.leave();
      } catch {
        // ignore
      }
      activeRoom = undefined;
      notifyRoom();
    }
  }

  function useColyseusRoom(): Room<S> | undefined {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(
      subscribeRoom,
      getRoomSnapshot,
      getRoomSnapshot
    );
  }

  function useColyseusState(): S | undefined;
  function useColyseusState<R>(selector: Selector<S, R>): R | undefined;
  function useColyseusState<R>(selector?: Selector<S, R>) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const room = useColyseusRoom();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useSyncExternalStore(
      (cb) => {
        if (!room) return () => {};
        const off = room.onStateChange(() => cb());
        return () => {
          if (typeof off === "function") off();
        };
      },
      () => (room ? (room.state as S) : undefined),
      () => (room ? (room.state as S) : undefined)
    );

    if (!state) return undefined;
    return selector ? (selector(state as S) as R) : (state as S);
  }

  function useColyseusApi() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      () => ({
        client,
        connectToColyseus,
        disconnectFromColyseus,
        useColyseusRoom,
        useColyseusState
      }),
      []
    );
  }

  return {
    client,
    connectToColyseus,
    disconnectFromColyseus,
    useColyseusRoom,
    useColyseusState,
    useColyseusApi
  };
}

export type { Room };
