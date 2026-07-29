import axios from 'axios';
import logger from '../utils/logger';

export const queryOllama = async (prompt: string, modelName: string = 'phi3'): Promise<string> => {
  try {
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: modelName,
        prompt,
        stream: false,
      },
      { timeout: 2500 } // Short timeout for fallback triggers
    );
    
    if (response.data && response.data.response) {
      return response.data.response.trim();
    }
    throw new Error('Empty inference body from local LLM.');
  } catch (error: any) {
    logger.warn(`Ollama service offline or model ${modelName} missing: ${error.message}`);
    throw error;
  }
};
export default queryOllama;
