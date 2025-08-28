import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  openSettings,
  type Permission,
} from 'react-native-permissions';
import type { PermissionState } from '../types';

const MICROPHONE_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.MICROPHONE,
  android: PERMISSIONS.ANDROID.RECORD_AUDIO,
}) as Permission;

export const usePermissions = () => {
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionState>({
      granted: false,
      canAskAgain: true,
      status: 'unavailable',
    });

  const [isChecking, setIsChecking] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const mapResultToPermissionState = useCallback(
    (result: string): PermissionState => {
      switch (result) {
        case RESULTS.GRANTED:
          return { granted: true, canAskAgain: false, status: 'granted' };
        case RESULTS.DENIED:
          return { granted: false, canAskAgain: true, status: 'denied' };
        case RESULTS.BLOCKED:
          return { granted: false, canAskAgain: false, status: 'blocked' };
        case RESULTS.LIMITED:
          return { granted: true, canAskAgain: false, status: 'limited' };
        case RESULTS.UNAVAILABLE:
        default:
          return { granted: false, canAskAgain: false, status: 'unavailable' };
      }
    },
    []
  );

  const checkMicrophonePermission =
    useCallback(async (): Promise<PermissionState> => {
      if (!MICROPHONE_PERMISSION) {
        const unavailableState: PermissionState = {
          granted: false,
          canAskAgain: false,
          status: 'unavailable',
        };
        setMicrophonePermission(unavailableState);
        return unavailableState;
      }

      setIsChecking(true);

      try {
        const result = await check(MICROPHONE_PERMISSION);
        const permissionState = mapResultToPermissionState(result);
        setMicrophonePermission(permissionState);
        return permissionState;
      } catch (error) {
        const errorState: PermissionState = {
          granted: false,
          canAskAgain: false,
          status: 'unavailable',
        };
        setMicrophonePermission(errorState);
        return errorState;
      } finally {
        setIsChecking(false);
      }
    }, [mapResultToPermissionState]);

  const requestMicrophonePermission =
    useCallback(async (): Promise<PermissionState> => {
      if (!MICROPHONE_PERMISSION) {
        const unavailableState: PermissionState = {
          granted: false,
          canAskAgain: false,
          status: 'unavailable',
        };
        setMicrophonePermission(unavailableState);
        return unavailableState;
      }

      setIsRequesting(true);

      try {
        const result = await request(MICROPHONE_PERMISSION);
        const permissionState = mapResultToPermissionState(result);
        setMicrophonePermission(permissionState);
        return permissionState;
      } catch (error) {
        const errorState: PermissionState = {
          granted: false,
          canAskAgain: false,
          status: 'unavailable',
        };
        setMicrophonePermission(errorState);
        return errorState;
      } finally {
        setIsRequesting(false);
      }
    }, [mapResultToPermissionState]);

  const ensureMicrophonePermission = useCallback(async (): Promise<boolean> => {
    // First check current status
    const currentState = await checkMicrophonePermission();

    if (currentState.granted) {
      return true;
    }

    // If denied but can ask again, request permission
    if (currentState.status === 'denied' && currentState.canAskAgain) {
      const requestResult = await requestMicrophonePermission();
      return requestResult.granted;
    }

    // If blocked or unavailable, cannot get permission
    return false;
  }, [checkMicrophonePermission, requestMicrophonePermission]);

  const openAppSettings = useCallback(async (): Promise<void> => {
    try {
      await openSettings();
    } catch (error) {}
  }, []);

  const getPermissionExplanation = useCallback(
    (permission: PermissionState): string => {
      switch (permission.status) {
        case 'granted':
          return 'Microphone access is granted.';
        case 'denied':
          if (permission.canAskAgain) {
            return 'Microphone access is required for voice input to make Voice Agent work.';
          }
          return 'Microphone access was denied. Please enable it in app settings.';
        case 'blocked':
          return 'Microphone access is permanently denied. Please enable it in app settings to use voice features.';
        case 'limited':
          return 'Microphone access is limited. Some features may not work as expected.';
        case 'unavailable':
        default:
          return 'Microphone is not available on this device.';
      }
    },
    []
  );

  const shouldShowRationale = useCallback((): boolean => {
    return (
      microphonePermission.status === 'denied' &&
      microphonePermission.canAskAgain
    );
  }, [microphonePermission]);

  const shouldShowSettingsPrompt = useCallback((): boolean => {
    return (
      microphonePermission.status === 'blocked' ||
      (microphonePermission.status === 'denied' &&
        !microphonePermission.canAskAgain)
    );
  }, [microphonePermission]);

  // Check permission on mount and when app comes to foreground
  useEffect(() => {
    checkMicrophonePermission();
  }, [checkMicrophonePermission]);

  // Utility function to get user-friendly permission status text
  const getPermissionStatusText = useCallback((): string => {
    switch (microphonePermission.status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'blocked':
        return 'Blocked';
      case 'limited':
        return 'Limited';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  }, [microphonePermission.status]);

  return {
    // Permission state
    microphonePermission,
    hasMicrophonePermission: microphonePermission.granted,

    // Loading states
    isChecking,
    isRequesting,

    // Actions
    checkMicrophonePermission,
    requestMicrophonePermission,
    ensureMicrophonePermission,
    openAppSettings,

    // Helpers
    getPermissionExplanation: () =>
      getPermissionExplanation(microphonePermission),
    getPermissionStatusText,
    shouldShowRationale,
    shouldShowSettingsPrompt,

    // Platform info
    isPermissionSupported: !!MICROPHONE_PERMISSION,
    platform: Platform.OS,
  };
};

// Hook specifically for voice recording permissions with additional checks
export const useVoiceRecordingPermissions = () => {
  const permissions = usePermissions();

  const [isRecordingSupported, setIsRecordingSupported] = useState(true);

  useEffect(() => {
    const checkRecordingSupport = () => {
      setIsRecordingSupported(permissions.isPermissionSupported);
    };

    checkRecordingSupport();
  }, [permissions.isPermissionSupported]);

  const canStartRecording = useCallback((): boolean => {
    return (
      isRecordingSupported &&
      permissions.hasMicrophonePermission &&
      !permissions.isChecking &&
      !permissions.isRequesting
    );
  }, [
    isRecordingSupported,
    permissions.hasMicrophonePermission,
    permissions.isChecking,
    permissions.isRequesting,
  ]);

  const prepareForRecording = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!isRecordingSupported) {
      return {
        success: false,
        message: 'Audio recording is not supported on this device.',
      };
    }

    const hasPermission = await permissions.ensureMicrophonePermission();

    if (!hasPermission) {
      const explanation = permissions.getPermissionExplanation();
      return {
        success: false,
        message: explanation,
      };
    }

    return { success: true };
  }, [isRecordingSupported, permissions]);

  return {
    ...permissions,
    isRecordingSupported,
    canStartRecording,
    prepareForRecording,
  };
};
