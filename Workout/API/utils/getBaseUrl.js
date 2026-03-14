import { DEV_HOST, BACKEND_URL } from "@env";

const getBaseUrl = () => {
  if (__DEV__) {
    const host = DEV_HOST || "localhost";
    return `http://${host}:3000`;
  }
  return `${BACKEND_URL}`;
};

export default getBaseUrl;
