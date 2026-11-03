import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Scale, PieChart, Plus } from 'lucide-react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#090D16',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="add-fake"
        options={{
          title: 'Add',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.centerFab}
              activeOpacity={0.8}
              onPress={() => router.push('/expense/add')}
            >
              <View style={styles.fabCircle}>
                <Plus color="#090D16" size={24} strokeWidth={3} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="balances"
        options={{
          title: 'Balances',
          tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerFab: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  fabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
