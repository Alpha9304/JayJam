# OOSE Team03 Project: JayJam
JayJam is a streamlined student collaboration platform designed to help students connect, organize events, and manage class activities with ease.
Current version only supports Johns Hopkins University students.

### Deployment-relevant links
Production Environment Link: [Team03 Project Production Environment](https://team03.crabdance.com)
- Fallback Production Environment: [Team03 Project Fallback Production Environment](https://team03.hopto.org/)
- Test Environment Link: [Team03 Project Test Environment](https://dev.team03.crabdance.com)
- Jenkins Link: [Jenkins Management Page](https://jenkins.team03.crabdance.com)

### Documents
- [Team Information & Agreement](./docs/team-agreement.md)
- [Requirements Specification](./docs/requirements-specification.md)
- [Project Roadmap](./docs/roadmap.md)
- [Technical Documentation](./docs/technical-documentation.md)

## Local Running Instruction

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

Then you should be able to access the application at `http://localhost:3002`

### Running Locally

In the root directory, install dependencies then run the project:

```shell
pnpm install
pnpm dev
```

Then you should be able to access the application at `http://localhost:3002`

## Contributing

Refer to the [Contributing Guidelines](./CONTRIBUTING.md) for information on how to contribute to the project.

## Licensing

Refer to the [Project Repository License](./LICENSE.md) for information on how the project is licensed.
