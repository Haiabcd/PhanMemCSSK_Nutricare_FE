import React from 'react';
import { Pressable } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';

type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

const StepLevelActivityScreen = () => {
  const { form, updateForm } = useWizard();

  const options = React.useMemo(
    () => [
      {
        key: 'SEDENTARY' as ActivityLevel,
        title: 'Ít vận động',
        desc: 'Ít hoặc không tập luyện; công việc chủ yếu ngồi.',
        icon: '🛋️',
      },
      {
        key: 'LIGHTLY_ACTIVE' as ActivityLevel,
        title: 'Vận động nhẹ',
        desc: 'Tập luyện nhẹ 1–3 ngày/tuần hoặc di chuyển nhẹ nhàng.',
        icon: '🚶',
      },
      {
        key: 'MODERATELY_ACTIVE' as ActivityLevel,
        title: 'Vận động vừa phải',
        desc: 'Tập luyện vừa 3–5 ngày/tuần.',
        icon: '🏃',
      },
      {
        key: 'VERY_ACTIVE' as ActivityLevel,
        title: 'Vận động nhiều',
        desc: 'Tập luyện cường độ cao 6–7 ngày/tuần.',
        icon: '🏋️‍♂️',
      },
      {
        key: 'EXTRA_ACTIVE' as ActivityLevel,
        title: 'Vận động rất nhiều',
        desc: 'Công việc thể lực nặng hoặc tập 2 lần/ngày.',
        icon: '🔥',
      },
    ],
    [],
  );

  const onSelect = (key: ActivityLevel) => {
    if (__DEV__) {
      console.log('[ActivityLevel] prev=', form.activityLevel, 'next=', key);
    }
    updateForm({ activityLevel: key as any }); // nếu form.activityLevel đang là kiểu cũ, cast tạm
  };

  return (
    <WizardFrame
      title="Mức Độ Hoạt Động Của Bạn?"
      subtitle="Chia sẻ lối sống năng động của bạn để nhận kế hoạch dinh dưỡng được cá nhân hóa"
    >
      <ViewComponent gap={12} style={{ width: '100%' }}>
        {options.map(opt => {
          const selected = form.activityLevel === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
            >
              <ViewComponent
                variant="none"
                backgroundColor={selected ? colors.emerald50 : colors.white}
                border={true}
                borderColor={selected ? colors.green : colors.slate100}
                radius={16}
                p={16}
                style={{
                  borderWidth: 1.5,
                  shadowColor: selected ? colors.green : '#000',
                  shadowOpacity: selected ? 0.1 : 0.05,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: selected ? 4 : 3,
                }}
              >
                <ViewComponent row alignItems="flex-start" gap={12}>
                  <TextComponent
                    text={opt.icon}
                    size={24}
                    style={{ marginTop: 2 }}
                  />
                  <ViewComponent flex={1} gap={4}>
                    <TextComponent
                      text={opt.title}
                      size={16}
                      weight={selected ? 'bold' : 'semibold'}
                      color={selected ? colors.emerald800 : colors.slate800}
                      style={{ letterSpacing: 0.15 }}
                    />
                    <TextComponent
                      text={opt.desc}
                      size={13.5}
                      weight="regular"
                      color={selected ? colors.emerald800 : colors.slate500}
                      style={{ lineHeight: 18 }}
                    />
                  </ViewComponent>
                  {selected && (
                    <ViewComponent
                      backgroundColor={colors.green}
                      radius={12}
                      center
                      style={{ width: 24, height: 24 }}
                    >
                      <TextComponent
                        text="✓"
                        size={14}
                        weight="bold"
                        color={colors.white}
                      />
                    </ViewComponent>
                  )}
                </ViewComponent>
              </ViewComponent>
            </Pressable>
          );
        })}
      </ViewComponent>
    </WizardFrame>
  );
};

export default StepLevelActivityScreen;
