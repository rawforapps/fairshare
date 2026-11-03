import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react-native';

export default function JoinGroupScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMode, setAuthMode] = useState<'GUEST' | 'PHONE'>('GUEST');
  const [loading, setLoading] = useState(false);

  // In production: fetch group metadata using `token` from Supabase / Edge API
  const group = {
    name: 'Summer Tokyo Trip 🇯🇵',
    membersCount: 4,
    creatorName: 'Alice',
  };

  const handleJoinAsGuest = () => {
    if (!guestName.trim()) return;
    setLoading(true);
    // 1. Create a guest_session_id in local storage
    // 2. Add guest to group_members
    // 3. Navigate into the group feed immediately!
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 600);
  };

  const handlePhoneAuth = () => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    // 1. Trigger Supabase / Twilio Phone OTP
    // 2. Navigate to OTP confirmation
    setTimeout(() => {
      setLoading(false);
      alert(`OTP code sent to ${phoneNumber}`);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Group Invite Badge */}
        <View style={styles.badge}>
          <Users color="#10B981" size={20} />
          <Text style={styles.badgeText}>You’ve been invited to join</Text>
        </View>

        <Text style={styles.groupTitle}>{group.name}</Text>
        <Text style={styles.groupMeta}>
          Created by {group.creatorName} • {group.membersCount} members already in
        </Text>

        {/* Tab Toggle: Guest vs Phone */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'GUEST' && styles.activeToggleBtn]}
            onPress={() => setAuthMode('GUEST')}
          >
            <Sparkles size={16} color={authMode === 'GUEST' ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.toggleText, authMode === 'GUEST' && styles.activeToggleText]}>
              Instant Guest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'PHONE' && styles.activeToggleBtn]}
            onPress={() => setAuthMode('PHONE')}
          >
            <Phone size={16} color={authMode === 'PHONE' ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.toggleText, authMode === 'PHONE' && styles.activeToggleText]}>
              Phone Login
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'GUEST' ? (
          /* Instant Guest Mode (No Account Required) */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Join in seconds</Text>
            <Text style={styles.formSubtitle}>
              No password or email required. Just choose how your friends know you.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name (e.g. Charlie)"
              placeholderTextColor="#64748B"
              value={guestName}
              onChangeText={setGuestName}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, !guestName.trim() && styles.disabledBtn]}
              disabled={!guestName.trim() || loading}
              onPress={handleJoinAsGuest}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.btnText}>Join Group</Text>
                  <ArrowRight color="#FFFFFF" size={20} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <ShieldCheck color="#64748B" size={16} />
              <Text style={styles.securityText}>
                You can save your expenses permanently anytime by adding your phone number later.
              </Text>
            </View>
          </View>
        ) : (
          /* Phone OTP Mode */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in with Phone</Text>
            <Text style={styles.formSubtitle}>
              We’ll send a one-time verification code via SMS to secure your profile.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, !phoneNumber.trim() && styles.disabledBtn]}
              disabled={!phoneNumber.trim() || loading}
              onPress={handlePhoneAuth}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.btnText}>Send Verification Code</Text>
                  <ArrowRight color="#FFFFFF" size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  groupMeta: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeToggleBtn: {
    backgroundColor: '#1E293B',
  },
  toggleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  activeToggleText: {
    color: '#F8FAFC',
  },
  formCard: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#090D16',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  securityText: {
    color: '#64748B',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
