import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SessionCard from './SessionCard';
import SessionReviewModal from './SessionReviewModal';
import VoiceRecorder from './VoiceRecorder';
import { formatDateHeader } from '@/lib/dates';
import { fallbackParse, fetchSessionsForDate, parseSessionText } from '@/lib/sessions';
import { COLORS, type ParsedSession, type Session } from '@/lib/types';

interface Props {
  date: string | null; // visible when non-null (YYYY-MM-DD)
  onClose: () => void;
  onLogged: () => void;
}

const PLACEHOLDER =
  "Just tell me what you did... 'Hit chest and back, 4 sets bench ending at 185, rows felt strong. Then played pickleball for an hour after.'";

export default function DayModal({ date, onClose, onLogged }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<'type' | 'voice'>('type');
  const [typedText, setTypedText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<ParsedSession | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    setSessions([]);
    setTab('type');
    setTypedText('');
    setTranscript('');
    setParsed(null);
    fetchSessionsForDate(date)
      .then(setSessions)
      .catch(() => {});
  }, [date]);

  const text = (tab === 'type' ? typedText : transcript).trim();

  // Send the brain dump to the AI, then open the review screen with the result.
  // If the AI is unavailable, still open the review with a local draft so the
  // user can log manually instead of hitting a dead end.
  const submit = async () => {
    if (!date || !text) return;
    setSubmitting(true);
    setReviewText(text);
    try {
      const result = await parseSessionText(text);
      setReviewNotice(null);
      setParsed(result);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong.';
      console.warn('[DayModal] parse failed, opening manual review:', message);
      setReviewNotice(
        "AI couldn't process this automatically — review and fill in the details.",
      );
      setParsed(fallbackParse(text));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={date !== null && parsed === null}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="max-h-full rounded-t-3xl border-t border-line bg-background px-4 pb-8 pt-3">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-line" />

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">
              {date ? formatDateHeader(date) : ''}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {submitting ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="mt-4 text-base font-semibold text-white">
                Organizing your session...
              </Text>
              <Text className="mt-1 text-sm text-secondary">
                Turning your brain dump into a training log
              </Text>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {sessions.length > 0 && (
                <View className="mb-4">
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </View>
              )}

              <View className="mb-4 flex-row rounded-xl bg-card p-1">
                {(['type', 'voice'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTab(t)}
                    className={`flex-1 items-center rounded-lg py-2 ${
                      tab === t ? 'bg-primary' : ''
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        tab === t ? 'text-white' : 'text-secondary'
                      }`}
                    >
                      {t === 'type' ? 'Type' : 'Voice'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tab === 'type' ? (
                <TextInput
                  className="min-h-32 rounded-xl border border-line bg-card p-4 text-base text-white"
                  placeholder={PLACEHOLDER}
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  textAlignVertical="top"
                  value={typedText}
                  onChangeText={setTypedText}
                />
              ) : (
                <View>
                  <VoiceRecorder onTranscript={setTranscript} />
                  {transcript !== '' && (
                    <TextInput
                      className="min-h-24 rounded-xl border border-line bg-card p-4 text-base text-white"
                      multiline
                      textAlignVertical="top"
                      value={transcript}
                      onChangeText={setTranscript}
                    />
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={submit}
                disabled={!text}
                className={`mt-4 items-center rounded-xl py-4 ${
                  text ? 'bg-primary' : 'bg-card'
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    text ? 'text-white' : 'text-secondary'
                  }`}
                >
                  Log Session
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
      </Modal>

      <SessionReviewModal
        date={date}
        rawText={reviewText}
        parsed={parsed}
        notice={reviewNotice}
        onDiscard={() => setParsed(null)}
        onSaved={() => {
          setParsed(null);
          onLogged();
        }}
      />
    </>
  );
}
