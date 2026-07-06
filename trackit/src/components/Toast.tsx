import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

interface Props {
  visible: boolean;
  message: string;
  onHide: () => void;
}

export default function Toast({ visible, message, onHide }: Props) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        scale.setValue(0.5);
        onHide();
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [visible, scale, opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute bottom-10 self-center rounded-full bg-primary px-6 py-3"
      style={{ transform: [{ scale }], opacity }}
    >
      <Text className="text-base font-semibold text-white">{message}</Text>
    </Animated.View>
  );
}
