
export function parseBool(stringValue: string): boolean {
  switch (stringValue?.toLowerCase()?.trim()) {
    case "true":
    case "yes":
    case "1":
      return true;

    case "false":
    case "no":
    case "0":
    case null:
    case undefined:
      return false;

    default:
      return JSON.parse(stringValue);
  }
}

export function getOne<T>(error: string, ts: T[]): T {
  if (ts.length !== 1) {
    throw `Expected exactly 1 ${error}, found ${ts.length}`;
  }

  return ts[0];
}
