/**
 * Manual Itemized Bill Splitter
 * 100% Client-Side. Zero API costs, zero token fees for owner.
 * Allows diners to itemize meals with proportional tax and tip calculations.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { calculateProportionalBillSplit } from '../core/math/debt_simplifier';
import { Plus, Trash2, Check, Receipt } from 'lucide-react-native';

export interface BillItem {
  id: string;
  name: string;
  priceCents: bigint;
  assignedMemberIds: string[];
}

interface ItemizedBillSplitterProps {
  initialItems?: BillItem[];
  members: { id: string; name: string; avatar?: string }[];
  currencySymbol?: string;
  onConfirm: (finalBreakdown: Map<string, bigint>) => void;
}

export const ItemizedBillSplitter: React.FC<ItemizedBillSplitterProps> = ({
  initialItems = [
    { id: '1', name: 'Main Course', priceCents: 2400n, assignedMemberIds: [] },
  ],
  members,
  currencySymbol = '$',
  onConfirm,
}) => {
  const [items, setItems] = useState<BillItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id ?? '');
  
  // Tax & Tip in cents
  const [taxCents, setTaxCents] = useState<bigint>(0n);
  const [tipCents, setTipCents] = useState<bigint>(0n);

  const addItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    const priceFloat = parseFloat(newItemPrice);
    if (isNaN(priceFloat) || priceFloat <= 0) return;

    const newItem: BillItem = {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      priceCents: BigInt(Math.round(priceFloat * 100)),
      assignedMemberIds: selectedMemberId ? [selectedMemberId] : [],
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleItemClaim = (itemId: string) => {
    if (!selectedMemberId) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const isClaimed = item.assignedMemberIds.includes(selectedMemberId);
        const newAssigned = isClaimed
          ? item.assignedMemberIds.filter((id) => id !== selectedMemberId)
          : [...item.assignedMemberIds, selectedMemberId];

        return { ...item, assignedMemberIds: newAssigned };
      })
    );
  };

  // Run proportional distribution math on-device (zero cost)
  const breakdown = calculateProportionalBillSplit(
    items.map((i) => ({ priceCents: i.priceCents, assignedMemberIds: i.assignedMemberIds })),
    taxCents,
    tipCents,
    0n
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Itemized Bill Split</Text>
          <Text style={styles.subtext}>Assign items to friends; tax & tip split proportionately</Text>
        </View>
        <View style={styles.badge}>
          <Receipt size={14} color="#10B981" />
          <Text style={styles.badgeText}>Free Forever</Text>
        </View>
      </View>

      {/* Member Avatar Ribbon */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberRibbon}>
        {members.map((m) => {
          const isSelected = m.id === selectedMemberId;
          const memberTotal = breakdown.get(m.id) ?? 0n;
          const formatted = (Number(memberTotal) / 100).toFixed(2);

          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.memberChip, isSelected && styles.activeMemberChip]}
              onPress={() => setSelectedMemberId(m.id)}
            >
              <View style={[styles.avatarCircle, isSelected && styles.activeAvatar]}>
                <Text style={styles.avatarInitial}>{m.name[0]}</Text>
              </View>
              <View>
                <Text style={[styles.memberName, isSelected && styles.activeMemberName]}>
                  {m.name}
                </Text>
                <Text style={styles.memberOwed}>{currencySymbol}{formatted}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quick Add Line Item Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.textInput, { flex: 2 }]}
          placeholder="Item name (e.g. Pizza)"
          placeholderTextColor="#64748B"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
          placeholder={`${currencySymbol}0.00`}
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={newItemPrice}
          onChangeText={setNewItemPrice}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Plus color="#090D16" size={20} />
        </TouchableOpacity>
      </View>

      {/* Item List */}
      <ScrollView style={styles.itemList} contentContainerStyle={styles.itemListContent}>
        {items.map((item) => {
          const isClaimedByActive = item.assignedMemberIds.includes(selectedMemberId);
          const priceStr = (Number(item.priceCents) / 100).toFixed(2);
          const claimCount = item.assignedMemberIds.length;

          return (
            <View key={item.id} style={[styles.itemCard, isClaimedByActive && styles.claimedItemCard]}>
              <TouchableOpacity
                style={styles.itemLeft}
                activeOpacity={0.7}
                onPress={() => toggleItemClaim(item.id)}
              >
                <View style={[styles.checkbox, isClaimedByActive && styles.checkedCheckbox]}>
                  {isClaimedByActive && <Check color="#FFFFFF" size={14} />}
                </View>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSplitNote}>
                    {claimCount === 0
                      ? 'Tap to claim'
                      : claimCount === 1
                      ? `Paid by 1 person`
                      : `Split ${claimCount} ways`}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>{currencySymbol}{priceStr}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.trashBtn}>
                  <Trash2 color="#64748B" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(breakdown)}>
          <Text style={styles.confirmBtnText}>Save Itemized Split</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  memberRibbon: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    maxHeight: 74,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  activeMemberChip: {
    borderColor: '#10B981',
    backgroundColor: '#1E293B',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAvatar: {
    backgroundColor: '#10B981',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  activeMemberName: {
    color: '#F8FAFC',
  },
  memberOwed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  textInput: {
    backgroundColor: '#131B2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemList: {
    flex: 1,
  },
  itemListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  claimedItemCard: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  itemSplitNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  trashBtn: {
    padding: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#090D16',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
