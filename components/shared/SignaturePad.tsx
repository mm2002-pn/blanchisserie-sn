import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
// expo-file-system v19+ : API stable sous /legacy ; cacheDirectory + EncodingType y vivent.
import * as FileSystem from 'expo-file-system/legacy';

import { uploadSignature } from '@/services/uploads.service';

/**
 * Modal de signature. À la confirmation :
 *  1. Récupère le PNG en base64 (data URL)
 *  2. L'écrit en file://… (FileSystem)
 *  3. L'upload via /uploads/signatures
 *  4. Renvoie l'URL publique au parent via onSign(url)
 */

export interface SignaturePadProps {
  visible: boolean;
  onClose: () => void;
  onSign: (publicUrl: string) => void;
  title?: string;
}

const STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html { width: 100%; height: 100%; margin: 0; }
`;

export function SignaturePad({ visible, onClose, onSign, title }: SignaturePadProps) {
  const ref = useRef<SignatureViewRef>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    ref.current?.readSignature();
  };

  const handleData = async (dataUrl: string) => {
    if (!dataUrl) {
      setError('Signature vide.');
      return;
    }
    setBusy(true);
    try {
      // dataUrl = "data:image/png;base64,xxxx"
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const tmpUri = `${FileSystem.cacheDirectory}sig-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(tmpUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const uploaded = await uploadSignature(tmpUri);
      onSign(uploaded.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec upload signature.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose} disabled={busy}>
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
          <Text style={styles.title}>{title ?? 'Signature client'}</Text>
          <Pressable onPress={() => ref.current?.clearSignature()} disabled={busy}>
            <Text style={styles.clear}>Effacer</Text>
          </Pressable>
        </View>

        <View style={styles.canvas}>
          <SignatureScreen
            ref={ref}
            webStyle={STYLE}
            onOK={handleData}
            onEmpty={() => setError('Signature vide.')}
            descriptionText=""
            backgroundColor="#FFFFFF"
            penColor="#1A1712"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.confirmBtn, busy && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Valider la signature</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FCFBF9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E0DA',
  },
  cancel: { fontSize: 14, color: '#807A6F' },
  clear: { fontSize: 14, color: '#CF7B4B', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1712' },
  canvas: { flex: 1, backgroundColor: '#FFF' },
  error: { color: '#C53030', textAlign: 'center', padding: 8 },
  confirmBtn: {
    margin: 16,
    backgroundColor: '#2C3C79',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
