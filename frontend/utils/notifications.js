import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Ensure notifications are displayed when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ensureDefaultChannelAsync = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

export const requestNotificationPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (
    existing.granted ||
    existing.status === "granted" ||
    existing.status === "provisional"
  ) {
    return true;
  }

  if (!existing.canAskAgain) {
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.status === "granted" ||
    requested.status === "provisional"
  );
};

export const scheduleActiveWorkoutNotification = async (workoutName) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  await ensureDefaultChannelAsync();

  const now = Date.now();
  const notificationIds = [];

  // Schedule first notification 2 minutes from now
  const twoMinutesFromNow = new Date(now + 2 * 60 * 1000);
  
  const firstNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Workout still in progress",
      body: workoutName
        ? `${workoutName} is still running. Come back to finish it.`
        : "You have an active workout running. Come back to finish it.",
      data: { workoutName },
    },
    trigger: {
      type: "date",
      date: twoMinutesFromNow,
    },
  });

  if (firstNotificationId) {
    notificationIds.push(firstNotificationId);
  }

  // Schedule recurring notifications every hour after the first one
  // Limit to 24 hours (24 notifications total)
  for (let hour = 1; hour <= 24; hour++) {
    const triggerTime = new Date(now + (2 * 60 * 1000) + (hour * 60 * 60 * 1000));
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Workout still in progress",
        body: workoutName
          ? `${workoutName} is still running. Come back to finish it.`
          : "You have an active workout running. Come back to finish it.",
        data: { workoutName },
      },
      trigger: {
        type: "date",
        date: triggerTime,
      },
    });

    if (notificationId) {
      notificationIds.push(notificationId);
    }
  }

  // Return the first notification ID for backwards compatibility
  // The caller can use cancelAllScheduledNotifications to cancel all
  return notificationIds.length > 0 ? notificationIds[0] : null;
};

export const cancelNotificationById = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn(
      "[Notifications] Failed to cancel notification:",
      notificationId,
      error
    );
  }
};

export const cancelAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn(
      "[Notifications] Failed to cancel all scheduled notifications:",
      error
    );
  }
};
