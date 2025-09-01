import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import type {
  WhisperModel,
  ModelDownloadProgress,
  DownloadProgressInfo,
} from '../types';

export class ModelDownloader {
  private static instance: ModelDownloader;
  private downloadCallbacks: Map<
    string,
    (progress: ModelDownloadProgress) => void
  > = new Map();
  private loggedProgress: Set<string> = new Set();

  static getInstance(): ModelDownloader {
    if (!ModelDownloader.instance) {
      ModelDownloader.instance = new ModelDownloader();
    }
    return ModelDownloader.instance;
  }

  private getModelDirectory(): string {
    const baseDir =
      Platform.OS === 'ios'
        ? RNFS.LibraryDirectoryPath
        : RNFS.ExternalDirectoryPath;
    return `${baseDir}/VoiceAgentModels`;
  }

  private getWhisperModelUrl(modelName: WhisperModel['name']): string {
    const baseUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';
    return `${baseUrl}/ggml-${modelName}.bin`;
  }

  private getLlamaModelUrl(modelName: string): string {
    const modelUrls: Record<string, string> = {
      'llama-3.2-3b-instruct-q4_k_m.gguf':
        'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
      'llama-3.2-1b-instruct-q4_k_m.gguf':
        'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
      'default':
        'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    };

    return modelUrls[modelName] || modelUrls.default!;
  }

  private async ensureModelDirectory(): Promise<void> {
    const modelDir = this.getModelDirectory();
    const dirExists = await RNFS.exists(modelDir);
    if (!dirExists) {
      await RNFS.mkdir(modelDir);
    }
  }

  private async checkAvailableSpace(requiredBytes: number): Promise<boolean> {
    try {
      const freeSpace = await RNFS.getFSInfo();
      return freeSpace.freeSpace > requiredBytes * 1.2; // 20% buffer
    } catch (error) {
      return true; // Assume we have space if we can't check
    }
  }

  async isModelDownloaded(modelName: string): Promise<boolean> {
    const modelPath = this.getModelPath(modelName);
    return await RNFS.exists(modelPath);
  }

  getModelPath(modelName: string): string {
    return `${this.getModelDirectory()}/${modelName}`;
  }

  async clearCorruptedModel(modelName: string): Promise<void> {
    const modelPath = this.getModelPath(modelName);
    try {
      if (await RNFS.exists(modelPath)) {
        await RNFS.unlink(modelPath);
      }
    } catch (error) {
      console.error('Error clearing corrupted model:', error);
    }
  }

  async downloadWhisperModel(
    modelName: WhisperModel['name'],
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<string> {
    const modelPath = this.getModelPath(`ggml-${modelName}.bin`);

    if (await this.isModelDownloaded(`ggml-${modelName}.bin`)) {
      return modelPath;
    }

    await this.ensureModelDirectory();
    const url = this.getWhisperModelUrl(modelName);

    // Estimate model sizes (in bytes)
    const modelSizes: Record<WhisperModel['name'], number> = {
      'tiny.en': 39 * 1024 * 1024,
      'base.en': 142 * 1024 * 1024,
      'small.en': 466 * 1024 * 1024,
      'medium.en': 1500 * 1024 * 1024,
      'large-v2': 3000 * 1024 * 1024,
      'large-v3': 3000 * 1024 * 1024,
    };

    const expectedSize = modelSizes[modelName];

    if (!(await this.checkAvailableSpace(expectedSize))) {
      throw new Error(
        `Insufficient storage space. Need ${Math.round(expectedSize / (1024 * 1024))}MB`
      );
    }

    return new Promise((resolve, reject) => {
      const downloadId = `whisper-${modelName}`;

      if (onProgress) {
        this.downloadCallbacks.set(downloadId, onProgress);
      }

      const download = RNFS.downloadFile({
        fromUrl: url,
        toFile: modelPath,
        progress: (res: DownloadProgressInfo) => {
          const progress: ModelDownloadProgress = {
            modelName: `whisper-${modelName}`,
            downloaded: res.bytesWritten,
            total: res.contentLength,
            percentage:
              res.contentLength > 0
                ? (res.bytesWritten / res.contentLength) * 100
                : 0,
            isComplete: false,
          };

          const callback = this.downloadCallbacks.get(downloadId);
          if (callback) {
            callback(progress);
          }
        },
      });

      download.promise
        .then(() => {
          const finalProgress: ModelDownloadProgress = {
            modelName: `whisper-${modelName}`,
            downloaded: expectedSize,
            total: expectedSize,
            percentage: 100,
            isComplete: true,
          };

          const callback = this.downloadCallbacks.get(downloadId);
          if (callback) {
            callback(finalProgress);
          }

          this.downloadCallbacks.delete(downloadId);
          resolve(modelPath);
        })
        .catch((error: Error) => {
          this.downloadCallbacks.delete(downloadId);
          reject(
            new Error(`Failed to download Whisper model: ${error.message}`)
          );
        });
    });
  }

  async downloadLlamaModel(
    modelName: string,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<string> {
    const modelPath = this.getModelPath(modelName);

    // Check if model exists and validate it
    if (await RNFS.exists(modelPath)) {
      try {
        const stats = await RNFS.stat(modelPath);
        // If file is too small, it's likely corrupted
        if (stats.size < 100 * 1024 * 1024) {
          // Less than 100MB
          await RNFS.unlink(modelPath);
        } else {
          return modelPath;
        }
      } catch (error) {
        try {
          await RNFS.unlink(modelPath);
        } catch (deleteError) {
          // Ignore delete errors
        }
      }
    }

    await this.ensureModelDirectory();
    const url = this.getLlamaModelUrl(modelName);

    // Verify directory exists
    const modelDir = this.getModelDirectory();
    try {
      await RNFS.stat(modelDir);
    } catch (dirError) {
      const message =
        dirError instanceof Error ? dirError.message : String(dirError);
      throw new Error(`Cannot access model directory: ${message}`);
    }

    // Estimate model size based on model name
    let expectedSize: number;
    if (modelName.includes('1b')) {
      expectedSize = 800 * 1024 * 1024; // ~800MB for 1B model
    } else if (modelName.includes('3b')) {
      expectedSize = 1.8 * 1024 * 1024 * 1024; // 1.8GB for 3B model
    } else {
      expectedSize = 1.0 * 1024 * 1024 * 1024; // 1GB default
    }

    if (!(await this.checkAvailableSpace(expectedSize))) {
      throw new Error(
        `Insufficient storage space. Need ${Math.round(expectedSize / (1024 * 1024 * 1024))}GB`
      );
    }

    // Quick connectivity test first
    try {
      const testResponse = await fetch(url, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`Server returned ${testResponse.status}`);
      }
    } catch (testError) {
      const message =
        testError instanceof Error ? testError.message : String(testError);
      throw new Error(`Cannot reach download server: ${message}`);
    }

    return new Promise((resolve, reject) => {
      const downloadId = `llama-${modelName}`;

      if (onProgress) {
        this.downloadCallbacks.set(downloadId, onProgress);

        // Report initial progress to show download is starting
        onProgress({
          modelName: `llama-${modelName}`,
          downloaded: 0,
          total: expectedSize,
          percentage: 0,
          isComplete: false,
        });
      }

      // Add timeout to prevent infinite hanging
      const downloadTimeout = setTimeout(
        () => {
          reject(
            new Error(
              'Download timeout - the model download is taking too long.'
            )
          );
        },
        10 * 60 * 1000
      ); // 10 minutes

      const download = RNFS.downloadFile({
        fromUrl: url,
        toFile: modelPath,
        connectionTimeout: 30000,
        readTimeout: 300000,
        progress: (res: DownloadProgressInfo) => {
          const progress: ModelDownloadProgress = {
            modelName: `llama-${modelName}`,
            downloaded: res.bytesWritten,
            total: res.contentLength,
            percentage:
              res.contentLength > 0
                ? (res.bytesWritten / res.contentLength) * 100
                : 0,
            isComplete: false,
          };

          // Always call the callback to ensure UI updates
          const callback = this.downloadCallbacks.get(downloadId);
          if (callback) {
            callback(progress);
          }

          // Also log progress for debugging (every 10%)
          const roundedPercentage = Math.floor(progress.percentage / 10) * 10;
          const key = `${downloadId}-${roundedPercentage}`;
          if (!this.loggedProgress.has(key) && roundedPercentage > 0) {
            console.log(
              `Download progress: ${Math.round(progress.percentage)}% (${Math.round(res.bytesWritten / (1024 * 1024))}MB / ${Math.round(res.contentLength / (1024 * 1024))}MB)`
            );
            this.loggedProgress.add(key);
          }
        },
      });

      download.promise
        .then(() => {
          clearTimeout(downloadTimeout);
          const finalProgress: ModelDownloadProgress = {
            modelName: `llama-${modelName}`,
            downloaded: expectedSize,
            total: expectedSize,
            percentage: 100,
            isComplete: true,
          };

          const callback = this.downloadCallbacks.get(downloadId);
          if (callback) {
            callback(finalProgress);
          }

          this.downloadCallbacks.delete(downloadId);
          resolve(modelPath);
        })
        .catch((error: Error) => {
          clearTimeout(downloadTimeout);
          this.downloadCallbacks.delete(downloadId);
          reject(new Error(`Failed to download Llama model: ${error.message}`));
        });
    });
  }

  async validateModel(
    modelPath: string,
    expectedSize?: number
  ): Promise<boolean> {
    try {
      const stats = await RNFS.stat(modelPath);
      if (expectedSize) {
        // Allow 5% variance in file size
        const variance = expectedSize * 0.05;
        return Math.abs(stats.size - expectedSize) <= variance;
      }
      return stats.size > 0;
    } catch (error) {
      return false;
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    const modelPath = this.getModelPath(modelName);
    const exists = await RNFS.exists(modelPath);
    if (exists) {
      await RNFS.unlink(modelPath);
    }
  }

  async getModelSize(modelName: string): Promise<number> {
    const modelPath = this.getModelPath(modelName);
    try {
      const stats = await RNFS.stat(modelPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async listDownloadedModels(): Promise<string[]> {
    try {
      const modelDir = this.getModelDirectory();
      const exists = await RNFS.exists(modelDir);
      if (!exists) {
        return [];
      }
      return await RNFS.readdir(modelDir);
    } catch (error) {
      return [];
    }
  }

  async clearAllModels(): Promise<void> {
    const modelDir = this.getModelDirectory();
    const exists = await RNFS.exists(modelDir);
    if (exists) {
      await RNFS.unlink(modelDir);
    }
  }
}
