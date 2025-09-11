// features/WizardScreens.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import WheelPicker from '../../components/WheelPicker';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

const GREEN = colors?.green ?? '#22C55E';
const GREEN_DARK = '#16A34A';
const EMERALD_50 = '#ECFDF5';
const EMERALD_100 = '#D1FAE5';
const SLATE_600 = '#475569';
const SLATE_400 = '#94A3B8';

const StepAgeScreen = () => {
  const { form, updateForm } = useWizard();
  const [showInput, setShowInput] = useState(false);
  const [inputYear, setInputYear] = useState(form.age?.toString() || '');
  const inputRef = useRef<TextInput>(null);

  const currentYear = new Date().getFullYear();
  const minValidYear = currentYear - 100; // Tối đa 100 tuổi
  const maxValidYear = currentYear - 13; // Tối thiểu 13 tuổi (độ tuổi hợp lý cho app)

  const years = Array.from(
    { length: maxValidYear - minValidYear + 1 },
    (_, i) => maxValidYear - i,
  );

  // Tính tuổi từ năm sinh
  const calculateAge = (birthYear: number) => {
    return currentYear - birthYear;
  };

  const handleYearSelect = (year: number) => {
    updateForm({ age: year });
  };

  const handleInputSubmit = () => {
    Keyboard.dismiss();
    const year = parseInt(inputYear);

    if (isNaN(year)) {
      Alert.alert('Lỗi', 'Vui lòng nhập năm hợp lệ');
      return;
    }

    if (year < minValidYear || year > maxValidYear) {
      Alert.alert(
        'Năm không hợp lệ',
        `Vui lòng nhập năm từ ${minValidYear} đến ${maxValidYear}`,
      );
      return;
    }

    updateForm({ age: year });
    setShowInput(false);
  };

  const handleInputCancel = () => {
    setInputYear(form.age?.toString() || '');
    setShowInput(false);
    Keyboard.dismiss();
  };

  const handleAgeDisplayPress = () => {
    setInputYear(form.age?.toString() || '');
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <WizardFrame
      title="Năm Sinh Của Bạn?"
      subtitle="Thông tin này giúp xác định chính xác nhu cầu dinh dưỡng phù hợp với độ tuổi của bạn"
    >
      <View style={styles.container}>
        {/* Hiển thị tuổi hiện tại - có thể nhấn để nhập trực tiếp */}
        {form.age && (
          <TouchableOpacity
            style={styles.ageDisplay}
            onPress={handleAgeDisplayPress}
            activeOpacity={0.7}
          >
            {showInput ? (
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.yearInput}
                  value={inputYear}
                  onChangeText={setInputYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  onSubmitEditing={handleInputSubmit}
                  placeholder="Nhập năm sinh"
                />
                <View style={styles.inputButtons}>
                  <TouchableOpacity
                    onPress={handleInputSubmit}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.buttonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleInputCancel}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.ageLabel}>Tuổi hiện tại của bạn</Text>
                <Text style={styles.ageValue}>
                  {calculateAge(form.age)} tuổi
                </Text>
                <Text style={styles.yearText}>(Sinh năm {form.age})</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.wheelContainer}>
          <WheelPicker value={form.age} onChange={handleYearSelect} />
        </View>

        <Text style={styles.hintText}>
          {showInput
            ? 'Nhập năm sinh và nhấn ✓ để xác nhận'
            : 'Cuộn để chọn năm sinh hoặc nhấn vào tuổi để nhập trực tiếp'}
        </Text>
      </View>
    </WizardFrame>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  ageDisplay: {
    width: '100%',
    backgroundColor: EMERALD_50,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: EMERALD_100,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  yearInput: {
    fontSize: 28,
    fontWeight: '800',
    color: GREEN_DARK,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    padding: 8,
    minWidth: 100,
    marginRight: 12,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: GREEN,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: SLATE_400,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SLATE_600,
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 28,
    fontWeight: '800',
    color: GREEN_DARK,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  yearText: {
    fontSize: 14,
    color: SLATE_400,
    fontWeight: '500',
  },
  wheelContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: SLATE_400,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

export default StepAgeScreen;
