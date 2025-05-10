declare module 'pino-roll' {
  export interface RollOptions {
    file: string;
    size?: string;
    keep?: number;
    mkdir?: boolean;
  }

  export function roll(options: RollOptions): NodeJS.WritableStream;
}
