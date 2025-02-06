// handle throwing data across the storage layer
chrome.storage.sync.get("wordList", function(data) {
    if (data.wordList) {
        console.log("stored words:", data.wordList);
        let wordArray = data.wordList.split(",").map(word => word.trim());
        console.log("parsed words:", wordArray);
    }
});
