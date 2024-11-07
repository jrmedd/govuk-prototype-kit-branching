//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

String.prototype.title = function() {return this.charAt(0).toUpperCase() + this.slice(1)}

Array.prototype.pluck = function(key, delimiter) {return this.map(item => item[key]).join(delimiter)}

async function fetchQuestions() {
  const request = await fetch('/get-questions')
  if (request.status === 200) {
    request.json().then(data => {
      const questionList = document.createElement('ul')
      questionList.classList.add('govuk-list')
      data.forEach(question => {
        const listItem = document.createElement('li')
        const subListItem = document.createElement('ul')
        subListItem.innerHTML = `<li>Type: ${ question.type.title() } (${question.items.length} items)</li><li>Name: <code>"${question.name}"</code></li><li>Options: ${question.items.pluck('label', ', ')}</li>`
        listItem.innerHTML = `<a class="govuk-link govuk-link--no-visited-state" href="/select-for-branching?nameOfInput=${question.name}&typeOfInput=${question.type}&numberOfOptions=${question.items.length}">${question.question}</a>`
        listItem.appendChild(subListItem)
        questionList.appendChild(listItem)
      })
      if (data.length > 0 ) {
        document.querySelector('#existing-questions').replaceChild(questionList, document.querySelector('#loading'))
      } else {
        const noQuestions = document.createElement('div')
        noQuestions.classList.add('govuk-warning-text')
        noQuestions.innerHTML = `<span class="govuk-warning-text__icon" aria-hidden="true">!</span> <strong class="govuk-warning-text__text"> <span class="govuk-visually-hidden">Warning</span> Unable to find any existing questions. Check that questions have 'name' and 'value' set and refresh this page.</strong>`
        document.querySelector('#existing-questions').replaceChild(noQuestions, document.querySelector('#loading'))
      }
    })
  }
}

async function codeToClipboard(event) {
  const code = event.target.parentElement.querySelector('code')
  await navigator.clipboard.writeText(code.textContent)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (['/branching-configuration', '/configure-branching'].includes(location.pathname)) fetchQuestions() 
  if (['/code-review'].includes(location.pathname)) document.querySelectorAll('.app-copy-button').forEach(button => button.addEventListener('click', codeToClipboard))
})
 