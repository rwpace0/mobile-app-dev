import { StyleSheet } from "react-native";
import colors from "../constants/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  headerButton: {
    fontSize: 17,
  },
  cancelButton: {
    color: "#2196F3",
  },
  saveButton: {
    color: "#2196F3",
    fontWeight: "600",
  },
  routineNameInput: {
    fontSize: 17,
    color: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#999999",
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  exercisesContainer: {
    padding: 16,
  },
  emptyWorkoutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructionText: {
    color: "#999999",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  addExerciseText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  settingsButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  discardButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  discardText: {
    color: "#FF4444",
    fontSize: 16,
  },
});