type Path = string | Array<string | number>;

export const get = <T = string>(
  object: Record<string, any>,
  path: Path,
  defaultValue?: T
): T => {
  if (!object || typeof object !== "object") return defaultValue as T;

  const pathArray = Array.isArray(path)
    ? path
    : path
        .split(".")
        .map(key =>
          key.includes("[") ? key.replace(/\[(\d+)\]/g, ".$1") : key
        )
        .join(".")
        .split(".");

  let result: any = object;
  for (let key of pathArray) {
    result = result?.[key];
    if (result === undefined) return defaultValue as T;
  }

  return result;
};
