document.addEventListener('DOMContentLoaded', () => {
    const readBtn = document.getElementById('read-btn');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('result');
    const messageElement = document.getElementById('message');
    const errorElement = document.getElementById('error');
    const errorTextElement = document.getElementById('error-text');

    function showLoading() {
        loadingElement.classList.remove('hidden');
        resultElement.classList.add('hidden');
        errorElement.classList.add('hidden');
        readBtn.disabled = true;
    }

    function showResult(analysis, platform) {
        loadingElement.classList.add('hidden');
        resultElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
        readBtn.disabled = false;

        const reasons = analysis.reasons.join('\n• ');
        messageElement.textContent = `${platform} Post Analysis:\n${analysis.explanation}\n\nVerdict: ${analysis.verdict}\n\nReasons:\n• ${reasons}`;
        messageElement.className = 'message ' + (analysis.verdict === 'INTERESTING' ? 'interesting' : 'fluffy');
    }

    function showError(message) {
        loadingElement.classList.add('hidden');
        resultElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
        readBtn.disabled = false;
        errorTextElement.textContent = message;
    }

    readBtn.addEventListener('click', async () => {
        showLoading();

        try {
            // Check if we're on LinkedIn or X
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url.includes('linkedin.com') && !tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                throw new Error("Please navigate to a LinkedIn or X post first");
            }

            // Inject content script if needed
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (e) {
                console.error('Script injection error:', e);
            }

            // Try to read the post
            const result = await chrome.tabs.sendMessage(tab.id, { action: "readPost" })
                .catch(e => {
                    console.error('Content script error:', e);
                    return { error: "Please refresh the page and try again" };
                });

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.content) {
                throw new Error("Failed to read post content");
            }

            // Send the post for analysis
            const analysis = await chrome.runtime.sendMessage({
                action: "analyzePost",
                content: result.content
            });

            if (analysis.error) {
                throw new Error(analysis.error);
            }

            showResult(analysis, result.platform);
        } catch (error) {
            console.error('Extension error:', error);
            showError(error.message);
        }
    });
});