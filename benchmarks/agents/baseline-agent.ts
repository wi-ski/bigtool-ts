/**
 * Baseline Agent
 * 
 * Loads ALL tools upfront into context.
 * This is the "traditional" approach.
 */

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { allTools } from "../tools/index.js";

export async function createBaselineAgent() {
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools: allTools, // ALL tools loaded upfront
  });

  return agent;
}

export const AGENT_TYPE = "baseline" as const;
export const DESCRIPTION = "All tools loaded upfront (traditional approach)";
