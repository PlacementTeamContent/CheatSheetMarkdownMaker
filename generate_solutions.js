import fs from "fs";
import dotenv from "dotenv";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
dotenv.config();

const prompts_file_path = "./responses_json/" + process.env.PARENT_JSON_FILE_NAME + "_responses.json";
const solutions_output_path = "./generate_solutions/" + process.env.PARENT_JSON_FILE_NAME + "_solutions.json";

// Ensure the solutions directory exists
if (!fs.existsSync('./generate_solutions')) {
  fs.mkdirSync('./generate_solutions');
}

// Initialize an empty solutions file if it doesn't exist
if (!fs.existsSync(solutions_output_path)) {
  fs.writeFileSync(solutions_output_path, "[]", 'utf8');
}

// Configure Azure OpenAI client
const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT, // Your Azure OpenAI endpoint
  new AzureKeyCredential(process.env.AZURE_API_KEY) // Your Azure OpenAI API key
);

const readFileAsync = (file, options) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, options, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });

const writeFileAsync = (file, data, options) =>
  new Promise((resolve, reject) => {
    fs.writeFile(file, data, options, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

async function saveSolutionToFile(file_path, response) {
  try {
    const fileData = await readFileAsync(file_path, "utf8");
    const data = fileData ? JSON.parse(fileData) : [];
    data.push(response);
    console.log(`\nWriting to ${file_path}`);
    await writeFileAsync(file_path, JSON.stringify(data, null, 2), "utf8");
    console.log(`Written into ${file_path}\n`);
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

function getSolutionMessages(questions_prompts_json) {
  let messages = [];

  const solution_prompt_template = `
You are expert in C language and you have practically implemented for more than 10 years. 
Your task is to the answer the question given to you. 

While answering the question follow the best practices given between triple backticks
\`\`\`
The answer should be in conversational tone.
The answer should be around 60 words. 
While answering the question, give example where ever applicable.
Give the pictorial representation to explain the concept where ever applicable.
\`\`\`

The question is: "{{question}}"
`;

  questions_prompts_json.forEach((questionObj) => {
    let messageObj = {
      role: "user",
      content: solution_prompt_template.replace("{{question}}", questionObj["prompt_response"]),
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

    const solution_response_obj = {
      ...question_prompt,
      solution: api_response.message.content,
    };

    await saveSolutionToFile(solutions_output_path, solution_response_obj);

    console.log("--------------------------------------------");
  } catch (error) {
    console.error("Error while processing message:", error.message);

    const error_response_obj = {
      ...question_prompt,
      solution: `Error: ${error.message}`,
    };

    await saveSolutionToFile(solutions_output_path, error_response_obj);
  }
}

async function start() {
  try {
    const question_prompts = await getQuestionPrompts();
    const messages = getSolutionMessages(question_prompts);

    for (let i = 0; i < messages.length; i++) {
      await getGPTResponse(messages[i], question_prompts[i]);
    }
  } catch (error) {
    console.error("Error during processing:", error);
  }
}

start();
