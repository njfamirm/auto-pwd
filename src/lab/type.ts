import type {Page as PptrPage, Browser as PptrBrowser, PuppeteerLaunchOptions} from 'puppeteer';

export {PptrPage, PptrBrowser};

export interface Page {
  [name: string]: PptrPage;
}

export interface PuppeteerOption extends PuppeteerLaunchOptions {
  name?: string;
}

export interface UserInfo {
  id: string;
  password: string;
}

export interface SessionInfo {
  sessionUrl: string;
  instanceDomainList: Array<string>;
}
