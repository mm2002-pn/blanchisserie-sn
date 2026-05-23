import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { FontFamily, Typography } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Affiche un QR code encodant l'ID API de la commande.
 * Le driver scanne ce QR depuis l'écran (driver)/collect → setScannedId(id).
 */
export interface OrderQrModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  clientName?: string;
}

export function OrderQrModal({
  visible,
  onClose,
  orderId,
  orderNumber,
  clientName,
}: OrderQrModalProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
          <View style={[styles.handle, { backgroundColor: colors.ink200 }]} />
          <Text style={[styles.caps, { color: colors.ink500 }]}>
            QR pour collecte
          </Text>
          <Text style={[styles.orderNum, { color: colors.ink900 }]}>
            {orderNumber}
          </Text>
          {clientName && (
            <Text style={[styles.client, { color: colors.ink500 }]}>{clientName}</Text>
          )}

          <View style={styles.qrWrap}>
            <QRCode
              value={orderId}
              size={220}
              color={colors.ink900}
              backgroundColor={colors.paper}
            />
          </View>

          <Text style={[styles.hint, { color: colors.ink500 }]}>
            Présente cet écran au chauffeur lors de la collecte.
          </Text>

          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.ink900 }]}
            onPress={onClose}
          >
            <Text style={[styles.closeBtnText, { color: colors.paper }]}>
              Fermer
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    marginBottom: 18,
  },
  caps: {
    fontFamily: FontFamily.uiMedium,
    fontSize: Typography.fontSize.tiny,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  orderNum: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 22,
    marginTop: 4,
  },
  client: {
    fontFamily: FontFamily.uiRegular,
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  qrWrap: {
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  hint: {
    fontFamily: FontFamily.uiRegular,
    fontSize: Typography.fontSize.tiny,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  closeBtn: {
    marginTop: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 99,
    minWidth: 160,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: FontFamily.uiSemibold,
    fontSize: Typography.fontSize.sm,
  },
});
