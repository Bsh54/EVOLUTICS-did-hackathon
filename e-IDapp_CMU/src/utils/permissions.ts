import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';

export type PermissionResult = {
  status: string;
  granted: boolean;
};

export async function requestCameraPermission(): Promise<PermissionResult> {
  const perm = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
    default: PERMISSIONS.ANDROID.CAMERA,
  });

  const result = await request(perm!);

  if (result === RESULTS.BLOCKED) {
    // Guide user to app settings
    await openSettings().catch(() => {
      // noop
    });
  }

  return {
    status: result,
    granted: result === RESULTS.GRANTED,
  };
}