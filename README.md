# Scripts

Small, documented scripts maintained by [DapperGeek1](https://github.com/DapperGeek1).

This repository starts with an independently maintained adaptation of **1-Click Cancel Amazon S&S** from [Sridhar Dhanapalan's Scripts repository](https://github.com/kranix0/Scripts). The original authorship, copyright and third-party credits are preserved.

## Userscripts

| Script | Purpose | Install |
| --- | --- | --- |
| [1-Click Cancel Amazon S&S](./userscripts/1-click-cancel-amazon-sns/) | Cancel the rendered Subscribe & Save subscriptions on the current Amazon management page; includes support for the newer My Deliveries layout. | [Install v0.4.3](https://raw.githubusercontent.com/DapperGeek1/Scripts/main/userscripts/1-click-cancel-amazon-sns/1-click-cancel-amazon-sns.user.js) |

Read the script's installation and usage notes before running it. Clicking its cancellation button immediately attempts to cancel every subscription included in the displayed count; there is no second confirmation dialog.

## Structure

Each script lives in its own folder with usage instructions, a changelog, provenance and any required third-party notices. This initial repository includes the Amazon script only.

## Development

No build step or package installation is required. With Node.js 18 or later, run:

```sh
node --check userscripts/1-click-cancel-amazon-sns/1-click-cancel-amazon-sns.user.js
node userscripts/1-click-cancel-amazon-sns/tests/detection.test.cjs
```

The automated checks use local fixtures and make no Amazon requests. See the script README for the limits of validation.

## Licence and attribution

The original userscript is by **Sridhar Dhanapalan (kranix0)**. Compatibility changes in this repository are maintained by **DapperGeek1**. The underlying cancellation mechanism derives from **L422Y's gist**, used upstream with permission subject to credit and a link.

The MIT copyright and permission notice is retained in [LICENSE](./LICENSE). See [NOTICE.md](./NOTICE.md) and the [full script attribution](./userscripts/1-click-cancel-amazon-sns/NOTICE.md), including the original gist and permission links. This repository is an independent derivative and does not claim endorsement by the upstream authors or Amazon.
