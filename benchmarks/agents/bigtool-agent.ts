/**
 * BigTool Agent
 * 
 * Uses bigtool-ts for dynamic tool discovery.
 * Tools are searched and loaded on-demand.
 */

import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "../../src/graph/agent.js";
import { OramaSearch } from "../../src/search/orama.js";
import { allTools } from "../tools/index.js";

export async function createBigtoolAgent() {
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });

  const agent = await createAgent({
    llm,
    tools: allTools, // Same tools, but discovered dynamically
    search: new OramaSearch({ mode: "bm25" }),
  });

  return agent;
}

export const AGENT_TYPE = "bigtool" as const;
export const DESCRIPTION = "Dynamic tool discovery with bigtool-ts";
