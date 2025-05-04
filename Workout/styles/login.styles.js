import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
  },

  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },

  inputLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 6,
  },

  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },

  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E90FF', // Blue secondary color
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  googleButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  googleIcon: {
    marginRight: 10,
  },

  googleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  footerText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 30,
  },
});