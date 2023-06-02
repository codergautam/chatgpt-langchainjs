import { OpenAI } from 'langchain/llms';
import { LLMChain, PromptTemplate } from 'langchain';
import { HNSWLib } from "langchain/vectorstores";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from "langchain/prompts";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import promptTemplate from './basePrompt.js'
import basePrompt from './basePrompt.js';

import { config } from 'dotenv';
config();
// Load the Vector Store from the `vectorStore` directory
const store = await HNSWLib.load("vectorStore", new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY
}));
console.clear();

// OpenAI Configuration
// const model = new OpenAI({
//   temperature: 0,
//   openAIApiKey: process.env.OPENAI_API_KEY,
//   modelName: 'text-davinci-003'
// });
const model = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4'
});


// Parse and initialize the Prompt
// const prompt = new PromptTemplate({
//   template: promptTemplate,
//   inputVariables: ["history", "context", "prompt"]
// });


/**
 * Generates a Response based on history and a prompt.
 * @param {string} history - The history of the conversation.
 * @param {string} prompt - The query that the user has entered.
 */
const generateResponse = async ({
  history,
  prompt
}) => {
  const llmPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(basePrompt[0]),
    ...history.map((item) => {
      return item.type=="human"? HumanMessagePromptTemplate.fromTemplate(item.text) : SystemMessagePromptTemplate.fromTemplate(item.text);
    }),
    HumanMessagePromptTemplate.fromTemplate(basePrompt[1]),
  ]);

  // Create the LLM Chain
  const llmChain = new LLMChain({
    llm: model,
    prompt: llmPrompt,
  });
  // Search for related context/documents in the vectorStore directory
  const data = await store.similaritySearch(prompt, 1);
  const context = [];
  console.log(data);
  data.forEach((item, i) => {
    context.push(`Context:\n${item.pageContent}`)
  });

  let out = await llmChain.call({
    prompt,
    context: context.join('\n\n'),
  });
  return out.text;
}

export default generateResponse;