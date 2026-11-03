/**
 * FairShare Core Financial Engine (Updated with Multi-Payer & Kitty Pool support)
 * Integer-cent based math to eliminate floating-point precision errors.
 */

export interface MemberBalance {
  memberId: string;
  netBalanceCents: bigint; // Positive = is owed money, Negative = owes money
}

export interface SimplifiedTransaction {
  fromMemberId: string; // Debtor
  toMemberId: string;   // Creditor
  amountCents: bigint;  // Amount to transfer
}

export interface PayerShare {
  memberId: string;
  paidAmountCents: bigint;
}

export interface ParticipantShare {
  memberId: string;
  owedAmountCents: bigint;
}

/**
 * Solves the Min-Cash-Flow problem on a directed graph.
 * Reduces O(N^2) transactions down to at most N - 1 transactions.
 */
export function simplifyDebts(balances: MemberBalance[]): SimplifiedTransaction[] {
  const debtors: { memberId: string; amount: bigint }[] = [];
  const creditors: { memberId: string; amount: bigint }[] = [];

  for (const b of balances) {
    if (b.netBalanceCents < 0n) {
      debtors.push({ memberId: b.memberId, amount: -b.netBalanceCents });
    } else if (b.netBalanceCents > 0n) {
      creditors.push({ memberId: b.memberId, amount: b.netBalanceCents });
    }
  }

  debtors.sort((a, b) => (b.amount > a.amount ? 1 : -1));
  creditors.sort((a, b) => (b.amount > a.amount ? 1 : -1));

  const transactions: SimplifiedTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = debtor.amount < creditor.amount ? debtor.amount : creditor.amount;

    transactions.push({
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
      amountCents: settleAmount,
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0n) dIdx++;
    if (creditor.amount === 0n) cIdx++;
  }

  return transactions;
}

/**
 * Computes net balances for a bill with MULTIPLE PAYERS and multiple participants.
 * e.g., Hotel $300: Alice paid $200, Bob paid $100. Split between Alice, Bob, Charlie ($100 each).
 * Net result:
 * Alice: +$200 (paid) - $100 (share) = +$100
 * Bob:   +$100 (paid) - $100 (share) = $0
 * Charlie: $0 (paid)  - $100 (share) = -$100 (Charlie pays Alice $100 directly!)
 */
export function calculateMultiPayerNetDeltas(
  payers: PayerShare[],
  participants: ParticipantShare[]
): Map<string, bigint> {
  const deltas = new Map<string, bigint>();

  // Credit each payer for what they paid
  for (const p of payers) {
    const current = deltas.get(p.memberId) ?? 0n;
    deltas.set(p.memberId, current + p.paidAmountCents);
  }

  // Debit each participant for what they owe
  for (const part of participants) {
    const current = deltas.get(part.memberId) ?? 0n;
    deltas.set(part.memberId, current - part.owedAmountCents);
  }

  return deltas;
}

/**
 * Distributes an exact total amount in cents equally among participants,
 * allocating leftover fractional cents deterministically so the sum ALWAYS equals total.
 */
export function calculateEqualSplit(
  totalAmountCents: bigint,
  memberIds: string[]
): ParticipantShare[] {
  if (memberIds.length === 0) return [];
  const count = BigInt(memberIds.length);
  const baseShare = totalAmountCents / count;
  let remainder = totalAmountCents % count;

  return memberIds.map((memberId) => {
    let owed = baseShare;
    if (remainder > 0n) {
      owed += 1n;
      remainder -= 1n;
    }
    return {
      memberId,
      owedAmountCents: owed,
    };
  });
}
