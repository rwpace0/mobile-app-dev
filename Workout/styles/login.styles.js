import { StyleSheet, Dimensions } from 'react-native';
import colors from '../constants/colors';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textWhite,
    marginBottom: 40,
  },

  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },

  inputLabel: {
    color: colors.textLight,
    fontSize: 14,
    marginBottom: 6,
  },

  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: colors.textWhite,
    fontSize: 16,
  },

  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },

  googleButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },

  googleIcon: {
    marginRight: 10,
  },

  googleText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },

  footerText: {
    color: colors.footerText,
    fontSize: 12,
    marginTop: 30,
  },
});