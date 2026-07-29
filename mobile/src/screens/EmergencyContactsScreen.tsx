import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, SafeAreaView, Switch } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const EmergencyContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal controllers
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [priority, setPriority] = useState('3');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/emergency-contacts');
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load contacts list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openAddModal = () => {
    setEditingContactId(null);
    setName('');
    setPhone('');
    setRelationship('');
    setPriority('3');
    setIsPrimary(false);
    setModalVisible(true);
  };

  const openEditModal = (contact: any) => {
    setEditingContactId(contact.contactId);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship);
    setPriority(String(contact.priority));
    setIsPrimary(contact.isPrimary);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !relationship.trim()) {
      Alert.alert('Validation Alert', 'Please complete all required fields.');
      return;
    }

    const priorityVal = parseInt(priority, 10);
    if (isNaN(priorityVal) || priorityVal < 1 || priorityVal > 5) {
      Alert.alert('Validation Alert', 'Priority ranking must be between 1 and 5.');
      return;
    }

    setSaving(true);

    try {
      if (editingContactId) {
        // Edit Contact PUT
        await apiClient.put(`/emergency-contacts/${editingContactId}`, {
          name,
          phone,
          relationship,
          priority: priorityVal,
          isPrimary,
        });
        Alert.alert('Success', 'Emergency contact updated successfully!');
      } else {
        // Add Contact POST
        await apiClient.post('/emergency-contacts', {
          name,
          phone,
          relationship,
          priority: priorityVal,
          isPrimary,
        });
        Alert.alert('Success', 'Emergency contact added successfully!');
      }

      setModalVisible(false);
      fetchContacts();
    } catch (err: any) {
      Alert.alert('Save Error', err.response?.data?.message || 'Failed to save emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contactId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/emergency-contacts/${contactId}`);
              Alert.alert('Deleted', 'Contact has been removed.');
              fetchContacts();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete contact.');
            }
          },
        },
      ]
    );
  };

  const renderContactItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.relationship}>({item.relationship})</Text>
        </View>
        <View style={styles.badgeRow}>
          {item.isPrimary && (
            <View style={[styles.badge, styles.badgePrimary]}>
              <Text style={styles.badgeText}>Primary</Text>
            </View>
          )}
          <View style={[styles.badge, styles.badgePriority]}>
            <Text style={styles.badgeText}>Rank: {item.priority}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.phone}>📞 {item.phone}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.btnEdit]} onPress={() => openEditModal(item)}>
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.btnDelete]} onPress={() => handleDelete(item.contactId)}>
          <Text style={styles.actionBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Circle</Text>
        <Text style={styles.subtitle}>Specify up to 5 contacts. In an emergency, these contacts are instantly alerted.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.contactId}
          renderItem={renderContactItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Your emergency contact list is empty.</Text>
            </View>
          }
        />
      )}

      {contacts.length < 5 && (
        <TouchableOpacity style={styles.floatingBtn} onPress={openAddModal}>
          <Text style={styles.floatingBtnText}>+ Add Contact</Text>
        </TouchableOpacity>
      )}

      {/* Add / Edit Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContactId ? 'Edit Emergency Contact' : 'New Emergency Contact'}</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder="Enter name" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone} placeholder="e.g. +15551234567" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

            <Text style={styles.label}>Relationship</Text>
            <TextInput style={styles.modalInput} value={relationship} onChangeText={setRelationship} placeholder="e.g. Father, Spouse, Sister" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Priority (1 = Highest, 5 = Lowest)</Text>
            <TextInput style={styles.modalInput} value={priority} onChangeText={setPriority} placeholder="e.g. 1" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Mark as Primary Contact</Text>
              <Switch value={isPrimary} onValueChange={setIsPrimary} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  relationship: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  phone: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginVertical: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePrimary: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
  },
  badgePriority: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.md,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnEdit: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  btnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  floatingBtn: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  floatingBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  modalBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnCancel: {
    backgroundColor: COLORS.border,
  },
});

export default EmergencyContactsScreen;
