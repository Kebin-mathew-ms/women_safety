import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme';
import apiClient from '../services/api';
import socketService from '../services/socket';
import GpsService from '../services/gps';
import SecureStoreService from '../services/secureStore';

export const ChatScreen: React.FC<{ route: any }> = ({ route }) => {
  const { roomId, roomName } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Typing status
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async () => {
    try {
      const stored = await SecureStoreService.getItem('user_id');
      setMyUserId(stored);

      const response = await apiClient.get(`/chat/messages/${roomId}`);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load message history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Socket listeners setup
    const setupSockets = async () => {
      const socket = await socketService.connect();
      
      // Join Room channel
      socketService.emit('trip-start', { tripId: roomId }); // Reuses join room socket abstraction

      socketService.on('message-sent', (newMsg: any) => {
        setMessages((prev) => [...prev, newMsg]);
      });

      socketService.on('typing', () => {
        setIsTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
      });
    };

    setupSockets();

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const handleSend = async (messageType: string = 'text', payload: any = {}) => {
    if (messageType === 'text' && !text.trim()) return;

    try {
      const body: any = {
        roomId,
        messageType,
      };

      if (messageType === 'text') {
        body.message = text.trim();
        setText('');
      } else if (messageType === 'location') {
        body.latitude = payload.latitude;
        body.longitude = payload.longitude;
        body.message = `Shared Location Pin: ${payload.address}`;
      }

      await apiClient.post('/chat/messages', body);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleShareLocation = async () => {
    const loc = await GpsService.getCurrentLocation();
    if (loc) {
      handleSend('location', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: 'Current Tracker Pin',
      });
    } else {
      Alert.alert('GPS Error', 'Could not fetch current coordinates.');
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    socketService.emit('typing', { roomId });
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === myUserId;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper]}>
        {!isMe && <Text style={styles.senderLabel}>{item.sender?.fullName}</Text>}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.msgText, isMe ? styles.myMsgText : null]}>{item.message}</Text>
          {item.messageType === 'location' && (
            <Text style={styles.locCoords}>Lat: {item.latitude?.toFixed(4)}, Lon: {item.longitude?.toFixed(4)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.chatHeader}>
          <Text style={styles.headerTitle}>{roomName}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primaryLight} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.messageId}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.msgList}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <Text style={styles.typingBanner}>💬 Someone is typing...</Text>
        )}

        {/* Action tray */}
        <View style={styles.tray}>
          <TouchableOpacity style={styles.locBtn} onPress={handleShareLocation}>
            <Text style={styles.locIcon}>📍</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            value={text}
            onChangeText={handleInputChange}
            placeholder="Type message..."
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend('text')} disabled={!text.trim()}>
            <Text style={styles.sendText}>Send</Text>
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
  keyboardView: {
    flex: 1,
  },
  chatHeader: {
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
  msgList: {
    padding: SPACING.md,
  },
  bubbleWrapper: {
    marginBottom: 10,
    maxWidth: '75%',
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  otherBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
    marginLeft: 4,
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
    borderBottomLeftRadius: 2,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  myMsgText: {
    color: COLORS.white,
  },
  locCoords: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: 'bold',
  },
  typingBanner: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: SPACING.lg,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
  },
  locBtn: {
    padding: 10,
  },
  locIcon: {
    fontSize: 20,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginHorizontal: 10,
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

export default ChatScreen;
