declare module "turndown" {
  export type TurndownRule = {
    filter: string | string[] | ((node: HTMLElement, options: unknown) => boolean);
    replacement: (content: string, node: HTMLElement, options: unknown) => string;
  };

  export default class TurndownService {
    constructor(options?: unknown);
    turndown(input: HTMLElement | Document | string): string;
    addRule(key: string, rule: TurndownRule): void;
  }
}

