import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Delete, Check } from 'lucide-react-native';

interface NumericKeypadProps {
  initialCents?: bigint;
  currencySymbol?: string;
  onConfirm: (cents: bigint) => void;
  onCancel?: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  initialCents = 0n,
  currencySymbol = '$',
  onConfirm,
  onCancel,
}) => {
  const [cents, setCents] = useState<bigint>(initialCents);

  const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Gracefully fall back if web or haptics unavailable
    }
  };

  const handleDigit = (digit: number) => {
    triggerHaptic('light');
    if (cents > 99000000000n) return; // Supports up to 99 Lacs (99,00,000.00)
    setCents((prev) => prev * 10n + BigInt(digit));
  };

  const handleBackspace = () => {
    triggerHaptic('medium');
    setCents((prev) => prev / 10n);
  };

  const handleClear = () => {
    triggerHaptic('medium');
    setCents(0n);
  };

  const handleDone = () => {
    if (cents <= 0n) return;
    triggerHaptic('success');
    onConfirm(cents);
  };

  const formattedAmount = (Number(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      {/* Display Screen */}
      <View style={styles.displayArea}>
        <Text style={styles.currencySymbol}>{currencySymbol}</Text>
        <Text style={styles.amountText}>{formattedAmount}</Text>
      </View>

      {/* Grid of Keys */}
      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.key}
            activeOpacity={0.6}
            onPress={() => handleDigit(num)}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}

        {/* Bottom Row: Clear, 0, Backspace */}
        <TouchableOpacity style={styles.key} activeOpacity={0.6} onPress={handleClear}>
          <Text style={styles.actionKeyText}>C</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.key} activeOpacity={0.6} onPress={() => handleDigit(0)}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.key} activeOpacity={0.6} onPress={handleBackspace}>
          <Delete color="#94A3B8" size={26} />
        </TouchableOpacity>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.confirmButton, cents <= 0n && styles.disabledButton]}
        activeOpacity={0.8}
        disabled={cents <= 0n}
        onPress={handleDone}
      >
        <Text style={styles.confirmText}>Add Expense</Text>
        <Check color="#FFFFFF" size={22} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090D16',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
  },
  displayArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingVertical: 24,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 6,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    height: 64,
    backgroundColor: '#131B2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  actionKeyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F43F5E',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
