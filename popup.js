
// since lemmy instances can be hosted on any domain, we can't really use the mainfest.json
// url restriction. So, instead we look for a meta description tag. From a quick survey this seems
// to be present in all instances I checked.
let metaTag = document.querySelector('meta[name="Description"][content="Lemmy"]');

// deal with the word list from the popup
document.addEventListener("DOMContentLoaded", function () {
    let wordList = document.getElementById("wordList");

    // Load stored words into the textarea in the extension popup.
    // the wordlist is stored in chrome local storage so it persists
    chrome.storage.sync.get("wordList", function(data) {
        if (data.wordList) {
            wordList.value = data.wordList;
        }
    });

    // Save words when the button is clicked
    document.getElementById("save").addEventListener("click", function() {
        chrome.storage.sync.set({ wordList: wordList.value }, function() {
            console.log("Words saved:", wordList.value);

            // reload the active tab so we can re-render without wordlist posts
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.reload(tabs[0].id);
            });
        });
    });
});

// walk over our wordlist and posts on the site and remove any containing
// words from the wordlist
function removeWordlistPosts() {
    // make sure our wordlist has data
    chrome.storage.sync.get("wordList", function (data) {
        if (!data.wordList) {
            console.log("No word list found in storage.");
            return; // Exit if storage is empty
        }
        // if we don't find the meta tag, then we know it's probably not a lemmy site and we shouldn't run
        if (!metaTag) {
            console.log("Meta tag not found, extension not running.");
            return;
        }

        //  get the wordlist from the chrome storage
        let keywords = data.wordList.split(",").map(word => word.trim().toLowerCase()).filter(word => word !== "");
        console.log("Loaded keywords:", keywords);

        // go hunting for lemmy posts on our page that have a wordlist word and remove them
        const allSpans = document.querySelectorAll('span');
        let removed = 0;
        Array.from(allSpans).forEach(span => {
            keywords.forEach(w => {
                if (span.textContent.toLowerCase().includes(w)) {
                    console.log(`Omg we found a word: (${w})`)
                    // the class 'post-listing' is a post on lemmy it seems
                    span.closest(".post-listing").remove();
                    removed++;
                }
            })
        });

        if (removed) {
            console.log(`posts removed! 🎉 (${removed})`);
        }
    });
}

chrome.storage.sync.get("wordList", function (data) {
    // Remove  posts on initial page load
    removeWordlistPosts();

    const observer = new MutationObserver(() => {
        removeWordlistPosts();
    });

    const targetNode = document.body;
    const observerOptions = {
        childList: true,
        subtree: true,
    };

    observer.observe(targetNode, observerOptions);
})
