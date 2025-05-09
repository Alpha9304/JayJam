# OOSE Team Project

Production Environment Link: [Team03 Project Production Environment](https://team03.crabdance.com)
- Fallback Production Environment: [Team03 Project Fallback Production Environment](https://team03.hopto.org/)
- Test Environment Link: [Team03 Project Test Environment](https://dev.team03.crabdance.com)
- Jenkins Link: [Jenkins Management Page](https://jenkins.team03.crabdance.com)

Name of the application goes here -- followed by a brief description (elevator pitch) of the application.

- [Team Information & Agreement](./docs/team-agreement.md)
- [Requirements Specification](./docs/requirements-specification.md)
- [Project Roadmap](./docs/roadmap.md)
- [Technical Documentation](./docs/technical-documentation.md)

## Notes
- Our deployment was working but suddenly stopped. We are using GCP VMs and it seems to be a problem on their end.

## Installing / Getting started

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v22.13.1)
- [Docker](https://www.docker.com/get-started/)
- [PNPM](https://pnpm.io/installation)
- [Next.js](https://nextjs.org/)

This project can run on Docker or locally. Both methods will require cloning the repository locally first, which requires Git to be installed before continuing.

### Cloning Repository

```
git clone https://github.com/cs421sp25-homework/team-03.git
```

Other options for cloning are through SSH and Github Desktop.

### Environment Set Up

Duplicate `.env.example` as `.env` inside `apps/server`. Then fill in required API keys.

### Running on Docker

Make sure Docker is installed on your machine. Then `cd` into the root directory and run the following command:

```shell
pnpm docker:dev
```

Then you should be able to access the application at `http://localhost:3000`

### Running Locally

In the root directory, install dependencies then run the project:

```shell
pnpm install
pnpm dev
```

Then you should be able to access the application at `http://localhost:3000`

## Developing

Detailed and step-by-step documentation for setting up local development. For example, a new team member will use these instructions to start developing the project further. 

```shell
commands here
```

You should include what is needed (e.g. all of the configurations) to set up the dev environment. For instance, global dependencies or any other tools (include download links), explaining what database (and version) has been used, etc. If there is any virtual environment, local server, ..., explain here. 

Additionally, describe and show how to run the tests, explain your code style and show how to check it.

If your project needs some additional steps for the developer to build the project after some code changes, state them here. Moreover, give instructions on how to build and release a new version. In case there's some step you have to take that publishes this project to a server, it must be stated here. 

## Contributing

Refer to the [Contributing Guidelines](./CONTRIBUTING.md) for information on how to contribute to the project.

## Licensing

Refer to the [Project Repository License](./LICENSE.md) for information on how the project is licensed.
