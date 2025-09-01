import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import Video from 'react-native-video';
import type { VideoRef } from 'react-native-video';
import Voice from '@react-native-voice/voice';
import type { SpeechResultsEvent } from '@react-native-voice/voice';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { matchIntent } from '../../src/integrations/videoController';

export default function App() {
  const videoRef = useRef<VideoRef>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [videoState, setVideoState] = useState({
    paused: false,
    muted: false,
    fullscreen: false,
    currentTime: 0,
    volume: 1.0,
  });

  useEffect(() => {
    const executeVideoCommand = async (intentResult: any) => {
      const video = videoRef.current;
      if (!video) {
        console.error('Video ref not available');
        return;
      }

      try {
        switch (intentResult.intent) {
          case 'PAUSE':
            video.pause();
            setVideoState((prev) => ({ ...prev, paused: true }));
            break;
          case 'PLAY':
          case 'RESUME':
            video.resume();
            setVideoState((prev) => ({ ...prev, paused: false }));
            break;
          case 'SEEK_REL':
            if (intentResult.slots.seconds) {
              const newTime = Math.max(
                0,
                videoState.currentTime + intentResult.slots.seconds
              );
              video.seek(newTime);
              setVideoState((prev) => ({ ...prev, currentTime: newTime }));
            }
            break;
          case 'SEEK_ABS':
            if (intentResult.slots.timestamp) {
              video.seek(intentResult.slots.timestamp);
              setVideoState((prev) => ({
                ...prev,
                currentTime: intentResult.slots.timestamp,
              }));
            }
            break;
          case 'VOLUME_UP': {
            const newVolumeUp = Math.min(1.0, videoState.volume + 0.1);
            video.setVolume(newVolumeUp);
            setVideoState((prev) => ({ ...prev, volume: newVolumeUp }));
            break;
          }
          case 'VOLUME_DOWN': {
            const newVolumeDown = Math.max(0, videoState.volume - 0.1);
            video.setVolume(newVolumeDown);
            setVideoState((prev) => ({ ...prev, volume: newVolumeDown }));
            break;
          }
          case 'VOLUME_SET':
            if (intentResult.slots.percent !== undefined) {
              const volumeLevel = intentResult.slots.percent / 100;
              video.setVolume(volumeLevel);
              setVideoState((prev) => ({ ...prev, volume: volumeLevel }));
            }
            break;
          case 'MUTE':
            video.setVolume(0);
            setVideoState((prev) => ({ ...prev, muted: true }));
            break;
          case 'UNMUTE':
            video.setVolume(videoState.volume);
            setVideoState((prev) => ({ ...prev, muted: false }));
            break;
          case 'FULLSCREEN_ENTER':
            video.setFullScreen(true);
            setVideoState((prev) => ({ ...prev, fullscreen: true }));
            break;
          case 'FULLSCREEN_EXIT':
            video.setFullScreen(false);
            setVideoState((prev) => ({ ...prev, fullscreen: false }));
            break;
          case 'RESTART':
            video.seek(0);
            video.resume();
            setVideoState((prev) => ({
              ...prev,
              currentTime: 0,
              paused: false,
            }));
            break;
          default:
            console.warn(
              `Intent ${intentResult.intent} not implemented in demo`
            );
            break;
        }
      } catch (error) {
        console.error('Error executing video command:', error);
      }
    };

    const handleVoiceCommand = (text: string) => {
      console.log('Processing voice command:', text);

      try {
        const intentResult = matchIntent(text);
        if (intentResult) {
          console.log('Intent matched:', intentResult);
          setLastCommand(`${intentResult.intent}: ${text}`);
          executeVideoCommand(intentResult);
        } else {
          setLastCommand(`No intent matched for: ${text}`);
        }
      } catch (error) {
        console.error('Error processing voice command:', error);
        setLastCommand(`Error processing: ${text}`);
      }
    };

    const setupVoiceRecognition = () => {
      Voice.onSpeechStart = () => {
        console.log('Speech started');
      };

      Voice.onSpeechEnd = () => {
        console.log('Speech ended');
        setIsListening(false);
      };

      Voice.onSpeechResults = (event: SpeechResultsEvent) => {
        const recognizedTextResult = event.value?.[0] || '';
        setRecognizedText(recognizedTextResult);
        handleVoiceCommand(recognizedTextResult);
      };

      Voice.onSpeechError = (event: any) => {
        console.error('Speech error:', event);
        setIsListening(false);
      };
    };

    setupVoiceRecognition();
    requestMicrophonePermission();

    return () => {
      Voice.destroy();
    };
  }, [videoState.currentTime, videoState.volume]);

  const requestMicrophonePermission = async () => {
    try {
      const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice control',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  // setupVoiceRecognition moved inside useEffect above

  // handleVoiceCommand moved inside useEffect above

  // executeVideoCommand moved inside useEffect above

  const startListening = async () => {
    try {
      setIsListening(true);
      setRecognizedText('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsListening(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{
            uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          }}
          style={styles.video}
          paused={videoState.paused}
          muted={videoState.muted}
          volume={videoState.volume}
          resizeMode="contain"
          onProgress={(data) => {
            setVideoState((prev) => ({
              ...prev,
              currentTime: data.currentTime,
            }));
          }}
          onLoad={(data) => {
            console.log('Video loaded:', data);
          }}
          onError={(error) => {
            console.error('Video error:', error);
          }}
        />
      </View>

      {/* Controls */}
      <ScrollView
        style={styles.controlsContainer}
        contentContainerStyle={styles.controlsContent}
      >
        {/* Voice Control Button */}
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={styles.voiceButtonText}>
            {isListening ? '🛑 Stop Listening' : '🎤 Start Voice Control'}
          </Text>
        </TouchableOpacity>

        {/* Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Voice Recognition Status:</Text>
          <Text style={styles.statusText}>
            {isListening ? 'Listening...' : 'Ready'}
          </Text>

          {recognizedText ? (
            <>
              <Text style={styles.statusTitle}>Last Recognized:</Text>
              <Text style={styles.recognizedText}>"{recognizedText}"</Text>
            </>
          ) : null}

          {lastCommand ? (
            <>
              <Text style={styles.statusTitle}>Last Command:</Text>
              <Text style={styles.commandText}>{lastCommand}</Text>
            </>
          ) : null}
        </View>

        {/* Video State Display */}
        <View style={styles.videoStateContainer}>
          <Text style={styles.statusTitle}>Video State:</Text>
          <Text style={styles.statusText}>
            Paused: {videoState.paused ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Muted: {videoState.muted ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Volume: {Math.round(videoState.volume * 100)}%
          </Text>
          <Text style={styles.statusText}>
            Time: {Math.round(videoState.currentTime)}s
          </Text>
        </View>

        {/* Voice Commands Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Try these voice commands:</Text>
          <Text style={styles.helpText}>• "pause" / "play" / "resume"</Text>
          <Text style={styles.helpText}>
            • "skip ahead 10" / "rewind 30 seconds"
          </Text>
          <Text style={styles.helpText}>
            • "go to 2 minutes" / "go to 1:30"
          </Text>
          <Text style={styles.helpText}>
            • "volume up" / "volume down" / "mute"
          </Text>
          <Text style={styles.helpText}>• "set volume to 50 percent"</Text>
          <Text style={styles.helpText}>
            • "fullscreen" / "exit fullscreen"
          </Text>
          <Text style={styles.helpText}>• "restart" / "unmute"</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  controlsContent: {
    padding: 20,
  },
  voiceButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  recognizedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  commandText: {
    color: '#FF9800',
    fontSize: 14,
    marginBottom: 10,
  },
  videoStateContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  helpContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
  },
  helpTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 3,
  },
});
