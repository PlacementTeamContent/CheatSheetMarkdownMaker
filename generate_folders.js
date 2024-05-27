import fs from "fs";

const parent_json_path = "./parent_json";
const prompts_json_path = "./prompts_json";
const responses_json_path = "./responses_json";
const final_responses_path = "./final_responses";
const api_responses_path = "./api_responses.json";

const final_e_path="./final_e"
const final_tags="./final_tags"
const responses_tags="./responses_tags"
const tags="./Tags"
const final_seggregation="./Segregation_folders/final_seggregation";
const final_seggregation_responses1="./Segregation_folders/final_segregation_responses1";
const prompts_segregation_json="./Segregation_folders/prompts_segregation_json"
const prompts_segregation_responses="./Segregation_folders/prompts_segregation_responses.json"
const env_path = "./.env";


const createFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true, force: true });
    }
}

const createFile = (file_path, content) => {
    fs.writeFile(file_path, content, 'utf8', (err) => {
        if (err) {
            console.error('An error occurred while writing the file:', err);
            return;
        }
        });
}

function start() {
    try {
        createFolder(parent_json_path);
        createFolder(prompts_json_path);
        createFolder(responses_json_path);
        createFolder(final_responses_path);
        createFile(api_responses_path, "[]");
        createFolder(final_seggregation);
        createFolder(final_seggregation_responses1);
        createFolder(prompts_segregation_json);
        createFolder(prompts_segregation_responses);
        createFolder(final_e_path);
        createFolder(final_tags);
        createFolder(responses_tags);
        createFolder(tags);
        createFile(env_path, "AZURE_OPENAI_ENDPOINT = \"\"\nAZURE_API_KEY = \"\"\nPARENT_JSON_FILE_NAME = \"\"")
    } catch (error) {
      console.error("Error during processing:", error);
    }
}
  
start();