import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // 👈 hide tabs visually
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eyeway',
          tabBarIcon: ({ color }) => (
            <Ionicons name="navigate" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}