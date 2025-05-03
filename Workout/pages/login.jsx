import React from 'react';
import { View, Text, Button } from 'react-native';


const LoginPage = () => {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Button title="Login" onPress={() => alert("Login button pressed")} />
        </View>
    );
}

export default LoginPage;