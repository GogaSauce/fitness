import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Text, TouchableOpacity, View } from 'react-native';

import { transcribeAudio } from '@/lib/sessions';
import { COLORS } from '@/lib/types';

interface Props {
  onTranscript: (text: string) => void;
}

export default function VoiceRecorder({ onTranscript }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [transcribing, setTranscribing] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const isRecording = recorderState.isRecording;

  // Pulsing orange ring while recording.
  useEffect(() => {
    if (!isRecording) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulse]);

  const startRecording = async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed', 'Allow microphone access to log sessions by voice.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopAndTranscribe = async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;
    setTranscribing(true);
    try {
      const base64 = await new File(uri).base64();
      const transcript = await transcribeAudio(base64, 'audio/m4a');
      onTranscript(transcript.trim());
    } catch (e) {
      Alert.alert('Transcription failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setTranscribing(false);
    }
  };

  const onPress = () => {
    if (transcribing) return;
    if (isRecording) {
      stopAndTranscribe().catch(() => setTranscribing(false));
    } else {
      startRecording().catch(() =>
        Alert.alert('Recording failed', 'Could not start the microphone.'),
      );
    }
  };

  return (
    <View className="items-center py-6">
      <View className="h-28 w-28 items-center justify-center">
        {isRecording && (
          <Animated.View
            className="absolute h-24 w-24 rounded-full border-2 border-primary"
            style={{ transform: [{ scale: pulse }], opacity: 0.6 }}
          />
        )}
        <TouchableOpacity
          onPress={onPress}
          disabled={transcribing}
          className={`h-20 w-20 items-center justify-center rounded-full ${
            isRecording ? 'bg-red-500' : 'bg-primary'
          }`}
        >
          {transcribing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      <Text className="mt-3 text-sm text-secondary">
        {transcribing
          ? 'Transcribing...'
          : isRecording
            ? 'Recording... tap to stop'
            : 'Tap to record your session'}
      </Text>
      {isRecording && (
        <Text className="mt-1 text-xs" style={{ color: COLORS.primary }}>
          ● Recording
        </Text>
      )}
    </View>
  );
}
