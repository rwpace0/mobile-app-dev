import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../API/auth/authContext';
import { createStyles } from '../../styles/editProfile.styles';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../state/SettingsContext';
import Header from '../../components/static/header';
import { mediaAPI } from '../../API/mediaAPI';
import { mediaCache } from '../../API/local/MediaCache';
import { profileAPI } from '../../API/profileAPI';
import { requestMediaLibraryPermission, validateImageFile } from '../../utils/permissions';

const EditProfile = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [profileAvatar, setProfileAvatar] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (user?.id) {
      try {
        setLoading(true);
        
        // Fetch profile data from local cache first
        const profileData = await mediaCache.getLocalProfile(user.id);
        
        // Update form data with profile information
        setName(profileData.display_name || '');

        // Fetch avatar from cache
        const avatarPath = await mediaCache.getProfileAvatar(user.id);
        setProfileAvatar(avatarPath);
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAvatarPress = async () => {
    if (saving) return;

    try {
      await requestMediaLibraryPermission();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        try {
          validateImageFile(imageUri, result.assets[0].fileSize);
          setSelectedImage(imageUri);
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };



  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      // Update local profile first
      await mediaCache.updateLocalProfile(user.id, {
        display_name: name
      });

      // Then sync to backend
      await profileAPI.updateProfile({
        display_name: name
      });

      // Mark as synced
      await mediaCache.markProfileSynced(user.id);

      // Upload selected image if there is one
      if (selectedImage) {
        try {
          const { localPath } = await mediaAPI.uploadProfileAvatar(user.id, selectedImage);
          setProfileAvatar(localPath);
          setSelectedImage(null); // Clear selected image after upload
        } catch (error) {
          console.error('Avatar upload error:', error);
          Alert.alert('Warning', 'Profile updated but failed to upload image. Please try again.');
        }
      }
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderAvatarSection = () => (
    <View style={styles.avatarSection}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={handleAvatarPress}
        disabled={saving}
      >
        {selectedImage || profileAvatar ? (
          <Image
            source={{ uri: selectedImage || profileAvatar }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={50} color={colors.textPrimary} />
          </View>
        )}
        {selectedImage && (
          <View style={styles.uploadingOverlay}>
            <Ionicons name="image-outline" size={24} color={colors.textPrimary} />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleAvatarPress} disabled={saving}>
        <Text style={styles.changePictureText}>
          {selectedImage ? 'Image Selected' : 'Change Picture'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormField = (label, value, onChangeText, placeholder) => (
    <View style={styles.formField}>
      <Text style={styles.formFieldLabel}>{label}</Text>
      <TextInput
        style={styles.formFieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaded}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Profile"
        leftComponent={{ type: 'back' }}
        rightComponent={{
          type: 'button',
          text: 'Save',
          onPress: handleSave,
          disabled: saving
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        {renderAvatarSection()}
        
        <View style={styles.section}>
          
          
          {renderFormField(
            'Name',
            name,
            setName,
            'Your full name'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile; 