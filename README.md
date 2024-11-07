# GOVUK Prototype Kit Branching Plugin

![Walkthrough of code generation](./branching.gif?raw=true)

`govuk-prototype-kit-branching` is a plugin for the [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/) that simplifies creating branching logic for your prototype’s journeys by automatically generating route code for `routes.js`. This tool is designed to support users who may find branching logic challenging to implement manually.

## Features

* **Step-by-step configuration** – Add branching logic with a series of guided steps:
	* Define the field name and question type (currently supports radios; checkboxes coming soon)
	* Set the number of options
	* Specify the destination page for each option
* **Smart retrieval of existing questions** – If questions are already set up in the app/views folder, the tool will fetch these to simplify the branching setup by skipping directly to route selection. This requires inputs to be properly structured with a name, values, labels, and a fieldset/legend.
* **Accessible entry point** – Access the tool at `/branching-configuration` or from the main `index.html` page in your prototype.

## Installation

Install the plugin with npm:

```bash
npm install govuk-prototype-kit-branching
```

Configuration of your prototype to use this tool is automatic.

## Usage

### Step by step

1.	**Access the tool**: Visit `/branching-configuration` in your running prototype, or follow the link from the main `index.html` page.
2.	**Configure your branching**:
	* **Name the field** – Enter the field `name` for the question you want to branch from.
	* **Choose question type** – Currently, only radio buttons are supported.
	* **Define options** – Specify the number of options for the question.
	* **Set routes** – For each option, select the page it should route to.
3.	**Generate the code**: Once completed, the branching code will be added to your `routes.js` file, ready to be used in your prototype.

### Fetching existing questions

If your prototype already contains questions in the `app/views` folder, the tool can retrieve those fields and pre-fill the setup. Ensure the following for compatibility:

* Inputs have a `name` attribute.
* Options include `value` and `label`
* Questions have a `fieldset` and have a `legend`.

Refer to the [GOV.UK Design System](https://design-system.service.gov.uk/) and [GOV.UK Prototype Kit documentation](https://prototype-kit.service.gov.uk/docs/) for guidelines on setting up questions correctly.

## Future plans

* **Checkbox routing support**: Checkbox support will be added soon, allowing for more complex branching logic based on multi-select responses.


