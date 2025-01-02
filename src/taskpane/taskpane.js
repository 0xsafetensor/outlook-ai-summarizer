import Anthropic from '@anthropic-ai/sdk';

// Debug logging function
function log(message, isError = false) {
    const debugDiv = document.getElementById('debug');
    const timestamp = new Date().toLocaleTimeString();
    const color = isError ? 'red' : 'black';
    debugDiv.innerHTML += `<div style="color: ${color}">[${timestamp}] ${message}</div>`;
    console.log(message);
}

// Initialize Anthropic client
let anthropicClient = null;

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        try {
            log("Initializing Anthropic client...");
            anthropicClient = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
                dangerouslyAllowBrowser: true
            });
            log("Anthropic client initialized successfully");

            // Set up button handlers
            document.getElementById("summarizeDetailed").onclick = summarizeDetailed;
            document.getElementById("summarizeBrief").onclick = summarizeBrief;
            log("Office Add-in initialized");
        } catch (error) {
            log("Error initializing Anthropic client: " + error.message, true);
        }
    }
});

async function getEmailContent() {
    log("Getting email content...");
    return new Promise((resolve, reject) => {
        Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                log("Email content retrieved successfully");
                resolve(result.value);
            } else {
                log("Failed to get email content: " + result.error.message, true);
                reject(new Error(result.error.message));
            }
        });
    });
}

async function generateSummary(content, type) {
    if (!anthropicClient) {
        throw new Error("Anthropic client not initialized");
    }

    log("Generating summary...");
    log("Type: " + type);
    log("Content length: " + (content?.length || 0));

    const prompt = type === 'detailed' 
        ? `Please provide a detailed summary of this email. Include all important points, action items, and key details:\n\n${content}`
        : `Please provide a brief summary of this email in around 100 words. Focus on the main point and any critical action items:\n\n${content}`;

    log("Generated prompt (first 100 chars): " + prompt.substring(0, 100) + "...");

    try {
        log("Creating Anthropic message...");
        const response = await anthropicClient.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: prompt
            }]
        });
        
        log("API response received");
        
        if (!response || !response.content || !response.content[0] || !response.content[0].text) {
            throw new Error("Invalid response format from API");
        }
        
        return response.content[0].text;
    } catch (error) {
        log('Error calling Claude: ' + error.message, true);
        throw error;
    }
}

async function summarize(type) {
    log("Starting summarization...");
    try {
        // Show loading state
        document.getElementById('loading').style.display = 'block';
        document.getElementById('summary').innerText = '';

        // Get email content
        const content = await getEmailContent();
        log("Email content received (first 100 chars): " + content?.substring(0, 100) + "...");

        // Generate summary
        const summary = await generateSummary(content, type);
        log("Summary generated");

        // Display summary
        document.getElementById('summary').innerText = summary;
    } catch (error) {
        log("Error in summarize: " + error.message, true);
        document.getElementById('summary').innerText = `Error: ${error.message}`;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function summarizeDetailed() {
    log("Detailed summary requested");
    summarize('detailed');
}

function summarizeBrief() {
    log("Brief summary requested");
    summarize('brief');
}
