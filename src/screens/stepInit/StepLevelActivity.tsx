import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

type ActivityLevel =
  | 'Sedentary'
  | 'LightlyActive'
  | 'ModeratelyActive'
  | 'VeryActive'
  | 'ExtremelyActive';

const StepLevelActivityScreen = () => {
  const { form, updateForm } = useWizard();

  const options = React.useMemo(
    () => [
      {
        key: 'Sedentary' as ActivityLevel,
        title: 'Ít vận động',
        desc: 'Công việc văn phòng, di chuyển ít, ít hoặc không tập thể dục.',
        icon: '💺',
      },
      {
        key: 'LightlyActive' as ActivityLevel,
        title: 'Hoạt động nhẹ',
        desc: 'Công việc có di chuyển nhẹ nhàng, tập thể dục 1-3 lần/tuần.',
        icon: '🚶',
      },
      {
        key: 'ModeratelyActive' as ActivityLevel,
        title: 'Hoạt động trung bình',
        desc: 'Công việc đòi hỏi vận động, tập thể dục 3-5 lần/tuần.',
        icon: '🏃',
      },
      {
        key: 'VeryActive' as ActivityLevel,
        title: 'Hoạt động tích cực',
        desc: 'Công việc thể chất hoặc tập luyện cường độ cao 6-7 lần/tuần.',
        icon: '💪',
      },
      {
        key: 'ExtremelyActive' as ActivityLevel,
        title: 'Hoạt động cực cao',
        desc: 'Vận động viên hoặc lao động chân tay nặng nhọc, tập luyện 2+ lần/ngày.',
        icon: '🔥',
      },
    ],
    [],
  );

  const onSelect = (key: ActivityLevel) => {
    if (__DEV__) {
      console.log('[ActivityLevel] prev=', form.activityLevel, 'next=', key);
    }
    updateForm({ activityLevel: key });
  };

  return (
    <WizardFrame
      title="Mức Độ Hoạt Động Của Bạn?"
      subtitle="Chia sẻ lối sống năng động của bạn để nhận kế hoạch dinh dưỡng được cá nhân hóa"
    >
      <View style={styles.group}>
        {options.map(opt => {
          const selected = form.activityLevel === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.icon}>{opt.icon}</Text>

                <View style={styles.textContainer}>
                  <Text
                    style={[styles.title, selected && styles.titleSelected]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={[styles.desc, selected && styles.descSelected]}>
                    {opt.desc}
                  </Text>
                </View>

                {selected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </WizardFrame>
  );
};

/* ============= Styles ============= */
const { green, white } = colors;

const styles = StyleSheet.create({
  group: {
    width: '100%',
    gap: 12,
  },
  card: {
    backgroundColor: white,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,

    // Shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    borderColor: green,
    backgroundColor: '#ECFDF5',
    shadowColor: green,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: Platform.OS === 'ios' ? 0.9 : 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    fontSize: 24,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: 0.15,
  },
  titleSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '400',
  },
  descSelected: {
    color: '#065F46',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: green,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkmark: {
    color: white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StepLevelActivityScreen;
