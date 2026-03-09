import { useMemo } from "react";

export function usePasswordValidation(password) {
  const passwordRequirements = useMemo(() => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return [
      { met: minLength, text: "At least 8 characters" },
      { met: hasUpperCase, text: "At least one uppercase letter" },
      { met: hasNumbers, text: "At least one number" },
    ];
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return passwordRequirements.every((req) => req.met);
  }, [passwordRequirements]);

  const passwordStrength = useMemo(() => {
    const metRequirements = passwordRequirements.filter((req) => req.met).length;
    return (metRequirements / passwordRequirements.length) * 100;
  }, [passwordRequirements]);

  return { passwordRequirements, isPasswordValid, passwordStrength };
}
