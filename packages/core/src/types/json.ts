export type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue };

export type JSONObject = { [key: string]: JSONValue };
