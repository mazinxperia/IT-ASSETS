import { useEffect, useRef, useState } from 'react';
import useAppStore from '../store/useAppStore';

const useTabAnimation = (myTabIndex) => {
  const [focusAnim, setFocusAnim] = useState({ key: 0, direction: 1 });
  const prevTabRef = useRef(0);

  useEffect(() => {
    prevTabRef.current = useAppStore.getState().tabIndex;

    const unsub = useAppStore.subscribe((state) => {
      const newTab = state.tabIndex;
      const prevTab = prevTabRef.current;
      if (newTab === prevTab) return;

      if (newTab === myTabIndex) {
        const direction = newTab > prevTab ? 1 : -1;
        setFocusAnim((s) => ({ key: s.key + 1, direction }));
      }

      prevTabRef.current = newTab;
    });

    return unsub;
  }, [myTabIndex]);

  return focusAnim;
};

export default useTabAnimation;
