import axios from 'axios';
import logger from '../utils/logger';

/**
 * Universal LLM Query Service
 * Connects to Cloud APIs (Gemini, Groq, OpenAI) if API keys are set in environment,
 * or falls back to local Ollama server if running.
 */
export const queryOllama = async (prompt: string, modelName: string = 'phi3'): Promise<string> => {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Google Gemini Cloud API
  if (provider === 'gemini' || (geminiKey && !provider)) {
    try {
      const apiKey = geminiKey;
      if (!apiKey) throw new Error('GEMINI_API_KEY is missing in environment variables.');
      const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10) }
      );

      const candidate = response.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) {
        return text.trim();
      }
      throw new Error('Empty response payload from Gemini API.');
    } catch (error: any) {
      logger.warn(`Gemini API query failed: ${error?.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // 2. Groq Cloud API (Super fast inference engine)
  if (provider === 'groq' || (groqKey && !provider)) {
    try {
      const apiKey = groqKey;
      if (!apiKey) throw new Error('GROQ_API_KEY is missing in environment variables.');
      const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text) {
        return text.trim();
      }
      throw new Error('Empty response payload from Groq API.');
    } catch (error: any) {
      logger.warn(`Groq API query failed: ${error?.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // 3. OpenAI Cloud API
  if (provider === 'openai' || (openaiKey && !provider)) {
    try {
      const apiKey = openaiKey;
      if (!apiKey) throw new Error('OPENAI_API_KEY is missing in environment variables.');
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text) {
        return text.trim();
      }
      throw new Error('Empty response payload from OpenAI API.');
    } catch (error: any) {
      logger.warn(`OpenAI API query failed: ${error?.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // 4. Default: Local Ollama server
  try {
    const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await axios.post(
      `${baseUrl}/api/generate`,
      {
        model: modelName,
        prompt,
        stream: false,
      },
      { timeout: 12000 }
    );

    if (response.data && response.data.response) {
      return response.data.response.trim();
    }
    throw new Error('Empty inference body from local LLM.');
  } catch (error: any) {
    logger.warn(`Local Ollama service offline or model ${modelName} missing: ${error.message}`);
    throw error;
  }
};

export default queryOllama;
