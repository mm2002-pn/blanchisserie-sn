import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { appFonts } from "@/constants/Fonts";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts(appFonts);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <AuthProvider>
            <OrderProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: "default",
                    }}
                >
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(hotel)" options={{ headerShown: false }} />
                    <Stack.Screen name="(driver)" options={{ headerShown: false }} />
                    <Stack.Screen name="(supervisor)" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
            </OrderProvider>
        </AuthProvider>
    );
}
