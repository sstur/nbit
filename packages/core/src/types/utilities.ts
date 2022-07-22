// A helpful utility type to expand an intersection of two or more object.
// Source: https://stackoverflow.com/a/57683652
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
