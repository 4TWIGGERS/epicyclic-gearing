import React, {useState, useRef} from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import {
  Canvas,
  Path,
  Group,
  useValue,
  useLoop,
  Easing,
  useDerivedValue,
  interpolate,
  useValueEffect,
  useClockValue,
  useTouchHandler,
} from '@shopify/react-native-skia';

const {width: screenWidth, height} = Dimensions.get('window');

export default function App() {
  const frameRadius = useValue(0.5);

  const toothRadius = 0.008;
  const holeRadius = 0.02;
  const speed = 0.003;

  const x = Math.sin((2 * Math.PI) / 3);
  const y = Math.cos((2 * Math.PI) / 3);

  const viewWidth = screenWidth - 40;

  const gears = [
    {fill: '#c6dbef', teeth: 80, radius: -0.5, origin: [0, 0], annulus: true},
    {fill: '#6baed6', teeth: 16, radius: +0.1, origin: [0, 0]},
    {fill: '#9ecae1', teeth: 32, radius: -0.2, origin: [0, -0.3 * viewWidth]},
    {
      fill: '#9ecae1',
      teeth: 32,
      radius: -0.2,
      origin: [-0.3 * x * viewWidth, -0.3 * y * viewWidth],
    },
    {
      fill: '#9ecae1',
      teeth: 32,
      radius: -0.2,
      origin: [0.3 * x * viewWidth, -0.3 * y * viewWidth],
    },
  ];

  const angle = useValue(0);
  const frameAngle = useValue(0);

  const clock = useClockValue();
  const opacity = useValueEffect(clock, () => {
    angle.current += speed;
    if (frameRadius.current !== 0)
      frameAngle.current += speed / frameRadius.current;
  });

  const frameTransform = useDerivedValue(
    () => [
      {translateX: viewWidth / 2 + 20},
      {translateY: height / 2},
      {
        rotate: frameAngle.current % 360,
      },
    ],
    [frameAngle],
  );

  const gearTransforms = gears.map(({radius, origin}) =>
    useDerivedValue(
      () => [
        {translateX: origin[0]},
        {translateY: origin[1]},
        {
          rotate: (angle.current / radius) % 360,
        },
      ],
      [angle],
    ),
  );

  function getGear({teeth, radius, annulus}) {
    const n = teeth;
    let r2 = Math.abs(radius);
    let r0 = r2 - toothRadius;
    let r1 = r2 + toothRadius;
    let r3 = holeRadius;
    if (annulus) (r3 = r0), (r0 = r1), (r1 = r3), (r3 = r2 + toothRadius * 3);
    const da = Math.PI / n;
    let a0 = -Math.PI / 2 + (annulus ? Math.PI / n : 0);
    const path = [
      'M',
      r0 * Math.cos(a0) * viewWidth,
      ',',
      r0 * Math.sin(a0) * viewWidth,
    ];
    let i = -1;
    while (++i < n) {
      path.push(
        'A',
        r0 * viewWidth,
        ',',
        r0 * viewWidth,
        ` 0 0,${viewWidth} `,
        r0 * Math.cos((a0 += da)) * viewWidth,
        ',',
        r0 * Math.sin(a0) * viewWidth,
        'L',
        r2 * Math.cos(a0) * viewWidth,
        ',',
        r2 * Math.sin(a0) * viewWidth,
        'L',
        r1 * Math.cos((a0 += da / 3)) * viewWidth,
        ',',
        r1 * Math.sin(a0) * viewWidth,
        'A',
        r1 * viewWidth,
        ',',
        r1 * viewWidth,
        ` 0 0,${viewWidth} `,
        r1 * Math.cos((a0 += da / 3)) * viewWidth,
        ',',
        r1 * Math.sin(a0) * viewWidth,
        'L',
        r2 * Math.cos((a0 += da / 3)) * viewWidth,
        ',',
        r2 * Math.sin(a0) * viewWidth,
        'L',
        r0 * Math.cos(a0) * viewWidth,
        ',',
        r0 * Math.sin(a0) * viewWidth,
      );
    }
    path.push(
      'M0,',
      -r3 * viewWidth,
      'A',
      r3 * viewWidth,
      ',',
      r3 * viewWidth,
      ' 0 0,0 0,',
      r3 * viewWidth,
      'A',
      r3 * viewWidth,
      ',',
      r3 * viewWidth,
      ' 0 0,0 0,',
      -r3 * viewWidth,
      'Z',
    );

    return path.join('');
  }

  const touchStartTime = useRef(0);
  const touchHandler = useTouchHandler({
    onStart: () => {
      touchStartTime.current = Date.now();
    },
    onEnd: () => {
      if (Date.now() - touchStartTime.current < 500) {
        switch (frameRadius.current) {
          case 0.5:
            frameRadius.current = 0;
            break;
          case 0:
            frameRadius.current = -0.1;
            break;
          default:
            frameRadius.current = 0.5;
        }
      }
    },
  });

  return (
    <Canvas style={styles.root} onTouch={touchHandler}>
      <Group transform={frameTransform}>
        {gears.map((gear, i) => (
          <Group key={i.toString()} transform={gearTransforms[i]}>
            <Path
              style="stroke"
              color="black"
              key={i.toString()}
              path={getGear(gear)}
            />
            <Path color={gear.fill} path={getGear(gear)} />
          </Group>
        ))}
      </Group>
    </Canvas>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
