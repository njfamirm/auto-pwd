import {config, logger} from './config.js';
import {PWDCrawler} from './lab/pwd-crawler.js';
import {sleep} from './lab/utils.js';

logger.logOther('!: Auto-PWD :!');

const pwdBrowser = new PWDCrawler({
  name: config.name,
  headless: config.headless,
  devtools: config.devtool,
});

await pwdBrowser.readyStatePromise;

await pwdBrowser.loginWithCookie(
    (config.account.cookie as string),
);

// await pwdBrowser.loginWithPassword({
//   id: (config.account.id as string),
//   password: (config.account.password as string),
// });

while (!(await pwdBrowser.checkLoginStatus())) {
  await sleep(3000);
}

const err = await pwdBrowser.startSession();
if (err !== null) {
  throw new Error(err.message);
}

await pwdBrowser.addNewInstance();

await pwdBrowser.enterCommand(`
echo $HOST
curl -fsSL https://raw.githubusercontent.com/njfamirm/dotfiles/main/install.sh | bash
`);

// await pwdBrowser.close();

logger.logOther('Done!');
