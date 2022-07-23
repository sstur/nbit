export type StaticFileOptions = {
  maxAge?: number;
  cachingHeaders?: boolean;
};

export class StaticFile {
  constructor(
    readonly filePath: string,
    readonly options?: StaticFileOptions,
  ) {}
}
