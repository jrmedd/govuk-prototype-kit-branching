//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

addFilter('errorFilter', (object, errors = []) => {
  let toReturn = { ...object }
  const relevantError = errors.find(error => error.href.replace('#', '') === object.name)
  if (relevantError) toReturn.errorMessage = { text: relevantError.text }
  return (toReturn)
})
