//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
const fs = require('fs')
const jsdom = require('jsdom')
const path = require('path')
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const macros = require('govuk-frontend/govuk-prototype-kit.config.json').nunjucksMacros
const macroImport = macros.map(macro => `{% from "${macro.importFrom}" import ${macro.macroName} %}`).join(' ')


function getFilesInDirectory(dir, fileTypes = ['.html', '.njk'], ignoreDirs = []) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        // Recurse into subdirectory if it's not in the ignore list
        results = results.concat(getFilesInDirectory(filePath, fileTypes, ignoreDirs));
      }
    } else if (fileTypes.includes(path.extname(file))) {
      // Add file to the result if it matches the file types
      results.push(filePath);
    }
  });

  return results;
}

async function readFiles(filePaths) {
    const readPromises = filePaths.map(filePath => new Promise((resolve, reject) => fs.readFile(filePath, 'utf-8', (err, data) => resolve(data))));
    const fileContents = await Promise.all(readPromises);
    const fileContentsWithImports = fileContents.map(content => `${macroImport} ${content}`)
    return fileContentsWithImports
}

router.get('/files', async (req, res) => {
  const files = getFilesInDirectory(path.join(__dirname) + '/views', ['.html','.njk'], ['layouts'])
  const filesContent = await readFiles(files)
  const newEnv = res.app.locals.settings.nunjucksEnv
  const renderedFiles = filesContent.map(content => (new jsdom.JSDOM(newEnv.renderString(content))))
  res.json(files)
})

router.get('/configure-branching', async (req, res) => {
  const files = getFilesInDirectory(path.join(__dirname) + '/views', ['.html','.njk'], ['layouts', 'branching-configuration', 'branching-details'])
  const filesContent = await readFiles(files)
  const newEnv = res.app.locals.settings.nunjucksEnv
  const renderedFiles = filesContent.map(content => (new jsdom.JSDOM(newEnv.renderString(content))))
  req.session.data.answersToMap = undefined
  renderedFiles.some(file => {
    const inputs = file.window.document.querySelectorAll(`input[name="${req.session.data['name-of-input']}"]`)
    if (inputs.length > 0) {
      req.session.data.answersToMap = Array.from(inputs).map(input => ({type: input.type, value: input.value, label: input.parentElement.querySelector('label').textContent}))
    }
    return inputs.length > 0
  })
  res.redirect('/branching-details')
})

// Add your routes here
