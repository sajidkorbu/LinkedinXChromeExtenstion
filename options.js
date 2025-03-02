document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key
    chrome.storage.local.get(['openai_api_key'], function(result) {
        if (result.openai_api_key) {
            document.getElementById('apiKey').value = result.openai_api_key;
        }
    });

    // Save API key
    document.getElementById('save').addEventListener('click', function() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const messageDiv = document.getElementById('message');

        if (!apiKey) {
            messageDiv.textContent = 'Please enter an API key';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        // Basic validation for OpenAI API key format
        if (!apiKey.startsWith('sk-')) {
            messageDiv.textContent = 'Invalid API key format. OpenAI API keys start with "sk-"';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        chrome.storage.local.set({
            'openai_api_key': apiKey
        }, function() {
            messageDiv.textContent = 'API key saved successfully!';
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
        });
    });

    const loginButton = document.getElementById('login-button');
    const loginStatus = document.getElementById('login-status');

    // Check current auth status (API key based)
    chrome.storage.local.get(['openai_api_key'], function(result) {
        if (result.openai_api_key) {
            updateLoginStatus(result.openai_api_key); //Modified to accept API key
        } else {
            updateLoginStatus(null); // handle no API key case.
        }
    });


    loginButton.addEventListener('click', function() {
        //This section is completely removed as per intention
    });


    function updateLoginStatus(apiKey) {
        if (apiKey) {
            loginStatus.textContent = 'Signed in with API Key';
            loginStatus.className = 'login-status logged-in';
            loginButton.textContent = 'Switch Account';
        } else {
            loginStatus.textContent = 'Not signed in';
            loginStatus.className = 'login-status logged-out';
            loginButton.textContent = 'Sign in with API Key';
        }
    }

    function showError(message) {
        loginStatus.textContent = message;
        loginStatus.className = 'login-status logged-out';
    }
});