import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Share2, ScanLine, QrCode as QrIcon } from 'lucide-react-native';

interface QRCodeModalProps {
  visible: boolean;
  groupName: string;
  inviteToken: string;
  onClose: () => void;
  onScannedToken?: (scannedToken: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  groupName,
  inviteToken,
  onClose,
  onScannedToken,
}) => {
  const [mode, setMode] = useState<'SHOW' | 'SCAN'>('SHOW');
  const [permission, requestPermission] = useCameraPermissions();

  const joinUrl = `https://fairshare.app/join/${inviteToken}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join our group "${groupName}" on FairShare to track and split expenses (no download required!): ${joinUrl}`,
        url: joinUrl,
      });
    } catch {
      // Ignore share dismissal
    }
  };

  const handleScanBarcode = ({ data }: { data: string }) => {
    if (mode !== 'SCAN') return;
    // Extract token from URL or direct token string
    const match = data.match(/\/join\/([a-zA-Z0-9-]+)/);
    const token = match ? match[1] : data;
    if (onScannedToken && token) {
      onScannedToken(token);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{groupName}</Text>
              <Text style={styles.subtitle}>
                {mode === 'SHOW' ? 'Scan to join group instantly' : 'Scan a host’s QR code'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={24} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'SHOW' && styles.activeTab]}
              onPress={() => setMode('SHOW')}
            >
              <QrIcon size={18} color={mode === 'SHOW' ? '#FFFFFF' : '#94A3B8'} />
              <Text style={[styles.tabText, mode === 'SHOW' && styles.activeTabText]}>
                My QR Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'SCAN' && styles.activeTab]}
              onPress={async () => {
                if (!permission?.granted) {
                  await requestPermission();
                }
                setMode('SCAN');
              }}
            >
              <ScanLine size={18} color={mode === 'SCAN' ? '#FFFFFF' : '#94A3B8'} />
              <Text style={[styles.tabText, mode === 'SCAN' && styles.activeTabText]}>
                Scan QR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          {mode === 'SHOW' ? (
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={joinUrl}
                  size={220}
                  color="#090D16"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.infoText}>
                Friends can scan with their phone camera to view and claim expenses without downloading the app.
              </Text>
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare}>
                <Share2 color="#FFFFFF" size={18} />
                <Text style={styles.shareText}>Share Invite Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scannerContainer}>
              {permission?.granted ? (
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={handleScanBarcode}
                />
              ) : (
                <View style={styles.permissionBox}>
                  <Text style={styles.permissionText}>Camera permission is required to scan QR codes.</Text>
                  <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permBtnText}>Grant Camera Access</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#090D16',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#F8FAFC',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scannerContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
  },
  permBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
