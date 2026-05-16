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
  const validTypes = ['jpg', 'jpeg', 'png'];
  const extension = fileUri.split('.').pop().toLowerCase();
  if (!validTypes.includes(extension)) {
    throw new Error('Only JPEG and PNG files are allowed');
  }

  // Check file size (500KB = 500 * 1024 bytes)
  const maxSize = 500 * 1024;
  if (fileSize > maxSize) {
    throw new Error('Image size must be less than 500KB');
  }

  return true;
}; 