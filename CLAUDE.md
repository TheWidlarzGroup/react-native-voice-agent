# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native library for offline AI voice agents using Whisper (STT), Llama (LLM), and system TTS. The library provides a complete voice conversation experience with zero API costs and full offline functionality.

## Essential Development Commands

```bash
# Build the library
yarn prepare

# Type checking
yarn typecheck

# Linting
yarn lint

# Run tests
yarn test

# Clean build artifacts
yarn clean

# Work with example app
yarn example start        # Start Metro bundler
yarn example ios          # Run iOS example
yarn example android      # Run Android example
yarn example pods         # Install iOS pods
```

## Architecture Overview

### Core Design Pattern
The library follows a **Builder + Service + Hook** architecture:

1. **VoiceAgent** (main class) - Built using Builder pattern, orchestrates all services
2. **Services Layer** - WhisperService, LlamaService, TTSService handle specific AI tasks
3. **Hooks Layer** - React hooks (useVoiceAgent, useAdvancedVoiceAgent) for state management
4. **Components Layer** - Optional UI components with built-in logic

### Key Architectural Decisions

**State Management**: Uses Zustand internally for VoiceAgent state, exposed via React hooks
- VoiceAgentImpl maintains internal Zustand store
- Hooks subscribe to state changes via observer pattern
- State flows: Audio Input → VAD → Whisper → Llama → TTS → Audio Output

**Service Layer Abstraction**: Each AI capability is encapsulated in a service class
- WhisperService: Handles STT with model management and VAD
- LlamaService: Manages LLM with conversation history and context
- TTSService: Controls speech synthesis with interruption support
- ModelDownloader: Handles runtime model downloading with progress tracking

**Builder Pattern Usage**: VoiceAgent uses fluent builder pattern for configuration
- VoiceAgentBuilderImpl validates and builds final VoiceAgentConfig
- Supports method chaining: `.withWhisper().withLlama().withSystemPrompt().build()`
- Required fields validated at build time, not runtime

## Critical Implementation Details

### Model Management System
- Models downloaded to platform-specific directories at runtime
- WhisperService supports multiple model sizes (tiny.en to large-v3)
- LlamaService uses quantized models for mobile performance
- ModelDownloader handles validation, caching, and cleanup

### Audio Pipeline Architecture
```
Microphone → AudioBuffer → VAD → WhisperService → LlamaService → TTSService → Speaker
     ↑                                                                         ↓
     └── Barge-in Detection ←── Audio Session Manager ←── TTS Monitor ←────────┘
```

### Hook State Flow
- `useVoiceAgent`: Basic hook wrapping VoiceAgent with permission handling
- `useAdvancedVoiceAgent`: Extended hook with conversation management, auto-mode, status helpers
- Both hooks handle cleanup, permission checks, and error boundaries

### Service Dependencies
- All services implement async `initialize()`, `dispose()` pattern
- Services are initialized in sequence: Whisper → Llama → TTS
- Error handling propagates through service → VoiceAgent → hooks → UI

## Working with the Codebase

### Adding New Features
1. **Service Extensions**: Add new methods to existing services (WhisperService, LlamaService, TTSService)
2. **Hook Extensions**: Extend useAdvancedVoiceAgent for new state management needs
3. **Component Variants**: Create new components in `/components` following VoiceAgentButton pattern
4. **Type Definitions**: Always update `/types/index.ts` for new interfaces

### Testing Strategy
- Unit tests for individual services and utilities
- Integration tests for VoiceAgent builder and hooks
- Example app serves as manual testing environment

### Key Files to Understand
- `src/VoiceAgent.ts`: Core orchestrator class with builder implementation
- `src/hooks/useVoiceAgent.ts`: React integration layer with state management
- `src/types/index.ts`: Complete type definitions for library API
- `src/index.ts`: Barrel exports defining public API surface

### State Management Patterns
- Internal state managed by Zustand in VoiceAgentImpl
- React hooks provide reactive interface to internal state
- Component props flow down, callbacks flow up
- Error states bubble up through promise chains to hook level

## Development Environment

### Required Dependencies
- React Native 0.79+
- TypeScript 5.8+
- Node.js for tooling
- iOS: Xcode with Metal support for GPU acceleration
- Android: NDK for native module compilation

### Pre-commit Hooks (Lefthook)
- ESLint runs on staged JS/TS files
- TypeScript compiler checks on staged files  
- Commitlint validates commit message format
- All checks must pass before commit

### Build System
- Uses react-native-builder-bob for library compilation
- TypeScript compiled to lib/typescript
- ES modules compiled to lib/module
- Source maps generated for debugging

### Example App Structure
- Comprehensive demo with 3 usage patterns: Basic, Advanced, Custom
- Demonstrates hook usage, component integration, and error handling
- Includes conversation logging, download progress, permission management
- Serves as both documentation and manual testing environment

## Common Maintenance Tasks

### Updating AI Models
- Modify WhisperService.getSupportedModels() for new Whisper models
- Update ModelDownloader URLs and validation for new model sources
- Test model compatibility across iOS/Android platforms

### Performance Optimization
- Profile model loading times and memory usage
- Optimize audio buffer sizes in AudioBufferManager
- Tune VAD sensitivity thresholds for different use cases
- Monitor GPU acceleration effectiveness on target devices

### Cross-Platform Compatibility
- Test audio session management on both platforms
- Validate permission flows across iOS/Android differences  
- Ensure TTS voice quality consistency across system voices
- Handle platform-specific audio hardware variations

The codebase prioritizes offline functionality, zero API costs, and production-ready error handling while maintaining a modern React Native developer experience.