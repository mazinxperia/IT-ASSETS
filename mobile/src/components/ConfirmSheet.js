import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import useAppStore from '../store/useAppStore';
import { getColors, FONTS } from '../constants/theme';

const ConfirmSheet = ({ visible, title, message, confirmLabel, onConfirm, onCancel }) => {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);
  const colors = getColors(theme, accentColor, isConnected);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.cardElevated }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: colors.errorLight }]}>
            <AlertTriangle size={28} color={colors.error} />
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>
            {title || 'Are you sure?'}
          </Text>
          <Text style={[styles.message, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            {message || 'This action cannot be undone.'}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onCancel}
              testID="confirm-sheet-cancel"
            >
              <Text style={[styles.btnText, { color: colors.text, fontFamily: FONTS.semiBold }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: colors.error }]}
              onPress={onConfirm}
              testID="confirm-sheet-confirm"
            >
              <Text style={[styles.btnText, { color: '#FFFFFF', fontFamily: FONTS.semiBold }]}>{confirmLabel || 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  btnText: {
    fontSize: 15,
  },
});

export default ConfirmSheet;
