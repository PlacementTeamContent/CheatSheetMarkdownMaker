### Initialization

Installation of nodeJs software from [node](https://nodejs.org/en/download)  
Open this directory in terminal and run `npm install` or `npm i`.

### Pre-requisities

- After downloading your csv file from your spreadsheet, convert your csv into json file [csv_to_json](https://data.page/csv/json)

### Conditions

- Topic Names to be given as per following convention only:  
  for JavaScript - JS  
  for Java - JAVA  
  for SQL - SQL  
  for ReactJS - REACT  
  for NodeJS - NODE  
  for HTML - HTML  
  for CSS - CSS  
  for Python - PYTHON

### Steps

Step-1:- Run the following command in terminal: `node generate_folders.js`.
Step-2:- Now save your obtained json file in **parent_json** directory.  
Step-3:- Run the following command in terminal: `node generate_prompts.js`.  
Step-4:- Run the following command in terminal: `node generate_responses.js`.  
Step-5:- Run the following command in terminal: `node generate_solutions.js`.
Step-6:- Run the following command in terminal: `node generate_markdown.js`.