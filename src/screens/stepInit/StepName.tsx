import React, { useState } from 'react';
import { TextInput } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import View from '../../components/ViewComponent';
import Text from '../../components/TextComponent';

const StepNameScreen = () => {
  const { form, updateForm } = useWizard();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <WizardFrame
      title="Bạn Tên Là Gì?"
      subtitle="Hãy cho chúng tôi biết tên của bạn để cá nhân hóa trải nghiệm"
    >
      <View flex={1} gap={12}>
        {/* Name Input */}
        <View style={{ width: '100%' }}>
          <TextInput
            placeholder="Nhập tên của bạn..."
            placeholderTextColor={colors.sub}
            value={form.name}
            onChangeText={t => updateForm({ name: t })}
            returnKeyType="done"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={50}
            autoCapitalize="words"
            autoFocus
            // styling hạn chế: ưu tiên tokens và trạng thái focus
            style={{
              width: '100%',
              backgroundColor: isFocused
                ? colors.primarySurface
                : colors.inputBg,
              borderWidth: 1,
              borderColor: isFocused ? colors.primaryBorder : colors.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.text,
            }}
          />

          <Text
            text={`${form.name.length}/50 ký tự`}
            variant="caption"
            tone="muted"
            align="right"
            style={{ marginTop: 8, marginRight: 4 }}
          />
        </View>

        {/* Hint */}
        <Text
          text="Bạn có thể sử dụng tên thật hoặc biệt danh mà bạn thích"
          variant="body"
          tone="muted"
          align="center"
          style={{ marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}
        />
      </View>
    </WizardFrame>
  );
};

export default StepNameScreen;
