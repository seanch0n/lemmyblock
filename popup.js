
// since lemmy instances can be hosted on any domain, we can't really use the mainfest.json
// url restriction. So, instead we look for a meta description tag. From a quick survey this seems
// to be present in all instances I checked.
let metaTag = document.querySelector('meta[name="Description"][content="Lemmy"]');

// deal with the word list from the popup. We need our storage to load before we do anything
// so we wait for the dom to start
document.addEventListener("DOMContentLoaded", function () {
    let wordList = document.getElementById("wordList");

    // Load stored words into the textarea in the extension popup.
    // the wordlist is stored in chrome local storage so it persists
    chrome.storage.sync.get("wordList", function (data) {
        if (data.wordList) {
            wordList.value = data.wordList;
        }
    });

    // Save the block list words to chrome storage so it's persistent and we can retri it later
    function saveWordList() {
        chrome.storage.sync.set({ wordList: wordList.value }, function () {
            console.log("Words saved:", wordList.value);

            // reload the active tab so we can re-render without wordlist posts
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.reload(tabs[0].id);
            });
        });
    }

    /*********************************************** 
    // We want to store a list of posts that have been blocked due to the block list,
    // so users can view them if they want. This next set of functions deal with that
    //
    // getBLockedPosts(callback);
    // displayBlockedPosts(posts);
    // clearBlockedPosts();
    ************************************************/

    // get the list of blocked posts from chrome storage
    function getBlockedPosts(callback) {
        chrome.storage.sync.get({ blockedPosts: [] }, (data) => {
            callback(data.blockedPosts);
        });
    }
    
    // populate the blocked posts table in the chrome extension 
    function displayBlockedPosts(posts) {
        let tableBody = document.querySelector("#postsTable tbody");

        // Clear existing rows
        tableBody.innerHTML = "";

        posts.forEach(post => {
            let row = document.createElement("tr");

            // Create title cell
            let titleCell = document.createElement("td");
            titleCell.textContent = post.title;

            // Create link cell
            let linkCell = document.createElement("td");
            let link = document.createElement("a");
            link.href = post.url;
            link.textContent = "View Post";
            link.target = "_blank"; // Open in new tab
            linkCell.appendChild(link);

            // Append cells to row
            row.appendChild(titleCell);
            row.appendChild(linkCell);

            // Append row to table
            tableBody.appendChild(row);
        });

        // make the table visible
        document.getElementById("postsTable").style.display = "table";
        document.getElementById("hideList").style.display = "inline";
    }

    // empty the storage, then rebuild the table with the now empty data
    function clearBlockedPosts() {
        chrome.storage.sync.remove("blockedPosts", () => {
            console.log("All blocked posts cleared.");
            displayBlockedPosts();
        })
    }

    // listener for the "Save" button to save block list changes. 
    document.getElementById("save").addEventListener("click", function () {
        saveWordList();
    });

    // listener for the "View blocked posts list" button
    document.getElementById("viewList").addEventListener("click", function () {
        // Get posts and display them in the table
        getBlockedPosts(displayBlockedPosts);
    });

    // listener for the "Clear blocked posts list" button
    document.getElementById("clearList").addEventListener("click", function () {
        clearBlockedPosts();
    });

    // listener for the "Hide blocked post list" button. Also hides the hide button
    // which is turned on when the show button is pressed
    document.getElementById("hideList").addEventListener("click", function () {
        document.getElementById("postsTable").style.display = "none";
        document.getElementById("hideList").style.display = "none";
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
                    let postListingElem = span.closest(".post-listing")
                    storeRemovedPost(postListingElem);

                    postListingElem.remove();
                    removed++;
                }
            })
        });

        if (removed) {
            console.log(`posts removed! 🎉 (${removed})`);
        }
    });
}

// get list of blocked posts from storage
function getBlockedPosts(callback) {
    chrome.storage.sync.get({ blockedPosts: [] }, (data) => {
        callback(data.blockedPosts);
    });
}

// store the blocked post title and url so the user can view the list of
// blocked posts in the extension
function storeRemovedPost(postListingElem) {
    let postTitleELem = postListingElem.querySelector("span.d-inline")
    let postTitle = postTitleELem.textContent.trim();
    let url = window.location.href;
    // there's probably a better way to build urls but i don't care right now
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    postLink = `${url}${postTitleELem.closest("a").getAttribute("href")}`;


    // get old posts so we can append to the list
    chrome.storage.sync.get({ blockedPosts: [] }, (data) => {
        let blockedPosts = data.blockedPosts; 

        const postExists = blockedPosts.some(post => post.title === postTitle && post.url === postLink);
        // console.log("post exists?: " + postExists + " " + postTitle);
        if (postExists) {
            return;
        }

        // Add the new post
        blockedPosts.push({ title: postTitle, url: postLink });

        // Save updated list back to storage
        chrome.storage.sync.set({ blockedPosts: blockedPosts }, () => {
            console.log("Post saved:", postTitle, postLink);
        });
    });

    console.log("we blocked: " + postTitle + " with a link to: " + postLink);
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
