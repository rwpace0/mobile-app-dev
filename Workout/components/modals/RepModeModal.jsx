import React from "react";
import BottomSheetModal from "./bottomModal";
import { hapticLight } from "../../utils/hapticFeedback";

const RepModeModal = ({ visible, onClose, currentMode, onModeSelect }) => {
  const handleModeSelect = (mode) => {
    hapticLight();
    onModeSelect(mode);
    onClose();
  };

  const actions = [
    {
      title: "Single Rep",
      icon: "ellipse-outline",
      onPress: () => handleModeSelect("single"),
      showChevron: currentMode === "single",
    },
    {
      title: "Rep Range",
      icon: "swap-horizontal-outline",
      onPress: () => handleModeSelect("range"),
      showChevron: currentMode === "range",
    },
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Rep Mode"
      actions={actions}
      showHandle={true}
    />
  );
};

export default RepModeModal;
