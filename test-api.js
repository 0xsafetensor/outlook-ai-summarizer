import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

async function testAPI() {
    try {
        console.log("API Key:", process.env.ANTHROPIC_API_KEY);
        const message = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: "Hello! Please respond with a simple 'API is working!' if you receive this message."
            }]
        });
        console.log("Response:", message.content);
    } catch (error) {
        console.error("Error:", error);
    }
}

testAPI();
