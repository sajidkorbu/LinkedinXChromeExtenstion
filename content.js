chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "readPost") {
        try {
            const url = window.location.href;
            let postElement = null;
            let platform = "";

            // Remove any existing highlights
            const existingHighlight = document.querySelector('.post-analyzer-highlight');
            if (existingHighlight) {
                existingHighlight.classList.remove('post-analyzer-highlight');
            }

            // Inject highlight styles if not already present
            if (!document.querySelector('#post-analyzer-styles')) {
                const style = document.createElement('style');
                style.id = 'post-analyzer-styles';
                style.textContent = `
                    .post-analyzer-highlight {
                        animation: post-analyzer-pulse 2s infinite;
                        border: 3px solid #0a66c2;
                        border-radius: 4px;
                        position: relative;
                        z-index: 1000;
                    }
                    @keyframes post-analyzer-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(10, 102, 194, 0.6); }
                        70% { box-shadow: 0 0 0 15px rgba(10, 102, 194, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(10, 102, 194, 0); }
                    }
                `;
                document.head.appendChild(style);
            }

            if (url.includes('linkedin.com')) {
                platform = "LinkedIn";
                // LinkedIn post selectors (expanded)
                const linkedInSelectors = [
                    '.feed-shared-update-v2__description',
                    '.feed-shared-text',
                    'article .feed-shared-text',
                    '.feed-shared-update-v2__content',
                    '.update-components-text'
                ];

                // Find all posts
                const allPosts = [];
                linkedInSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => allPosts.push(el));
                });

                // Find the most visible post
                postElement = findMostVisibleElement(allPosts);

            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                platform = "X";
                // X/Twitter post selectors (expanded)
                const xSelectors = [
                    '[data-testid="tweetText"]',
                    '.tweet-text',
                    'article [lang]',
                    '[data-testid="tweet"]',
                    '.tweet-content'
                ];

                // Find all posts
                const allPosts = [];
                xSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => allPosts.push(el));
                });

                // Find the most visible post
                postElement = findMostVisibleElement(allPosts);
            } else {
                sendResponse({ error: "Please navigate to a LinkedIn or X post first" });
                return true;
            }

            if (!postElement) {
                sendResponse({ error: `No ${platform} post found. Make sure you're viewing a post.` });
                return true;
            }

            const content = postElement.textContent.trim();
            if (!content) {
                sendResponse({ error: "Post is empty" });
                return true;
            }

            // Scroll the post into view if needed
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add highlight to the current post
            postElement.classList.add('post-analyzer-highlight');

            // Remove highlight after 5 seconds
            setTimeout(() => {
                postElement.classList.remove('post-analyzer-highlight');
            }, 5000);

            sendResponse({ success: true, content: content, platform: platform });
        } catch (error) {
            sendResponse({ error: "Failed to read post: " + error.message });
        }
        return true;
    }
});

// Helper function to find the most visible element in the viewport
function findMostVisibleElement(elements) {
    let maxVisibleArea = 0;
    let mostVisibleElement = null;

    elements.forEach(element => {
        const rect = element.getBoundingClientRect();

        // Calculate how much of the element is visible in the viewport
        const viewHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
        const above = rect.bottom < 0;
        const below = rect.top > viewHeight;

        if (!above && !below) {
            // Element is at least partially visible
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(viewHeight, rect.bottom);
            const visibleArea = visibleBottom - visibleTop;

            if (visibleArea > maxVisibleArea) {
                maxVisibleArea = visibleArea;
                mostVisibleElement = element;
            }
        }
    });

    return mostVisibleElement;
}