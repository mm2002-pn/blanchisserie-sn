import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { appFonts } from "@/constants/Fonts";
import { queryClient } from "@/lib/queryClient";
import { configureForegroundHandler } from "@/services/push.service";

configureForegroundHandler();

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
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <OrderProvider>
                    <NotificationsProvider>
                    <ToastProvider>
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
                    </ToastProvider>
                    </NotificationsProvider>
                </OrderProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
