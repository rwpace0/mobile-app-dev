import * as ImagePicker from 'expo-image-picker';

export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }
  return true;
};

export const validateImageFile = (fileUri, fileSize) => {
  // Check file type
  const validTypes = ['jpg', 'jpeg', 'png', 'gif'];
  const extension = fileUri.split('.').pop().toLowerCase();
  if (!validTypes.includes(extension)) {
    throw new Error('Only JPEG, PNG, JPG, and GIF files are allowed');
  }

  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (fileSize > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }

  return true;
}; 