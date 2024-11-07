const fs = require('fs')
const path = require('path')
const jsdom = require('jsdom')
const hljs = require('highlight.js/lib/common')
const macros = require('govuk-frontend/govuk-prototype-kit.config.json').nunjucksMacros
const macroImport = macros.map(macro => `{% from "${macro.importFrom}" import ${macro.macroName} %}`).join(' ')

String.prototype.url = function(){ return this[0] !== '/' ? `/${this}` : this }

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

const getQuestions = async (req, res) => {
  try {
    const files = getFilesInDirectory(
      'app/views',
      ['.html', '.njk'],
      ['layouts', 'branching-configuration.njk', 'branching-details.njk', 'type-of-input.njk', 'number-of-options.njk']
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
}

const configureBranching = async (req, res) => {
  if (req.session.data.nameOfInput?.length === 0 || req.session.data.nameOfInput === undefined) {
    return res.render('templates/branching-configuration', {error: true, errors: [{'href': '#nameOfInput', 'text': 'Enter a question name'}]})
  }
  const files = getFilesInDirectory(
      'app/views',
      ['.html', '.njk'],
      ['layouts', 'branching-configuration.njk', 'branching-details.njk', 'type-of-input.njk', 'number-of-options.njk']
    ); 
  const filesContent = await readFiles(files)
  const newEnv = res.app.locals.settings.nunjucksEnv;
  const renderedFiles = filesContent.map(content => new jsdom.JSDOM(newEnv.renderString(content)))
  req.session.data.answersToMap = undefined
  renderedFiles.some(file => {
    const inputs = file.window.document.querySelectorAll(`input[name="${req.session.data.nameOfInput}"]`)
    if (inputs.length > 0) {
      req.session.data.answersToMap = Array.from(inputs).map(input => ({type: input.type, value: input.value, label: input.parentElement.querySelector('label').textContent}))
    }
    return inputs.length > 0
  })
  if (req.session.data.answersToMap) {
    res.redirect('/branching-details')
  } else {
    req.session.data.typeOfInput = undefined
    req.session.data.numberOfOptions = undefined
    res.redirect('/type-of-input')
  }
}

const typeOfInputAnswer = (req, res) => {
  if (req.session.data.typeOfInput === undefined) {
    res.render('templates/type-of-input', {error: true, errors: [{'href': '#typeOfInput', 'text': 'Select if your input is a radio button or checkbox input.'}]})
  } else {
    res.redirect('number-of-options')
  }
}

const numberOfOptionsAnswer = (req, res) => {
  if (req.session.data.numberOfOptions.length === 0) {
    res.render('templates/number-of-options', {error: true, errors: [{'href': '#numberOfOptions', 'text': `Enter the number ${req.session.data.typeOfInput === 'radio' ? 'radio buttons' : 'checkboxes'} input has.`}]})
  } else if (isNaN(parseInt(req.session.data.numberOfOptions))) {
    res.render('templates/number-of-options', {error: true, errors: [{'href': '#numberOfOptions', 'text': 'Number of options must be a number.'}]})
  } else if (parseInt(req.session.data.numberOfOptions).toString() !== req.session.data.numberOfOptions) {
    res.render('templates/number-of-options', {error: true, errors: [{'href': '#numberOfOptions', 'text': 'Number of options must be a whole number.'}]})
  } else {
    res.redirect('/branching-details')
  }
}

const selectForBranching = (req, res) => {
  req.session.data.nameOfInput = req.query.nameOfInput
  req.session.data.typeOfInput = req.query.typeOfInput
  req.session.data.numberOfOptions = req.query.numberOfOptions
  res.redirect('/configure-branching')
}

const produceBranchingCode =(req, res) => {
  const nameOfInput = req.session.data.nameOfInput
  const numberOfOptions = parseInt(req.session.data.numberOfOptions)
  const cases = Array(numberOfOptions).fill(0).map((_, index) => {
    const answer =req.session.data[`answer-${index}`]
    const page = req.session.data[`page-${index}`]
    return (`\n    case '${answer}':\n      res.redirect('${page.url()}')\n      break`)
  })
  const switchCode = `switch (req.session.data['${nameOfInput}']) {${cases.join('')}\n  }`
  const routeCode = `router.get('/${nameOfInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}-answer', (req, res) => {\n  ${switchCode}\n})`
  req.session.data.code = routeCode
  res.redirect('/code-review')
}

const codeReview = (req, res) => {
  const nameOfInput = req.session.data.nameOfInput
  const code = req.session.data.code
  const highlightedCode = hljs.highlight(code, {language: 'js'}).value
  const formCode = `<form action="/${nameOfInput.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}-answer">\n  <!-- Your form field goes here -->\n</form>`
  const highlightedFormCode = hljs.highlight(formCode, {language: 'html'}).value
  res.render('templates/branching-code', {highlightedCode, highlightedFormCode})
}

module.exports = { 
  getQuestions,
  configureBranching,
  typeOfInputAnswer,
  numberOfOptionsAnswer,
  selectForBranching,
  produceBranchingCode,
  codeReview 
}
