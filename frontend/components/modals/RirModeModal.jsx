import React from "react";
import BottomSheetModal from "./bottomModal";
import { hapticLight } from "../../utils/hapticFeedback";

const RirModeModal = ({ visible, onClose, currentMode, onModeSelect }) => {
  const handleModeSelect = (mode) => {
    hapticLight();
    onModeSelect(mode);
    onClose();
  };

  const actions = [
    {
      title: "Single RIR",
      icon: "ellipse-outline",
      onPress: () => handleModeSelect("single"),
      showChevron: currentMode === "single",
    },
    {
      title: "RIR Range",
      icon: "swap-horizontal-outline",
      onPress: () => handleModeSelect("range"),
      showChevron: currentMode === "range",
    },
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="RIR Mode"
      actions={actions}
      showHandle={true}
    />
  );
};

export default RirModeModal;
