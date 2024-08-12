const kv = await Deno.openKv();

export const saveStop = (stop: Stop) => kv.set([stop.stopRef], stop);

export const saveStops = async (stops: Stop[]) => {
  for (const stop of stops) await saveStop(stop);
};

export const getStopByRef = (stopRef: string) => kv.get<Stop>([stopRef]);

export const saveUserFavorite = (userId: string, stop: Stop) =>
  kv.set([userId, "favorites", stop.stopRef], stop);

export const getUserFavorites = (userId: string) =>
  kv.list<Stop>({ prefix: [userId] });

export const getUserFavorite = (userId: string, stopRef: string) =>
  kv.get<Stop>([userId, "favorites", stopRef]);
