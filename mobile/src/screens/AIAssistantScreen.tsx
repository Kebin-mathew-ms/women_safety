import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/ai/history');
      if (response.data.success) {
        // Reformat history into chat bubbles
        const chats: any[] = [];
        response.data.data.forEach((item: any) => {
          chats.push({ id: item.conversationId + '-q', text: item.question, isMe: true });
          chats.push({ id: item.conversationId + '-a', text: item.answer, isMe: false });
        });
        setMessages(chats.reverse()); // Show newest at the bottom by reversing back
      }
    } catch (err: any) {
      console.warn('Failed to fetch AI chat logs:', err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setQuestion('');
    
    // Append temporarily
    setMessages((prev) => [...prev, { id: 'temp-q', text: queryText.trim(), isMe: true }]);

    try {
      const response = await apiClient.post('/ai/chat', { question: queryText.trim() });
      if (response.data.success) {
        const data = response.data.data;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== 'temp-q'), // Remove temp
          { id: data.conversationId + '-q', text: data.question, isMe: true },
          { id: data.conversationId + '-a', text: data.answer, isMe: false }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp-q'),
        { id: 'err', text: 'Failed to retrieve AI recommendations. Rule-based system offline.', isMe: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    'Can I travel tonight safely?',
    'What should I do during an emergency?',
    'Precautions to take during night journeys?',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Intelligent Travel Companion</Text>
          <Text style={styles.headerSub}>Hybrid Rule-based + Ollama safety reasoning engine active.</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrapper, item.isMe ? styles.myWrapper : styles.otherWrapper]}>
              <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.msgText, item.isMe ? styles.myMsg : null]}>{item.text}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤖</Text>
              <Text style={styles.emptyTitle}>Ask me safety recommendations!</Text>
              <Text style={styles.emptySub}>e.g. Find hotels with security guard or safe route guidelines.</Text>
            </View>
          }
        />

        {loading && <ActivityIndicator size="small" color={COLORS.primaryLight} style={{ margin: 10 }} />}

        {/* Shortcuts */}
        {messages.length === 0 && (
          <View style={styles.shortcuts}>
            {templates.map((txt) => (
              <TouchableOpacity key={txt} style={styles.shortcutPill} onPress={() => handleSend(txt)}>
                <Text style={styles.shortcutText}>{txt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputTray}>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask safety advisor details..."
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(question)} disabled={!question.trim()}>
            <Text style={styles.sendText}>Ask</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: SPACING.md,
  },
  bubbleWrapper: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  myWrapper: {
    alignSelf: 'flex-end',
  },
  otherWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  myMsg: {
    color: COLORS.white,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  shortcuts: {
    paddingHorizontal: SPACING.xl,
    gap: 8,
    marginBottom: SPACING.md,
  },
  shortcutPill: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  inputTray: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
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
});

export default AIAssistantScreen;
