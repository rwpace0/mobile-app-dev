import React, { useMemo } from "react";
import { View, TextInput } from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { useThemeColors } from "../../constants/useThemeColors";
import { createStyles } from "../../styles/activeExercise.styles";

const NotesInput = ({ notes, onNotesChange, showNotes }) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

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
