import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const parent_json_file_name = process.env.PARENT_JSON_FILE_NAME;
const parent_json_file_path = "./parent_json/" + parent_json_file_name + ".json";
const prompts_file_path = "./prompts_json/" + parent_json_file_name + "_prompts.json";
const questions_response_path = "./responses_json/" + parent_json_file_name + "_responses.json";
const api_responses_path = "./api_responses.json";

// Initialize an empty responses file
fs.writeFile(questions_response_path, "[]", 'utf8', (err) => {
  if (err) {
    console.error('An error occurred while writing the file:', err);
    return;
  }
});

// Configure Azure OpenAI client
const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT, // Your Azure OpenAI endpoint
  new AzureKeyCredential(process.env.AZURE_API_KEY) // Your Azure OpenAI API key
);

const fileLocks = {};

function lockFile(file) {
  if (!fileLocks[file]) {
    fileLocks[file] = new Promise((resolve) => resolve());
  }
}

function unlockFile(file) {
  if (fileLocks[file]) {
    delete fileLocks[file];
  }
}

async function withFileLock(file, callback) {
  lockFile(file);
  try {
    await fileLocks[file];
    const result = await callback();
    unlockFile(file);
    return result;
  } catch (error) {
    console.error(`Error in withFileLock for ${file}:`, error);
    unlockFile(file);
    throw error;
  }
}

const readFileAsync = async (file, options) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, options, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });

const writeFileAsync = async (file, data, options) =>
  new Promise((resolve, reject) => {
    fs.writeFile(file, data, options, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

async function saveResponseToFile(file_path, response) {
  try {
    await withFileLock(file_path, async () => {
      const fileData = await readFileAsync(file_path, "utf8");
      const data = JSON.parse(fileData);
      data.push(response);
      console.log(`\nWriting to ${file_path}`);
      await writeFileAsync(file_path, JSON.stringify(data, null, 2), "utf8");
      console.log(`Written into ${file_path}\n`);
    });
  } catch (error) {
    console.error("Error reading or writing to file:", error);
  }
}

async function getQuestionPrompts() {
  try {
    const questions_prompts = await readFileAsync(prompts_file_path, "utf8");
    const questions_prompts_json = JSON.parse(questions_prompts);
    return questions_prompts_json;
  } catch (error) {
    console.error("Error reading question prompts:", error);
    throw error;
  }
}

function getMessages(questions_prompts_json) {
  let messages = [];

  questions_prompts_json.forEach((questionObj) => {
    let messageObj = {
      role: "user",
      content: questionObj["prompt"],
    };
    messages.push(messageObj);
  });
  return messages;
}

async function getGPTResponse(message, question_prompt) {
  const options = {
    temperature: 0,
    max_tokens: 4000
  };
  try {
    const { choices } = await client.getChatCompletions(
      "gpt-4-latest", // Ensure the model and deployment ID is correct
      [message],
      options
    );

    const api_response = choices[0];

    await saveResponseToFile(api_responses_path, api_response);

    const question_response_obj = {
      ...question_prompt,
      prompt_response: api_response.message.content,
    };

    await saveResponseToFile(
      questions_response_path,
      question_response_obj
    );

    console.log("--------------------------------------------");
  } catch (error) {
    console.error("Error while processing message:", error.message);

    await saveResponseToFile(
      api_responses_path,
      { error: error.message }
    );

    const error_response_obj = {
      ...question_prompt,
      prompt_response: `Error: ${error.message}`,
    };

    await saveResponseToFile(
      questions_response_path,
      error_response_obj
    );
  }
}

async function start() {
  try {
    const question_prompts = await getQuestionPrompts();
    const messages = getMessages(question_prompts);

    for (let i = 0; i < messages.length; i++) {
      await getGPTResponse(messages[i], question_prompts[i]);
    }
  } catch (error) {
    console.error("Error during processing:", error);
  }
}

// Generate prompts from the initial JSON
fs.readFile(parent_json_file_path, "utf8", async (readErr, questions_data) => {
  if (readErr) {
    console.error("Error reading the file:", readErr);
    return;
  }

  let questions_data_json = JSON.parse(questions_data);

  const paraphrase_prompt_template = `
You are an expert copywriter and have familiarity with Coding language. 
Your task is to paraphrase the given question to you.

While paraphrasing the question follow the best practices given between triple backticks:
\`\`\`
ensure the meaning of the question doesn't change.
use simple English only
ensure that meaning doesn't change from language perspective
\`\`\`

The question is: "{{question}}"
`;

  questions_data_json.forEach((questionObj) => {
    let question = questionObj["Questions"];

    // Create the paraphrasing prompt for the question
    let paraphrase_prompt = paraphrase_prompt_template.replace("{{question}}", question);

    questionObj.prompt = paraphrase_prompt;
  });

  const updatedJsonData = JSON.stringify(questions_data_json, null, 2);

  try {
    await writeFileAsync(prompts_file_path, updatedJsonData, "utf8");
    console.log("Questions With Prompts JSON file updated successfully");
    start(); // Start the process after generating the prompts
  } catch (writeErr) {
    console.error("Error writing file:", writeErr);
  }
});
