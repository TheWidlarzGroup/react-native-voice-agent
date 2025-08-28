# Contributing to React Native Voice Agent

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## 🚀 React Native Voice Agent Overview

This library provides a complete offline AI voice agent for React Native applications, featuring:

- **Speech-to-Text (STT)**: Using Whisper models for accurate transcription
- **Large Language Model (LLM)**: Using Llama models for intelligent responses  
- **Text-to-Speech (TTS)**: Using native device TTS engines
- **Voice Activity Detection (VAD)**: Smart detection of speech start/end
- **Model Management**: Automatic downloading and caching of AI models
- **Cross-platform**: Full iOS and Android support

## Development Workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

### Prerequisites

Make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

### Installation

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

### Development Setup

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

#### Native Development

If you want to use Android Studio or XCode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/VoiceAgentExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > react-native-voice-agent`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-voice-agent` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "VoiceAgentExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

## 🔧 Development Commands

### Quality Assurance

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck  # Type checking with TypeScript
yarn lint       # ESLint code quality checks
```

To fix formatting errors, run the following:

```sh
yarn lint --fix  # Auto-fix ESLint issues
```

### Testing

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Architecture Guidelines

When contributing to the voice agent library, please follow these architectural principles:

#### 🏗️ Service Layer Architecture
- **WhisperService**: Handles speech-to-text transcription
- **LlamaService**: Manages LLM inference and conversation context
- **TTSService**: Controls text-to-speech synthesis
- **ModelDownloader**: Handles AI model downloading and caching

#### 🎯 Builder Pattern Usage
All services use a builder pattern for configuration:

```typescript
const agent = VoiceAgent.create()
  .withWhisper('base.en')
  .withLlama('llama-3.2-3b-instruct-q4_k_m.gguf')
  .withSystemPrompt('You are a helpful assistant.')
  .enableVAD(true)
  .build();
```

#### 📱 React Hooks Integration
Provide React hooks for easy integration:
- `useVoiceAgent`: Basic voice agent functionality
- `useAdvancedVoiceAgent`: Advanced features with fine-grained control
- `usePermissions`: Audio/microphone permission management

#### 🔒 Type Safety
- Use strict TypeScript throughout
- Define comprehensive interfaces in `src/types/index.ts`
- Ensure all public APIs are properly typed

#### 📂 File Structure Guidelines
```
src/
├── VoiceAgent.ts           # Main class and builder
├── types/                  # TypeScript definitions
├── services/              # Core services
│   ├── WhisperService.ts
│   ├── LlamaService.ts
│   └── TTSService.ts
├── utils/                 # Utilities
│   ├── modelDownloader.ts
│   └── audioUtils.ts
├── hooks/                 # React hooks
├── components/            # UI components
└── index.ts              # Main exports
```

### 🚨 Common Pitfalls

1. **Mock Implementations**: Development uses mock implementations for native libraries. Ensure production code uses real implementations.

2. **Error Handling**: Always implement proper error handling with structured `ServiceError` objects.

3. **Memory Management**: Properly dispose of services and clean up resources, especially for native modules.

4. **Audio Session Management**: Handle audio session lifecycle properly for cross-platform compatibility.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
