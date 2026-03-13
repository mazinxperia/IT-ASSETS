import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';

const { width, height } = Dimensions.get('window');
const EDGE_WIDTH = 30;

const EdgeSwipe = ({ onSwipeLeft, onSwipeRight }) => {
  const makePan = (side) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (side === 'left' && g.dx > 40) onSwipeRight?.();
      if (side === 'right' && g.dx < -40) onSwipeLeft?.();
    },
  });

  const leftPan  = useRef(makePan('left')).current;
  const rightPan = useRef(makePan('right')).current;

  return (
    <>
      <View
        style={[styles.edge, styles.left]}
        {...leftPan.panHandlers}
        pointerEvents="box-only"
      />
      <View
        style={[styles.edge, styles.right]}
        {...rightPan.panHandlers}
        pointerEvents="box-only"
      />
    </>
  );
};

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 80, // above bottom nav
    width: EDGE_WIDTH,
    zIndex: 999,
  },
  left:  { left: 0 },
  right: { right: 0 },
});

export default EdgeSwipe;
