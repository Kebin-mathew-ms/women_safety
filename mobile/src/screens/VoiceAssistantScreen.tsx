import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Animated, Easing, TextInput } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const VoiceAssistantScreen: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [typedCommand, setTypedCommand] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('Voice assistant ready. Tap mic or click shortcuts below.');

  // Wave anims
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/voice/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load voice logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartListening = () => {
    setListening(true);
    setAssistantResponse('Listening for safety command words...');

    // Waveform loop animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1.6, duration: 600, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 1.0, duration: 600, easing: Easing.linear, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 1.4, duration: 850, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 1.0, duration: 850, easing: Easing.linear, useNativeDriver: true }),
        ])
      ])
    ).start();

    // Auto-timeout mock speech parser trigger in 3 seconds
    setTimeout(() => {
      setListening(false);
      waveAnim1.setValue(1);
      waveAnim2.setValue(1);
      handleSendCommand('Navigate Home'); // Mock speech match
    }, 3000);
  };

  const handleSendCommand = async (commandStr: string) => {
    if (!commandStr.trim()) return;
    try {
      const response = await apiClient.post('/voice/command', {
        command: commandStr,
      });

      if (response.data.success) {
        const data = response.data.data;
        setAssistantResponse(`[Action: ${data.action.toUpperCase()}] "${data.responseText}"`);
        setTypedCommand('');
        fetchHistory(); // Reload logs
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to execute voice command.');
    }
  };

  const quickCommands = [
    'Help emergency SOS',
    'Cancel SOS',
    'Find nearby police',
    'Find safe hotel',
    'Start Trip tracking',
    'Stop Trip',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.assistantPanel}>
        <Text style={styles.panelTitle}>AI Voice Assistant</Text>
        
        {/* Animated listening rings */}
        <View style={styles.wavesContainer}>
          <Animated.View style={[styles.waveCircle, { transform: [{ scale: waveAnim1 }], opacity: listening ? 0.3 : 0 }]} />
          <Animated.View style={[styles.waveCircle, { transform: [{ scale: waveAnim2 }], opacity: listening ? 0.45 : 0 }]} />
          
          <TouchableOpacity style={[styles.micBtn, listening ? styles.micBtnListening : null]} onPress={handleStartListening}>
            <Text style={styles.micIcon}>{listening ? '🎙️' : '🎤'}</Text>
          </TouchableOpacity>
        </View>

        {/* Text-To-Speech response HUD */}
        <View style={styles.feedbackHud}>
          <Text style={styles.feedbackText}>{assistantResponse}</Text>
        </View>
      </View>

      {/* Manual Input Trigger */}
      <View style={styles.inputTray}>
        <TextInput
          style={styles.input}
          value={typedCommand}
          onChangeText={setTypedCommand}
          placeholder="Or type voice command (e.g. SOS)..."
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendCommand(typedCommand)} disabled={!typedCommand.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Shortcuts */}
      <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
      <View style={styles.shortcutsGrid}>
        {quickCommands.map((cmd) => (
          <TouchableOpacity key={cmd} style={styles.shortcutPill} onPress={() => handleSendCommand(cmd)}>
            <Text style={styles.shortcutLabel}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logs History */}
      <Text style={styles.sectionTitle}>Voice Commands History</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.commandId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <Text style={styles.logCmd}>Command: "{item.command}"</Text>
              <View style={styles.logFooter}>
                <Text style={styles.logAction}>Action: {item.action.toUpperCase()}</Text>
                <Text style={styles.logDate}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No speech command audits recorded.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  assistantPanel: {
    backgroundColor: COLORS.cardBackground,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  wavesContainer: {
    height: 120,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  waveCircle: {
    position: 'absolute',
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  micBtn: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  micBtnListening: {
    backgroundColor: COLORS.emergency,
  },
  micIcon: {
    fontSize: 28,
  },
  feedbackHud: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  feedbackText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputTray: {
    flexDirection: 'row',
    padding: SPACING.xl,
    paddingBottom: 0,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  shortcutPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  shortcutLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  logCmd: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  logAction: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  logDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  empty: {
    marginLeft: SPACING.xl,
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

export default VoiceAssistantScreen;
