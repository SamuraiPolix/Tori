import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BusinessServicesSettings({ services, onServicesChange }) {
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30' });
  const [editingService, setEditingService] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const durationOptions = ['15', '30', '45', '60', '90', '120'];

  const handleAddService = () => {
    if (!newService.name || !newService.price || !newService.duration) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    const updatedServices = [
      ...services,
      {
        ...newService,
        id: Date.now().toString(),
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration)
      }
    ];

    onServicesChange(updatedServices);
    setNewService({ name: '', price: '', duration: '30' });
  };

  const handleDeleteService = (serviceId) => {
    Alert.alert(
      'מחיקת שירות',
      'האם אתה בטוח שברצונך למחוק שירות זה?',
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'מחק',
          onPress: () => {
            const updatedServices = services.filter(s => s.id !== serviceId);
            onServicesChange(updatedServices);
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleUpdateService = () => {
    if (!editingService) return;

    const updatedServices = services.map(s =>
      s.id === editingService.id ? {
        ...editingService,
        price: parseFloat(editingService.price),
        duration: parseInt(editingService.duration)
      } : s
    );

    onServicesChange(updatedServices);
    setShowEditModal(false);
    setEditingService(null);
  };

  const renderDurationPicker = (service, onChange) => {
    const firstRow = durationOptions.slice(0, 3); 
    const secondRow = durationOptions.slice(3);    

    return (
      <View style={styles.durationPicker}>
        <View style={styles.durationRow}>
          {firstRow.map((duration) => (
            <Pressable
              key={duration}
              style={[
                styles.durationOption,
                service.duration === duration && styles.selectedDurationOption
              ]}
              onPress={() => onChange(duration)}
            >
              <Text style={[
                styles.durationText,
                service.duration === duration && styles.selectedDurationText
              ]}>
                {duration === '60' ? 'שעה' : 
                 duration === '90' ? 'שעה וחצי' : 
                 duration === '120' ? 'שעתיים' : 
                 `${duration} דק'`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.durationRow}>
          {secondRow.map((duration) => (
            <Pressable
              key={duration}
              style={[
                styles.durationOption,
                service.duration === duration && styles.selectedDurationOption
              ]}
              onPress={() => onChange(duration)}
            >
              <Text style={[
                styles.durationText,
                service.duration === duration && styles.selectedDurationText
              ]}>
                {duration === '60' ? 'שעה' : 
                 duration === '90' ? 'שעה וחצי' : 
                 duration === '120' ? 'שעתיים' : 
                 `${duration} דק'`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Icon name="spa" size={28} color="#2563eb" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>ניהול שירותים</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        הוסף ונהל את השירותים שהעסק שלך מציע 🎯
      </Text>

      {/* Add New Service Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="plus-circle" size={24} color="#2563eb" />
          <Text style={styles.cardTitle}>שירות חדש</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>✨ שם השירות</Text>
          <TextInput
            style={styles.input}
            value={newService.name}
            onChangeText={text => setNewService({ ...newService, name: text })}
            placeholder="לדוגמה: תספורת גברים"
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>💰 מחיר</Text>
            <TextInput
              style={styles.input}
              value={newService.price}
              onChangeText={text => setNewService({ ...newService, price: text })}
              placeholder="₪"
              keyboardType="numeric"
              textAlign="right"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>⏱️ משך זמן</Text>
            {renderDurationPicker(newService, (duration) => 
              setNewService({ ...newService, duration })
            )}
          </View>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={handleAddService}
        >
          <Icon name="plus" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>הוסף שירות</Text>
        </Pressable>
      </View>

      {/* Services List */}
      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>📋 השירותים שלי</Text>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.serviceActions}>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => {
                    setEditingService(service);
                    setShowEditModal(true);
                  }}
                >
                  <Icon name="pencil" size={16} color="#2563eb" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteService(service.id)}
                >
                  <Icon name="delete" size={16} color="#dc2626" />
                </Pressable>
              </View>
            </View>
            <View style={styles.serviceDetails}>
              <View style={styles.detailItem}>
                <Icon name="currency-ils" size={16} color="#64748b" />
                <Text style={styles.detailText}>{service.price} ₪</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="clock-outline" size={16} color="#64748b" />
                <Text style={styles.detailText}>{service.duration} דקות</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ עריכת שירות</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>שם השירות</Text>
                <TextInput
                  style={styles.input}
                  value={editingService?.name}
                  onChangeText={text => setEditingService({ ...editingService, name: text })}
                  textAlign="right"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>מחיר</Text>
                  <TextInput
                    style={styles.input}
                    value={editingService?.price.toString()}
                    onChangeText={text => setEditingService({ ...editingService, price: text })}
                    keyboardType="numeric"
                    textAlign="right"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>משך זמן</Text>
                  {editingService && renderDurationPicker(editingService, (duration) => 
                    setEditingService({ ...editingService, duration })
                  )}
                </View>
              </View>

              <Pressable
                style={styles.updateButton}
                onPress={handleUpdateService}
              >
                <Icon name="content-save" size={20} color="#ffffff" />
                <Text style={styles.updateButtonText}>שמור שינויים</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2563eb',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  durationPicker: {
    gap: 8,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  durationOption: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedDurationOption: {
    backgroundColor: '#bfdbfe',
  },
  durationText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
  },
  selectedDurationText: {
    color: '#2563eb',
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  servicesContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1e293b',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
  },
  modalBody: {
    padding: 16,
  },
  updateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
});
