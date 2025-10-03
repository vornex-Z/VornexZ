/**
 * VornexZPay Mobile App
 * Carteira Digital - Versão Mobile
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, StyleSheet } from 'react-native';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HelpScreen from './src/screens/HelpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CardsScreen from './src/screens/CardsScreen';
import UserSettingsScreen from './src/screens/UserSettingsScreen';

// Utils
import { setupInterceptors } from './src/services/api';

const Stack = createStackNavigator();

const App = () => {
  React.useEffect(() => {
    // Setup API interceptors
    setupInterceptors();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Cards" component={CardsScreen} />
          <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;