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


function getFilesInDirectory(dir, fileTypes = ['.html', '.njk'], ignore = []) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (!ignore.includes(file)) {
        // Recurse into subdirectory if it's not in the ignore list
        results = results.concat(getFilesInDirectory(filePath, fileTypes, ignore));
      }
    } else if (fileTypes.includes(path.extname(file)) && !ignore.includes(file)) {
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

router.get('/get-questions', async (req, res) => {
  try {
    const files = getFilesInDirectory(
      path.join(__dirname, 'views'),
      ['.html', '.njk'],
      ['layouts', 'branching-configuration.html', 'branching-details.html', 'type-of-question.html', 'number-of-options.html']
    );
    const filesContent = await readFiles(files);
    const newEnv = res.app.locals.settings.nunjucksEnv;
    const questions = filesContent.flatMap(content => {
      const document = new jsdom.JSDOM(newEnv.renderString(content)).window.document;
      const inputs = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'));

      return inputs.map((input, inputIndex) => {
        const fieldsetElement = input.closest('fieldset');
        return {
          name: input.name,
          value: input.value,
          label: input.nextElementSibling?.textContent.trim() || `Answer ${inputIndex}`,
          type: input.type,
          fieldset: fieldsetElement ? fieldsetElement.querySelector('legend')?.textContent.trim() : 'Fieldset'
        };
      });
    }).filter(Boolean);
    const groupedQuestions = questions.reduce((acc, { name, value, label, type, fieldset }) => {
      let group = acc.find(g => g.question === fieldset);
      if (!group) {
        group = { question: fieldset, name, type, items: [] };
        acc.push(group);
      }
      group.items.push({ value, label });
      return acc;
    }, []);

    res.json(groupedQuestions);
  } catch (error) {
    console.error('Error processing questions:', error);
    res.status(500).send('Error processing questions');
  }
});

router.get('/configure-branching', async (req, res) => {
const files = getFilesInDirectory(
      path.join(__dirname, 'views'),
      ['.html', '.njk'],
      ['layouts', 'branching-configuration.html', 'branching-details.html', 'type-of-question.html', 'number-of-options.html']
    ); 
  const filesContent = await readFiles(files)
  const newEnv = res.app.locals.settings.nunjucksEnv;
  const renderedFiles = filesContent.map(content => new jsdom.JSDOM(newEnv.renderString(content)))
  req.session.data.answersToMap = undefined
  renderedFiles.some(file => {
    const inputs = file.window.document.querySelectorAll(`input[name="${req.session.data['name-of-input']}"]`)
    if (inputs.length > 0) {
      req.session.data.answersToMap = Array.from(inputs).map(input => ({type: input.type, value: input.value, label: input.parentElement.querySelector('label').textContent}))
    }
    return inputs.length > 0
  })
  if (req.session.data.answersToMap) {
    res.redirect('/branching-details')
  } else {
    res.redirect('/type-of-question')
  }
})

router.get('/select-for-branching', (req, res) => {
  req.session.data['name-of-input'] = req.query.name
  res.redirect('/configure-branching')
})

// Add your routes here
