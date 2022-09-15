import {createLogger} from '@alwatr/logger';
import {launch} from 'puppeteer';

import type {PuppeteerLaunchOptions, Browser as puppetBrowser, Page} from 'puppeteer';

export class Browser {
  protected _browser?: puppetBrowser;
  protected _readyState = false;

  private __option: PuppeteerLaunchOptions | undefined;
  private __logger;

  readyStatePromise;

  constructor(option?: PuppeteerLaunchOptions) {
    this.__option = option;
    this.__logger = createLogger('browser');

    this.readyStatePromise = this._init().catch((err) => {
      this.__logger.error('_init', 'init_failed', (err as Error).stack);
    });
  }

  get option(): PuppeteerLaunchOptions | undefined {
    return this.__option;
  }

  async _init(): Promise<void> {
    this.__logger.logMethod('_init');
    this._browser = await launch(this.option);
    this._readyState = true;
  }

  async close(): Promise<void> {
    this._browser?.close();
  }

  async openPage(url: string): Promise<Page | undefined> {
    if (!this._readyState) throw new Error('not_ready');
    this.__logger.logMethod('openPage');
    const page = await this._browser?.newPage();
    await page?.goto(url);
    return page;
  }
}
