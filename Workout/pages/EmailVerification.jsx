import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { useAuth } from "../API/auth/authContext";
import getBaseUrl from "../API/utils/getBaseUrl";
import { createStyles } from "../styles/login.styles";
import AlertModal from "../components/modals/AlertModal";
import { useAlertModal } from "../utils/useAlertModal";

const EmailVerification = ({ navigation, route }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, error, verifyEmail } = useAuth();
  const { alertState, showError, showSuccess, hideAlert } = useAlertModal();

  // Handle deep link verification
  useEffect(() => {
    const handleDeepLinkVerification = async () => {
      const token_hash = route?.params?.token_hash;
      const type = route?.params?.type;

      if (token_hash && type) {
        console.log('📧 Email verification deep link detected:', { token_hash, type });
        setIsVerifying(true);
        
        try {
          await verifyEmail(token_hash, type);
          showSuccess(
            "Success", 
            "Email verified successfully! You are now logged in.",
            {
              onConfirm: () => navigation.replace("Main"),
            }
          );
        } catch (error) {
          console.error('Email verification failed:', error);
          showError("Error", error.message || "Failed to verify email");
        } finally {
          setIsVerifying(false);
        }
      }
    };

    handleDeepLinkVerification();
  }, [route?.params, verifyEmail, showSuccess, showError, navigation]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch(`${getBaseUrl()}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
      }

      setCountdown(60);
      showSuccess("Success", "Verification email sent successfully!");
    } catch (error) {
      showError("Error", error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>

      {isVerifying ? (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>Verifying your email...</Text>
        </View>
      ) : (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>We've sent a verification email to:</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.instructions}>
            Please check your email and click the verification link to continue.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.resendButton,
          (countdown > 0 || isResending) && styles.disabledButton,
        ]}
        onPress={handleResendVerification}
        disabled={countdown > 0 || isResending}
      >
        {isResending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resendButtonText}>
            {countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend Verification Email"}
          </Text>
        )}
      </TouchableOpacity>

      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </View>
  );
};

export default EmailVerification;
