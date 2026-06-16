import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

/**
 * Helpers de capture terrain.
 *
 *  - capturePhoto() : ouvre la caméra, retourne l'URI locale (file://...)
 *  - currentPosition() : { lat, lng } ou null si refusé/timeout
 *
 * Permissions demandées à la volée — l'app.json déclare déjà les usages.
 */

export async function capturePhoto(): Promise<string | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
    exif: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export async function pickFromLibrary(): Promise<string | null> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export async function currentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
