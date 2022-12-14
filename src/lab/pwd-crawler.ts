import {Browser} from './browser.js';
import {sleep} from './utils.js';

import type {PptrPage, UserInfo, PuppeteerOption, SessionInfo} from './type.js';
import type {KeyInput, Target} from 'puppeteer';

export class PWDCrawler extends Browser {
  private __userInfo: UserInfo | undefined;

  isLogined = false;
  sessionInfo: SessionInfo | null = null;

  constructor(config: PuppeteerOption) {
    super(config);

    this.readyStatePromise.then(() => {
      this.__targetCreatedHandler = this.__targetCreatedHandler.bind(this);
      this.__enterSingleLineCommand = this.__enterSingleLineCommand.bind(this);
      this.browser?.on('targetcreated', this.__targetCreatedHandler);
    });
  }

  protected override async _init(): Promise<void> {
    await super._init();
    await this.openPage('pwd', 'https://labs.play-with-docker.com/');
    this._logger.logProperty('pages', await this.getPagesUrl());
  }

  async loginWithCookie(id: string): Promise<void> {
    if (this.isLogined) {
      this._logger.incident('loginWithCookie', 'USER_LOGINED_BEFORE', 'User login before.');
      return;
    }
    this._logger.logMethod('loginWithCookie');
    await this.__setLoginCookie(id);
    await this.pages.pwd.reload();
  }

  async loginWithPassword(userinfo: UserInfo): Promise<void> {
    if (userinfo.id === undefined || userinfo.password === undefined) {
      throw new Error('user id & password is nessessary');
    }
    if (this.isLogined) {
      this._logger.incident('loginWithPassword', 'USER_LOGINED_BEFORE', 'User login before.');
      return;
    }
    this._logger.logMethod('loginWithPassword');
    this.__userInfo = userinfo;
    await this.__openLoginPage();
  }

  async checkLoginStatus(): Promise<boolean> {
    this._logger.logMethod('checkLoginStatus');

    try {
      await this.pages.pwd.waitForSelector('a.btn-success', {visible: true});
      this.isLogined = true;
    } finally {
      this._logger.logProperty('isLogined', this.isLogined);
      // eslint-disable-next-line no-unsafe-finally
      return this.isLogined;
    }
  }

  async startSession(): Promise<Error | null> {
    this._logger.logMethod('startSession');

    await this.pages.pwd.$eval('a.btn-success', async (button) => {
      (button as HTMLButtonElement)?.click();
    });

    for (;;) {
      if (this.pages.pwd.url().startsWith('https://labs.play-with-docker.com/p/')) {
        break;
      } else if (this.pages.pwd.url().startsWith('https://labs.play-with-docker.com/ooc')) {
        this._logger.error('sta rtSession', 'OCC', 'OCC page returned.');
        this.browser?.close();
      }
      await sleep(1000);
    }

    this._logger.logProperty('sessionUrl', this.pages.pwd.url());
    this.pages.session = this.pages.pwd;
    delete this.pages.pwd;
    this.sessionInfo = {
      sessionUrl: this.pages.session.url(),
      instanceDomainList: [],
    };

    return null;
  }

  async addNewInstance(): Promise<void> {
    this._logger.logMethod('addNewInstance');
    await this.pages.session.waitForSelector('button.md-primary.md-button.md-ink-ripple');
    await this.pages.session.$eval('button.md-primary.md-button.md-ink-ripple', async (button) => {
      (button as HTMLButtonElement)?.click();
    });

    await this.__copyServerDomain();

    this._logger.logProperty('sessionInfo', this.sessionInfo);
  }

  private async __enterSingleLineCommand(command: string): Promise<void> {
    for (const char of command) {
      await this.pages.session.keyboard.press(char as KeyInput);
    }
    await this.pages.session.keyboard.press('Enter');
  }

  async enterCommand(command: string): Promise<void> {
    this._logger.logMethodArgs('enterCommand', {command: command});

    // Split command on each line
    for (const singleLineCommand of command.split('\n')) {
      await this.__enterSingleLineCommand(singleLineCommand);
    }
  }

  private async __copyServerDomain(): Promise<void> {
    this._logger.logMethod('__copyServerDomain');
    await this.pages.session.waitForSelector('input#input_3.md-input');
    const instanceDomain = (
      await this.pages.session.$eval('input#input_3.md-input', (input) => (input as HTMLInputElement).value)
    ).replace('ssh ', '');
    this.sessionInfo?.instanceDomainList?.push(instanceDomain);
    // this.sessionInfo?.instanceDomainList?.push(instanceDomain);
    this._logger.logProperty('instanceIP', this.sessionInfo);
  }

  private async __openLoginPage(): Promise<void> {
    this._logger.logMethod('__openLoginPage');
    if (this._readyState === false) throw new Error('not_ready');

    await this.pages.pwd.waitForSelector('#btnGroupDrop1');
    await this.pages.pwd.$eval('#btnGroupDrop1', async (button) => {
      (button as HTMLButtonElement)?.click();
    });
    await this.pages.pwd.waitForSelector('a.dropdown-item.ng-binding.ng-scope', {visible: true});
    await this.pages.pwd.$eval('a.dropdown-item.ng-binding.ng-scope', async (button) => {
      (button as HTMLButtonElement)?.click();
    });
  }

  private async __setLoginCookie(id: string): Promise<void> {
    this.pages.pwd.setCookie({name: 'id', value: id});
  }

  private async __targetCreatedHandler(target: Target): Promise<void> {
    this._logger.logMethod('__targetCreatedHandler');
    if (target.type() === 'page') {
      const page = (await target.page()) as PptrPage;
      const pageUrl = page?.url();
      if (pageUrl.startsWith('https://login.docker.com/')) {
        this.pages['login'] = page;
        await this.__login();
      }
    }
  }

  private async __login(): Promise<void> {
    this._logger.logMethod('__login');
    await this.__loginUser();

    delete this.pages.login;
  }

  private async __loginUser(): Promise<void> {
    this._logger.logMethod('__typeUserInfoAtLogin');

    // Enter id
    await this.pages.login.waitForSelector('#username');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.pages.login.type('#username', this.__userInfo!.id);

    await this.pages.login.waitForSelector('button._button-login-id');
    await this.pages.login.$eval('button._button-login-id', async (button) => {
      (button as HTMLButtonElement)?.click();
    });

    // Enter Password
    await this.pages.login.waitForSelector('#password');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.pages.login.type('#password', this.__userInfo!.password);

    await this.pages.login.waitForSelector('button._button-login-password');
    await this.pages.login.$eval('button._button-login-password', async (button) => {
      (button as HTMLButtonElement)?.click();
    });
  }
}
