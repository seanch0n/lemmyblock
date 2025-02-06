# LemmyBlock: remove posts in a block list from lemmy


A Chrome extension to remove posts containing words in a blocklist from appearing on lemmy instances

## **Installation**

1. Download or clone this repository.
   ```sh
   git clone git@github.com:seanch0n/lemmyblock.git
   ```
1. Open Google Chrome and go to "**Manage Extensions**", `chrome://extensions`.
1. Enable the "**Developer mode**" toggle in the top right corner.
1. Click on "**Load unpacked**" and select the extension directory.
1. That's it, enjoy your ad-free Reddit feed!

<sup>Follow similar steps on other browsers which support extensions like [Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading), Brave.</sup>

## **How It Works**

1. Click the icon to open the wordlist page.
2. Enter your worldlist and hit the 'save' button, this will reload your page.
3. When you browse to a lemmy instance, it will remove any posts that contain words in your wordlist.

**Wordlist Rules:**
- comma separated
- spaces are fine
- case insensitive

**Examples:**
```
elon, musk, donald trump, doomer post keywords here
```

### Caveats

Hey, what the hell? Why does the manifest say this runs on every page?
Well, lemmy instances can be hosted on any domain, so I can't find an elegant want to use that part of the mainfest. **However, we do not attempt to edit every page**.
Instead, we check for a meta tag in the page that indicates if the page is a lemmy instance or not. if it isn't, we just ignore the page. If it is, we do our thing.

Feel free to submit a pr if you find a workaround that is better. Or, fork it and populate the manifest url list with your lemmy instances.

## **Contributions**

feel free to submit issues/prs/fork the repo.

## **License**

This project is licensed under the [MIT License](LICENSE).


## Features

### Implemented

[-] block list 
[-] store blocked posts to view later
[-] view/clear/hide the blocked post list

### Planned / Proposed / In Progress

[-] fedilinks for lemmy (see `fedilink` branch)
[ ] fedilinks for mastodon
[ ] fedilinks for pixelfed
[ ] user tags