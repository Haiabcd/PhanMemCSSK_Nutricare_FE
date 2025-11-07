import React, { useState, useRef } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  View as RNView,
} from 'react-native';
import WheelPicker from '../../components/WheelPicker';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import View from '../../components/ViewComponent';
import Text from '../../components/TextComponent';

const StepAgeScreen = () => {
  const { form, updateForm } = useWizard();
  const [showInput, setShowInput] = useState(false);
  const [inputYear, setInputYear] = useState(form.age?.toString() || '');
  const inputRef = useRef<TextInput>(null);

  const currentYear = new Date().getFullYear();
  const minValidYear = currentYear - 100;
  const maxValidYear = currentYear - 13;

  const calculateAge = (birthYear: number) => currentYear - birthYear;

  const handleYearSelect = (year: number) => updateForm({ age: year });

  const handleInputSubmit = () => {
    Keyboard.dismiss();
    const year = parseInt(inputYear, 10);

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
      <View flex={1} alignItems="center" px={24} pt={10} pb={24} gap={16}>
        {/* Khối hiển thị tuổi hiện tại (nhấn để nhập trực tiếp) */}
        {form.age && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAgeDisplayPress}
            style={{ width: '100%' }}
          >
            <View
              backgroundColor={colors.primarySurface}
              border
              borderColor={colors.primaryBorder}
              radius={16}
              px={20}
              // py={20}
              alignItems="center"
              style={{ width: '100%' }}
            >
              {showInput ? (
                <View
                  row
                  alignItems="center"
                  justifyContent="center"
                  gap={12}
                  style={{ width: '100%' }}
                >
                  <TextInput
                    ref={inputRef}
                    value={inputYear}
                    onChangeText={setInputYear}
                    keyboardType="number-pad"
                    maxLength={4}
                    onSubmitEditing={handleInputSubmit}
                    placeholder="Nhập năm sinh"
                    placeholderTextColor={colors.sub}
                    style={{
                      fontSize: 28,
                      textAlign: 'center',
                      color: colors.primaryDark,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.primary,
                      padding: 8,
                      minWidth: 110,
                    }}
                  />
                  <View row gap={8}>
                    <TouchableOpacity
                      onPress={handleInputSubmit}
                      style={{
                        backgroundColor: colors.primary,
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text text="✓" tone="inverse" variant="subtitle" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleInputCancel}
                      style={{
                        backgroundColor: colors.sub,
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text text="✕" tone="inverse" variant="subtitle" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text
                    text="Tuổi hiện tại của bạn"
                    variant="body"
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    text={`${calculateAge(form.age)} tuổi`}
                    variant="h1"
                    tone="primary"
                    style={{ letterSpacing: 0.5, marginBottom: 4 }}
                  />
                  <Text text={`(Sinh năm ${form.age})`} variant="body" />
                </>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* WheelPicker */}
        <View
          flex={1}
          justifyContent="center"
          style={{ width: '100%' }}
          mb={15}
          mt={15}
        >
          <WheelPicker value={form.age} onChange={handleYearSelect} />
        </View>

        {/* Hint */}
        <Text
          text={
            showInput
              ? 'Nhập năm sinh và nhấn ✓ để xác nhận'
              : 'Cuộn để chọn năm sinh hoặc nhấn vào tuổi để nhập trực tiếp'
          }
          variant="body"
          tone="muted"
          align="center"
        />
      </View>
    </WizardFrame>
  );
};

export default StepAgeScreen;
