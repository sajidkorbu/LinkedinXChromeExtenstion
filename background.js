chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzePost") {
        analyzePost(request.content)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

async function analyzePost(content) {
    try {
        // Get API key from storage only
        const storage = await chrome.storage.local.get(['openai_api_key']);
        const apiKey = storage.openai_api_key;

        if (!apiKey) {
            throw new Error("OpenAI API key not set. Please set it in the extension options.");
        }

        console.log("Analyzing post content:", content.substring(0, 50) + "...");

        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        // do not change this unless explicitly requested by the user
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a brutally honest LinkedIn post analyzer with high standards. Your job is to cut through the noise and determine if a post provides genuine value or is just feel-good fluff. Be direct and unsparing in your assessment.

Consider a post INTERESTING only if it meets these strict criteria:
- Delivers concrete, actionable advice that can be implemented immediately
- Shares specific personal experiences with clear, substantive lessons (not vague platitudes)
- Presents original data, research findings, or analysis with meaningful insights
- Provides genuinely expert technical knowledge, with specifics that demonstrate deep expertise
- Challenges conventional thinking with well-reasoned arguments and evidence

Consider a post FLUFFY if it shows any of these red flags:
- Contains generic inspirational quotes or "hustle culture" maxims
- Relies on vague statements, platitudes or business jargon without specifics
- Is primarily self-promotional or humble-bragging thinly disguised as advice
- Uses buzzwords, trendy terms, or AI-related hype without substantive content
- Makes claims without supporting evidence or specific examples
- Follows formulaic viral post structures (e.g., "I hired X person and you won't believe what happened...")
- States obvious or common knowledge as if it were profound

Return your assessment as a JSON object with this format:
{
    "verdict": "INTERESTING" or "FLUFFY",
    "reasons": ["reason1", "reason2"],  // List 2-3 most applicable criteria that match
    "explanation": "A one-sentence brutally honest explanation of your verdict"
}`
                    },
                    {
                        role: "user",
                        content: content
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("API response data:", data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from OpenAI");
        }

        const result = JSON.parse(data.choices[0].message.content);
        if (!result.verdict || !result.reasons || !result.explanation) {
            throw new Error("Missing required fields in API response");
        }

        return {
            verdict: result.verdict,
            reasons: result.reasons,
            explanation: result.explanation
        };
    } catch (error) {
        console.error('Analysis error:', error);
        throw new Error(`Failed to analyze post: ${error.message}`);
    }
}

// Handle API key setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['openai_api_key'], function(result) {
        if (!result.openai_api_key) {
            // Open options page on install if API key is not set
            chrome.runtime.openOptionsPage();
        }
    });
});