import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check, Utensils, UserPlus } from 'lucide-react-native';
import { useLedgerStore } from '../../src/stores/useLedgerStore';
import { ItemizedBillSplitter, BillItem } from '../../src/components/BillItemClaimer';

export default function WhoAteWhatScreen() {
  const router = useRouter();
  const { groups, activeGroupId, currency, addExpense, addMemberToGroup } = useLedgerStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const [mealTitle, setMealTitle] = useState('Dinner Party');
  const [payerId, setPayerId] = useState<string>('user_me');
  const [newFriendName, setNewFriendName] = useState('');
  const [showAddFriendBox, setShowAddFriendBox] = useState(false);

  const defaultItems: BillItem[] = [
    { id: '1', name: 'Margherita Pizza 🍕', priceCents: 1800n, assignedMemberIds: ['user_me', 'user_bob'] },
    { id: '2', name: 'Pasta Carbonara 🍝', priceCents: 2200n, assignedMemberIds: ['user_charlie'] },
    { id: '3', name: 'Iced Drinks 🥤', priceCents: 1200n, assignedMemberIds: ['user_me', 'user_bob', 'user_charlie'] },
  ];

  const handleAddFriend = () => {
    const clean = newFriendName.trim();
    if (!clean) return;
    addMemberToGroup(activeGroup.id, clean);
    Alert.alert('Friend Added 🎉', `"${clean}" added to this meal and group!`);
    setNewFriendName('');
    setShowAddFriendBox(false);
  };

  const handleConfirmBreakdown = (breakdown: Map<string, bigint>) => {
    let totalCents = 0n;
    const splitMembers: string[] = [];

    breakdown.forEach((amt, memberId) => {
      if (amt > 0n) {
        totalCents += amt;
        splitMembers.push(memberId);
      }
    });

    if (totalCents === 0n) {
      Alert.alert('Empty Bill', 'Please add and claim at least one line item before saving.');
      return;
    }

    // Add expense to store
    addExpense({
      groupId: activeGroup.id,
      description: mealTitle.trim() || 'Restaurant Meal',
      category: 'Burgers',
      amountCents: totalCents,
      payerMode: 'single',
      paidByMemberId: payerId,
      splitWithMemberIds: splitMembers.length > 0 ? splitMembers : activeGroup.members.map((m) => m.id),
    });

    const totalFormatted = (Number(totalCents) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    Alert.alert(
      'Meal Split Saved! 🍕',
      `${currency.symbol}${totalFormatted} for "${mealTitle}" has been itemized and recorded on the ledger!`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <X color="#94A3B8" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Who Ate What?</Text>
          <Text style={styles.headerSubtitle}>Itemized Meal Splitter</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>$0 Fees</Text>
        </View>
      </View>

      {/* Top Config Row: Meal Name & Who Paid Upfront */}
      <View style={styles.topConfigBox}>
        <View style={styles.inputRow}>
          <Utensils color="#10B981" size={18} style={styles.inputIcon} />
          <TextInput
            style={styles.titleInput}
            value={mealTitle}
            onChangeText={setMealTitle}
            placeholder="Meal or Restaurant name"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Payer Selector */}
        <View style={styles.payerSelectorRow}>
          <Text style={styles.payerLabel}>Card Paid By:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payerScroll}>
            {activeGroup.members.map((m) => {
              const isPayer = m.id === payerId;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.payerChip, isPayer && styles.activePayerChip]}
                  onPress={() => setPayerId(m.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.payerChipText, isPayer && styles.activePayerChipText]}>
                    {m.name} {isPayer ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Add Friend Row */}
        <View style={styles.addFriendRow}>
          <Text style={styles.friendListLabel}>Members: {activeGroup.members.length}</Text>
          <TouchableOpacity
            style={styles.addFriendBtn}
            onPress={() => setShowAddFriendBox(!showAddFriendBox)}
          >
            <UserPlus color="#C084FC" size={14} />
            <Text style={styles.addFriendText}>+ Add Friend to Table</Text>
          </TouchableOpacity>
        </View>

        {showAddFriendBox && (
          <View style={styles.friendInputBox}>
            <TextInput
              style={styles.friendInput}
              placeholder="Friend's Name (e.g. Usman, Ali)"
              placeholderTextColor="#64748B"
              value={newFriendName}
              onChangeText={setNewFriendName}
            />
            <TouchableOpacity style={styles.friendConfirmBtn} onPress={handleAddFriend}>
              <Text style={styles.friendConfirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Itemized Claimer Component */}
      <View style={styles.splitterWrap}>
        <ItemizedBillSplitter
          initialItems={defaultItems}
          members={activeGroup.members}
          currencySymbol={currency.symbol}
          onConfirm={handleConfirmBreakdown}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 10,
  },
  topConfigBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0D1424',
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  inputIcon: {
    marginRight: 2,
  },
  titleInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  payerSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  payerScroll: {
    flex: 1,
  },
  payerChip: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activePayerChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  payerChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  activePayerChipText: {
    color: '#10B981',
    fontWeight: '800',
  },
  addFriendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendListLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addFriendText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '800',
  },
  friendInputBox: {
    flexDirection: 'row',
    gap: 8,
  },
  friendInput: {
    flex: 1,
    backgroundColor: '#131B2E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 12,
  },
  friendConfirmBtn: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
  },
  friendConfirmText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  splitterWrap: {
    flex: 1,
  },
});
