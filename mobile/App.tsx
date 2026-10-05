import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, fonts } from "./src/config";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AutomationsScreen } from "./src/screens/AutomationsScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DevicesScreen } from "./src/screens/DevicesScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

const tabIcon =
  (glyph: string) =>
  ({ color }: { color: string }) => <Text style={{ fontSize: 18, color, fontFamily: fonts.mono }}>{glyph}</Text>;

function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user) return <LoginScreen />;
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={{
          headerTitleStyle: { fontFamily: fonts.mono, letterSpacing: 3, fontSize: 14, color: colors.primary },
          headerStyle: { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 },
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
        }}
      >
        <Tab.Screen name="Assistant" component={ChatScreen} options={{ tabBarIcon: tabIcon("◎"), headerShown: false, title: "ASSISTANT" }} />
        <Tab.Screen name="Maison" component={DevicesScreen} options={{ tabBarIcon: tabIcon("⌂"), title: "MAISON" }} />
        <Tab.Screen name="Routines" component={AutomationsScreen} options={{ tabBarIcon: tabIcon("⟳"), title: "ROUTINES" }} />
        <Tab.Screen name="Profil" component={SettingsScreen} options={{ tabBarIcon: tabIcon("◈"), title: "PROFIL" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
