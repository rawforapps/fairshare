import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check, Plus, Trash2 } from 'lucide-react-native';
import { useLedgerStore } from '../../src/stores/useLedgerStore';
import { NumericKeypad } from '../../src/components/NumericKeypad';

interface MultiPayerEntry {
  memberId: string;
  name: string;
  amountStr: string;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const {
    activeGroupId,
    groups,
    categories,
    currency,
    addCustomTag,
    addExpense,
    addMemberToGroup,
  } = useLedgerStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const [description, setDescription] = useState('Loan');
  const [payerMode, setPayerMode] = useState<'single' | 'multi' | 'kitty'>('single');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    activeGroup.members.map((m) => m.id)
  );
  const [activeCategoryEmoji, setActiveCategoryEmoji] = useState('💰');

  // Dynamic Multi-Payers
  const [multiPayers, setMultiPayers] = useState<MultiPayerEntry[]>(
    activeGroup.members.map((m, idx) => ({
      memberId: m.id,
      name: m.name,
      amountStr: idx === 0 ? '0' : '0',
    }))
  );

  const [newPayerName, setNewPayerName] = useState('');
  const [showAddPayerInput, setShowAddPayerInput] = useState(false);

  const handleSelectCategory = (name: string, icon: string) => {
    setDescription(name);
    setActiveCategoryEmoji(icon);
    if (name.toLowerCase().includes('loan') || name.toLowerCase().includes('udhar') || name.toLowerCase().includes('qarz')) {
      setSelectedMemberIds(['user_me']);
    }
  };

  const handleSaveCustomTag = () => {
    if (!description.trim()) return;
    addCustomTag(description.trim(), '🏷️');
    Alert.alert('Tag Saved', `"${description}" added to your quick tag options!`);
  };

  const handleAddCustomPayer = () => {
    const clean = newPayerName.trim();
    if (!clean) return;
    const newId = `user_${Date.now()}`;
    addMemberToGroup(activeGroup.id, clean);
    setMultiPayers((prev) => [...prev, { memberId: newId, name: clean, amountStr: '0' }]);
    setSelectedMemberIds((prev) => [...prev, newId]);
    setNewPayerName('');
    setShowAddPayerInput(false);
  };

  const handleRemovePayer = (index: number) => {
    if (multiPayers.length <= 1) return;
    setMultiPayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePayerAmountChange = (index: number, val: string) => {
    setMultiPayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amountStr: val } : p))
    );
  };

  const handleConfirmExpense = (cents: bigint) => {
    const totalAmount = Number(cents) / 100;

    if (payerMode === 'kitty') {
      const kittyLeft = Number(activeGroup.kittyBalanceCents) / 100;
      if (totalAmount > kittyLeft) {
        Alert.alert(
          'Kitty Balance Low',
          `Shared Kitty balance (${currency.symbol}${kittyLeft.toFixed(2)}) is less than this bill (${currency.symbol}${totalAmount.toFixed(2)})! Top up the kitty or pick another payer.`
        );
        return;
      }
    }

    let calculatedMultiPayers = undefined;
    if (payerMode === 'multi') {
      let sumCents = 0n;
      const formattedEntries: { memberId: string; amountCents: bigint }[] = [];

      for (const p of multiPayers) {
        const floatVal = parseFloat(p.amountStr) || 0;
        const pCents = BigInt(Math.round(floatVal * 100));
        sumCents += pCents;
        formattedEntries.push({ memberId: p.memberId, amountCents: pCents });
      }

      if (sumCents !== cents) {
        const sumFormatted = (Number(sumCents) / 100).toFixed(2);
        Alert.alert(
          'Amount Mismatch',
          `The sum of paid amounts (${currency.symbol}${sumFormatted}) must equal the total bill (${currency.symbol}${totalAmount.toFixed(2)})!`
        );
        return;
      }
      calculatedMultiPayers = formattedEntries;
    }

    if (selectedMemberIds.length === 0) {
      Alert.alert('Selection Required', 'Please tick at least 1 member in the checkpoints to split with!');
      return;
    }

    // Commit to the reactive store
    addExpense({
      groupId: activeGroup.id,
      description: description.trim() || 'General Expense',
      category: description.trim() || 'General',
      amountCents: cents,
      payerMode,
      paidByMemberId: payerMode === 'single' ? 'user_me' : undefined,
      multiPayers: calculatedMultiPayers,
      splitWithMemberIds: selectedMemberIds,
    });

    Alert.alert(
      'Bill Saved! 🎉',
      `${currency.symbol}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for "${description}" has been logged with zero delay!`
    );
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color="#94A3B8" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Bill</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Up to 99 Lacs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Payer Mode Toggle: Single vs Multi vs Kitty */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Who Paid?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, payerMode === 'single' && styles.activeToggleBtn]}
              onPress={() => setPayerMode('single')}
            >
              <Text style={[styles.toggleText, payerMode === 'single' && styles.activeToggleText]}>
                Just You
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, payerMode === 'multi' && styles.activeToggleBtn]}
              onPress={() => setPayerMode('multi')}
            >
              <Text style={[styles.toggleText, payerMode === 'multi' && styles.activeToggleText]}>
                👥 Multi-Payer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, payerMode === 'kitty' && styles.activeToggleBtn]}
              onPress={() => setPayerMode('kitty')}
            >
              <Text style={[styles.toggleText, payerMode === 'kitty' && styles.activeToggleText]}>
                💰 From Kitty
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Multi-Payer Split Inputs */}
          {payerMode === 'multi' && (
            <View style={styles.multiPayerCard}>
              <View style={styles.multiHeaderRow}>
                <Text style={styles.multiHint}>Enter how much each person paid towards total:</Text>
                <TouchableOpacity onPress={() => setShowAddPayerInput(!showAddPayerInput)}>
                  <Text style={styles.addPayerLink}>+ Add Payer</Text>
                </TouchableOpacity>
              </View>

              {/* Add Custom Payer Input Box */}
              {showAddPayerInput && (
                <View style={styles.newPayerRow}>
                  <TextInput
                    style={styles.newPayerInput}
                    placeholder="Friend name (e.g. Charlie, Ali)"
                    placeholderTextColor="#64748B"
                    value={newPayerName}
                    onChangeText={setNewPayerName}
                  />
                  <TouchableOpacity style={styles.addPayerConfirmBtn} onPress={handleAddCustomPayer}>
                    <Text style={styles.addPayerConfirmText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Dynamic Payers Rows */}
              {multiPayers.map((payer, idx) => (
                <View key={payer.memberId || idx} style={styles.payerInputRow}>
                  <Text style={styles.payerInputLabel}>{payer.name}:</Text>
                  <View style={styles.payerFieldWrap}>
                    <Text style={styles.currencySymbolInline}>{currency.symbol}</Text>
                    <TextInput
                      style={styles.payerInputField}
                      keyboardType="numeric"
                      value={payer.amountStr}
                      onChangeText={(val) => handlePayerAmountChange(idx, val)}
                    />
                    {multiPayers.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemovePayer(idx)} style={styles.removePayerBtn}>
                        <Trash2 color="#64748B" size={14} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {payerMode === 'kitty' && (
            <View style={styles.kittyNotice}>
              <Text style={styles.kittyNoticeText}>
                💰 Bill will be deducted straight from the Shared Kitty Pool. Nobody owes anyone!
              </Text>
            </View>
          )}
        </View>

        {/* Split Checkpoints (Splitwise Style) */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionLabel}>Split with Who?</Text>
              <Text style={styles.sectionSubLabel}>
                {selectedMemberIds.length === 1
                  ? '🎯 100% for 1 person'
                  : selectedMemberIds.length === activeGroup.members.length
                  ? '👥 Split equally among all'
                  : `👥 Split between ${selectedMemberIds.length} people`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.quickSplitBtn}
                onPress={() => setSelectedMemberIds(activeGroup.members.map((m) => m.id))}
              >
                <Text style={styles.quickSplitBtnText}>👥 All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickSplitBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                onPress={() => setSelectedMemberIds(['user_me'])}
              >
                <Text style={[styles.quickSplitBtnText, { color: '#10B981' }]}>👤 Only You</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Member Checkpoint Cards */}
          <View style={{ gap: 6, marginTop: 4 }}>
            {activeGroup.members.map((m) => {
              const isChecked = selectedMemberIds.includes(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.checkpointRow, isChecked && styles.activeCheckpointRow]}
                  onPress={() => {
                    if (isChecked) {
                      if (selectedMemberIds.length > 1) {
                        setSelectedMemberIds((prev) => prev.filter((id) => id !== m.id));
                      }
                    } else {
                      setSelectedMemberIds((prev) => [...prev, m.id]);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.checkboxBox, isChecked && styles.activeCheckboxBox]}>
                      {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.checkpointName, isChecked && styles.activeCheckpointName]}>
                      {m.name} {m.id === 'user_me' ? '(You)' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.checkpointStatus, isChecked && styles.activeCheckpointStatus]}>
                    {isChecked ? (selectedMemberIds.length === 1 ? '100% share' : 'Included') : 'Not included'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Item / Description Input */}
        <View style={styles.sectionBox}>
          <View style={styles.inputCard}>
            <Text style={styles.categoryEmoji}>{activeCategoryEmoji}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What was this for? (type anything)"
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity style={styles.saveTagBtn} onPress={handleSaveCustomTag}>
              <Text style={styles.saveTagText}>+ Tag</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.chip,
                  description.toLowerCase() === c.name.toLowerCase() && styles.activeChip,
                ]}
                onPress={() => handleSelectCategory(c.name, c.icon)}
              >
                <Text style={styles.chipEmoji}>{c.icon}</Text>
                <Text style={styles.chipText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Tactile Keypad (Supports up to 99 Lacs) */}
      <NumericKeypad
        currencySymbol={currency.symbol}
        onConfirm={handleConfirmExpense}
        onCancel={() => router.back()}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
  },
  sectionBox: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeToggleBtn: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeToggleText: {
    color: '#090D16',
    fontWeight: '900',
  },
  multiPayerCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  multiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  multiHint: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  addPayerLink: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  newPayerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  newPayerInput: {
    flex: 1,
    backgroundColor: '#090D16',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  addPayerConfirmBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addPayerConfirmText: {
    color: '#090D16',
    fontWeight: '900',
    fontSize: 12,
  },
  payerInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payerInputLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  payerFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencySymbolInline: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  payerInputField: {
    backgroundColor: '#090D16',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'Courier',
    width: 80,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  removePayerBtn: {
    padding: 4,
  },
  kittyNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  kittyNoticeText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  textInput: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  saveTagBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  saveTagText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 11,
  },
  chipsScroll: {
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  activeChip: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionSubLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  quickSplitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickSplitBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeCheckpointRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckboxBox: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxCheck: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
  },
  checkpointName: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCheckpointName: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  checkpointStatus: {
    color: '#64748B',
    fontSize: 11,
  },
  activeCheckpointStatus: {
    color: '#10B981',
    fontWeight: '700',
  },
});
