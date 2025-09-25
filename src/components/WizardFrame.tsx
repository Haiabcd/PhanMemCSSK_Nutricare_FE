// components/WizardFrame.tsx
import React from 'react';
import {
  View,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ProgressBar from '../components/ProgressBar';
import Container from '../components/Container';
import RowComponent from '../components/RowComponent';
import TitleComponent from '../components/TitleComponent';
import PressComponent from '../components/PressComponent';
import { colors } from '../constants/colors';
import TextComponent from '../components/TextComponent';
import { useWizard } from '../context/WizardContext';

export const STEP_ROUTES = [
  'StepName',
  'StepAge',
  'StepGender',
  'StepHeight',
  'StepWeight',
  'StepCondition',
  'StepAllergy',
  'StepLevelActivity',
  'StepTarget',
  'StepTargetPlan',
  'Done',
] as const;

interface WizardFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function WizardFrame(props: WizardFrameProps) {
  const { title, subtitle, children } = props;
  const navigation = useNavigation();
  const { form } = useWizard();
  const route = useRoute();

  const stepIndex = Math.max(
    0,
    STEP_ROUTES.indexOf(route.name as (typeof STEP_ROUTES)[number]),
  );
  const progress = (stepIndex + 1) / STEP_ROUTES.length;

  const goBack = () => {
    if (stepIndex === 0) {
      navigation.navigate('Welcome' as never);
    } else {
      navigation.navigate(STEP_ROUTES[stepIndex - 1] as never);
    }
  };

  const goNext = () => {
    if (!canProceed()) {
      return;
    }

    if (stepIndex < STEP_ROUTES.length - 1) {
      navigation.navigate(STEP_ROUTES[stepIndex + 1] as never);
    }
  };

  const canProceed = () => {
    const currentStep = STEP_ROUTES[stepIndex];

    switch (currentStep) {
      case 'StepName':
        return form.name && form.name.trim().length > 0;
      case 'StepTargetPlan':
        return !!form.targetPlanValid;
      default:
        return true;
    }
  };

  const isNextDisabled = !canProceed();

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Container>
        <RowComponent>
          <Pressable onPress={goBack} hitSlop={8}>
            <TitleComponent text="‹ Quay lại" color={colors.greenLight} />
          </Pressable>
          <ProgressBar progress={progress} />
        </RowComponent>

        <View style={styles.center}>
          <TitleComponent text={title} size={26} style={{ marginBottom: 15 }} />

          {subtitle && (
            <TextComponent
              text={subtitle}
              style={{ marginBottom: 34 }}
              color={colors.sub}
            />
          )}

          {children}
        </View>

        <View style={styles.bottom}>
          <PressComponent
            onPress={goNext}
            disabled={isNextDisabled}
            label={
              stepIndex === STEP_ROUTES.length - 1 ? 'Hoàn Thành' : 'Tiếp Theo'
            }
          />
        </View>
      </Container>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  center: {
    flex: 6,
  },
  bottom: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
