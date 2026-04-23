import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <OrderProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'default',
                    }}
                >
                    <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(hotel)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(driver)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="(supervisor)"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </OrderProvider>
        </AuthProvider>
    );
}
