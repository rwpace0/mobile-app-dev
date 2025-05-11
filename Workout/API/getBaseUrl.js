//ios wont work until i host backend

import { Platform } from "react-native";
import { BACKEND_URL, IOS } from "@env";

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "ios") {
      return `${IOS}`;
    } else {
      // For web
      return `${BACKEND_URL}`;
    }
  } else {
    return `${BACKEND_URL}`;
  }
};

export default getBaseUrl;
