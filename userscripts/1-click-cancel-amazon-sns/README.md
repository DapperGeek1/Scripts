# 1-Click Cancel Amazon S&S

Version **0.4.3**, maintained here by [DapperGeek1](https://github.com/DapperGeek1). Based on **v0.4.2 by Sridhar Dhanapalan (kranix0)** in [kranix0/Scripts](https://github.com/kranix0/Scripts/tree/1c0c5c53f82dd7b421ec0971c981972dd918b914/userscripts/1-click-cancel-amazon-sns).

Adds a floating button to Amazon Subscribe & Save management pages. The button counts the rendered subscription cards on the current page and, when clicked, attempts to cancel those subscriptions.

## What changed in this adaptation

- Reads subscription IDs from the newer cards' `data-edit-url` query parameters, as well as the legacy `data-subscription-id` attribute.
- Ignores hidden cards, malformed edit URLs, foreign origins and unrelated edit endpoints; deduplicates subscription IDs.
- Refreshes the button when Amazon loads, removes or changes cards after the script starts.
- Coalesces page changes and ignores the button's own mutations to avoid refresh loops.
- Preserves the original current-page cancellation workflow, request timeouts and per-item reporting.
- Points installation and updates to this repository.

## Installation

1. Use your existing userscript manager, such as Tampermonkey, or install one from its official extension listing.
2. If you already have the upstream script installed, disable or remove that copy before installing this adaptation. This repository uses its own userscript namespace; keeping both enabled may cause conflicting controls.
3. [Install the userscript](https://raw.githubusercontent.com/DapperGeek1/Scripts/main/userscripts/1-click-cancel-amazon-sns/1-click-cancel-amazon-sns.user.js). If your browser displays the source, create a script in your manager and paste the complete file, then save.
4. Reload the Amazon Subscribe & Save management page.

## Usage

1. Open your Amazon **Subscribe & Save / Your Auto-Deliveries** page.
2. Check the floating button's count against the subscriptions you want to cancel.
3. Click **Cancel N visible S&S** only when you intend to cancel every subscription in that count.
4. Review the result summary, then refresh Amazon and verify the resulting subscription state.

**The button is the confirmation. There is no second confirmation dialog.** The script does not undo cancellations. Rendered cards below the visible screen area are included in the count; hidden cards are excluded. No pagination is followed automatically.

If the button says **1-Click S&S active**, no rendered subscriptions were detected. Clicking that status button only displays an explanation.

## Marketplace scope

The inherited metadata covers Amazon Australia, Canada, France, Germany, India, Italy, Japan, Netherlands, Spain, United Kingdom and United States. The new layout detection was manually checked on Amazon Australia on **2 November 2026**. Compatibility with other marketplaces has not been separately verified for this adaptation.

## Validation and limitations

- Syntax validation and 11 local regression checks cover discovery, URL parsing, duplicate and hidden cards, delayed loading, count updates, and observer behaviour.
- The updated discovery logic was checked against a live Amazon Australia page.
- **Live cancellation was not tested for this adaptation.** The cancellation mechanism is inherited from upstream.
- An HTTP-success response is reported as a successful attempt; it does not independently prove that Amazon cancelled the subscription. Always refresh and verify Amazon's state.
- Amazon may change its markup or cancellation endpoints. Only rendered subscriptions on the current page are handled; additional pages require separate visits.
- Requests are made to the current Amazon marketplace; the script adds no analytics or third-party network calls. The userscript manager may check this repository for updates.

Run the fixture checks from the repository root:

```sh
node userscripts/1-click-cancel-amazon-sns/tests/detection.test.cjs
```

## Attribution and licence

Original script: **Sridhar Dhanapalan (kranix0)**, [kranix0/Scripts](https://github.com/kranix0/Scripts). Compatibility adaptation: **DapperGeek1**.

The underlying cancellation mechanism is adapted from [L422Y's Amazon Subscribe & Save cancellation gist](https://gist.github.com/L422Y/53b75be4bb8afd5cd6143e74150cc142). Upstream records [permission with an attribution/link condition](https://gist.github.com/L422Y/53b75be4bb8afd5cd6143e74150cc142?permalink_comment_id=6240234#gistcomment-6240234), which is preserved here.

See [LICENSE](../../LICENSE), [NOTICE.md](./NOTICE.md), the [verbatim upstream notice](./UPSTREAM-NOTICE.md), and [CHANGELOG.md](./CHANGELOG.md).
