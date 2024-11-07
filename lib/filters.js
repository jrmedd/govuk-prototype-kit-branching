const { views } = require('govuk-prototype-kit')

views.addFilter('errorFilter', (object, errors = []) => {
  let toReturn = { ...object }
  const relevantError = errors.find(error => error.href.replace('#', '') === object.name)
  if (relevantError) toReturn.errorMessage = { text: relevantError.text }
  return (toReturn)
})
