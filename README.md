# Bhumi Prabandhan

Land record management Angular application.

## Features

- **Login**: mobile-number based authentication with OTP verification (hardcoded OTP `123456` for now).
- **Home**: data for Mouja Gosain Pur, Thana No. 110 Shahpur Patti (from the source spreadsheet), shown as:
  - **Mouja & Khata Dharak** — the Mouja/Thana note and the Khata Dharak (original khata holders) table.
  - **Anshdaar-wise Rakba Distribution** — a pie chart of each Anshdaar's total Rakba, using the same colour code the source spreadsheet's "Result" table defines per Anshdaar.
  - **Khata / Khesara Wise Bhumi Vivaran** — a full-width, Khata No.–filterable table of every Khesara record with its Rakba, Dakhal (co-sharer shares), and note, matching the spreadsheet's own terminology (Khata, Khesara, Rakba, Dakhal, Anshdaar).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
