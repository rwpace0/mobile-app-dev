import React from "react";
import { View, TextInput } from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/activeExercise.styles";

const NotesInput = ({ notes, onNotesChange, showNotes }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  if (!showNotes) return null;

  return (
    <View style={styles.notesContainer}>
      <TextInput
        style={styles.notesInput}
        placeholder="Add notes here..."
        placeholderTextColor={colors.textFaded}
        value={notes}
        onChangeText={onNotesChange}
        multiline
      />
    </View>
  );
};

export default NotesInput;
