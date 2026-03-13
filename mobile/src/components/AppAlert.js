import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { FONTS } from '../constants/theme';

export default function AppAlert({ visible, title, message, buttons = [], colors, accentColor }) {
  useEffect(() => {
    if (visible && colors) {
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(colors.isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.box, { backgroundColor: colors.card, borderColor: accentColor + '30', borderWidth: 1 }]}>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>{title}</Text>
          {message ? <Text style={[styles.msg, { color: colors.textMuted }]}>{message}</Text> : null}
          <View style={styles.btns}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                onPress={btn.onPress}
                style={[
                  styles.btn,
                  btn.style === 'destructive'
                    ? { backgroundColor: '#ef444420', borderColor: '#ef4444', borderWidth: 1 }
                    : btn.style === 'cancel'
                    ? { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }
                    : { backgroundColor: accentColor },
                ]}
              >
                <Text style={[
                  styles.btnText,
                  { fontFamily: FONTS.semiBold },
                  btn.style === 'destructive' ? { color: '#ef4444' }
                  : btn.style === 'cancel' ? { color: colors.textMuted }
                  : { color: '#fff' },
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:      { width: '100%', borderRadius: 24, padding: 24 },
  title:    { fontSize: 18, marginBottom: 8 },
  msg:      { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  btns:     { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' },
  btn:      { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50 },
  btnText:  { fontSize: 14 },
});
