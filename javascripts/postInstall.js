#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process')

const routesFile = path.join(process.env.INIT_CWD, '/app/routes.js')
const indexFile = path.join(process.env.INIT_CWD, '/app/views/index.html')

const routesLines =  [
  `/*`,
  `The code below this line adds the branching tool. You can remove it if you want the default prototype kit.`,
  `A how-to for this tool is available:`,
  `https://github.com/jrmedd/govuk-prototype-kit-branching/blob/main/README.md#how-it-works`,
  `*/`,
  `const { getQuestions, configureBranching, typeOfInputAnswer, numberOfOptionsAnswer, selectForBranching, produceBranchingCode, codeReview } = require('govuk-prototype-kit-branching')`,
  `router.get('/code-review', codeReview)`,
  `router.get('/configure-branching', configureBranching)`,
  `router.get('/get-questions', getQuestions)`,
  `router.get('/number-of-options-answer', numberOfOptionsAnswer)`,
  `router.get('/produce-branching-code', produceBranchingCode)`,
  `router.get('/select-for-branching', selectForBranching)`,
  `router.get('/type-of-input-answer', typeOfInputAnswer)`,
  `router.get('/branching-code', (req,res) => res.render('templates/branching-code.njk'))`,
  `router.get('/branching-configuration', (req,res) => res.render('templates/branching-configuration.njk'))`,
  `router.get('/branching-details', (req,res) => res.render('templates/branching-details.njk'))`,
  `router.get('/number-of-options', (req,res) => res.render('templates/number-of-options.njk'))`,
  `router.get('/type-of-input', (req,res) => res.render('templates/type-of-input.njk'))`,
  `/* The code above this line adds the branching tool. You can remove it if you want the default prototype kit.`,
  `*/`,
  ``
]

const indexLines = [
  `    <h2 class="govuk-heading-l">Branching questions</h2>`,
  `    <p class="govuk-body"><a class="govuk-link govuk-link--no-visited-state" href="/branching-configuration">Configure branching questions</a></p>`,
  `    <hr class="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-9">`,
  ``
]

const routesFileContent = fs.readFileSync(routesFile, 'utf8');
const routesFileLines = routesFileContent.split('\n'); // Split the file into lines
if (!routesFileLines.includes(routesLines[1])) {
  routesFileLines.splice(routesFileLines.length, 0, ...routesLines);
  const updatedContent = routesFileLines.join('\n');
  fs.writeFileSync(routesFile, updatedContent, 'utf8');
  console.info('Inserted branching code to routes.js')
} 
else {
  console.info('Already inserted branching code routes.js')
}

const indexFileContent = fs.readFileSync(indexFile, 'utf8');
const indexFileLines = indexFileContent.split('\n'); // Split the file into lines
if (!indexFileLines.includes(indexLines[1])) {
  indexFileLines.splice(11, 0, ...indexLines);
  const updatedContent = indexFileLines.join('\n');
  fs.writeFileSync(indexFile, updatedContent, 'utf8');
  console.info('Inserted branching code to index.html')
} 
else {
  console.info('Already inserted branching code index.html')
}
