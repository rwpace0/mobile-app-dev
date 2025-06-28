import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

const RestTimerModal = ({ visible, onClose, onSelectTime, currentTime }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const presetTimes = [
    { label: "Off", seconds: 0 },
    { label: "30s", seconds: 30 },
    { label: "1min", seconds: 60 },
    { label: "1:30min", seconds: 90 },
    { label: "2min", seconds: 120 },
    { label: "2:30min", seconds: 150 },
    { label: "3min", seconds: 180 },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Rest Timer</Text>
          <View style={styles.presetTimesContainer}>
            {presetTimes.map((time) => (
              <TouchableOpacity
                key={time.seconds}
                style={[
                  styles.presetTimeButton,
                  currentTime === time.seconds && styles.selectedPresetButton,
                  time.seconds === 0 && styles.offButton
                ]}
                onPress={() => {
                  onSelectTime(time.seconds);
                  onClose();
                }}
              >
                {time.seconds === 0 ? (
                  <Ionicons name="timer-outline" size={20} color="#FFFFFF" style={styles.offIcon} />
                ) : null}
                <Text style={[
                  styles.presetTimeText,
                  currentTime === time.seconds && styles.selectedPresetText
                ]}>
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RestTimerModal; 