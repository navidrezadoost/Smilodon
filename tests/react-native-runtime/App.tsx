import React, {useEffect, useRef, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Select, {
  type SelectHandle,
  type SelectItem,
  type SelectValue,
} from '@smilodon/react-native';
import { runtimeId } from './runtime-context';

const initialItems: SelectItem[] = [
  {value: 'alpha', label: 'Alpha'},
  {value: 'beta', label: 'Beta'},
  {value: 'gamma', label: 'Gamma'},
  {value: 'locked', label: 'Locked', disabled: true},
];

function report(event: string, detail?: unknown) {
  const serialized = detail === undefined ? '' : ` ${JSON.stringify(detail)}`;
  console.log(`SMILODON_RUNTIME:${runtimeId}:${event}${serialized}`);
}

export default function App() {
  const selectRef = useRef<SelectHandle | null>(null);
  const [items, setItems] = useState<SelectItem[]>(initialItems);
  const [value, setValue] = useState<SelectValue | undefined>('alpha');
  const [disabled, setDisabled] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    report('APP_MOUNTED');
    return () => report('APP_UNMOUNTED');
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    report('SELECT_MOUNTED');
    return () => report('SELECT_UNMOUNTED');
  }, [mounted]);

  const button = (id: string, label: string, onPress: () => void) => (
    <Pressable
      key={id}
      accessibilityRole="button"
      accessibilityLabel={`runtime-${id}`}
      onPress={onPress}
      style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Smilodon 178-F Android runtime</Text>
      <Text testID="runtime-state" accessibilityLabel="runtime-state" style={styles.state}>
        value={JSON.stringify(value)} · {disabled ? 'disabled' : 'enabled'} ·{' '}
        {multiple ? 'multiple' : 'single'} · {mounted ? 'mounted' : 'unmounted'}
      </Text>
      <View style={styles.controls}>
        {button('open', 'Open', () => selectRef.current?.open())}
        {button('close', 'Close', () => selectRef.current?.close())}
        {button('clear', 'Clear', () => selectRef.current?.clear())}
        {button('clear-search', 'Clear search', () => selectRef.current?.clearSearch())}
        {button('set-items', 'Set items', () => {
          const nextItems = [
            {value: 'delta', label: 'Delta'},
            {value: 'epsilon', label: 'Epsilon'},
            {value: 'locked', label: 'Locked', disabled: true},
          ];
          setItems(nextItems);
          setValue([]);
          selectRef.current?.setItems(nextItems);
          report('SET_ITEMS');
        })}
        {button('set-value', 'Set value', () => {
          const nextValue = multiple ? ['delta', 'epsilon'] : 'delta';
          setValue(nextValue);
          selectRef.current?.setValue(nextValue);
          report('SET_VALUE', nextValue);
        })}
        {button('toggle-disabled', 'Toggle disabled', () => {
          setDisabled(current => !current);
          report('DISABLED_TOGGLED', !disabled);
        })}
        {button('toggle-multiple', 'Toggle multiple', () => {
          setMultiple(current => !current);
          setValue([]);
          report('MULTIPLE_TOGGLED', !multiple);
        })}
        {button('reconnect', 'Reconnect', () => {
          setMounted(false);
          setTimeout(() => setMounted(true), 1_800);
        })}
      </View>
      <ScrollView style={styles.selectRegion} contentContainerStyle={styles.selectContent}>
        {mounted ? (
          <Select
            ref={selectRef}
            items={items}
            value={value}
            multiple={multiple}
            searchable
            disabled={disabled}
            placeholder="Choose an item"
            collapsedHeight={72}
            expandedHeight={360}
            onOpen={() => report('OPEN')}
            onClose={() => report('CLOSE')}
            onSelect={item => report('SELECT', item.value)}
            onChange={(nextValue, selectedItems) => {
              setValue(nextValue);
              report('CHANGE', {
                value: nextValue,
                labels: selectedItems.map(item => item.label),
              });
            }}
            onSearch={query => report('SEARCH', query)}
            onDiagnostic={detail => report('DIAGNOSTIC', detail)}
            containerStyle={styles.select}
          />
        ) : (
          <Text accessibilityLabel="runtime-select-unmounted">Select is unmounted</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 12},
  title: {fontSize: 18, fontWeight: '700', marginVertical: 8, color: '#111827'},
  state: {fontSize: 13, minHeight: 24, color: '#374151'},
  controls: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  button: {
    minWidth: '31%',
    minHeight: 42,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 4,
  },
  buttonText: {fontSize: 12, color: '#111827'},
  selectRegion: {flex: 1, marginTop: 4},
  selectContent: {flexGrow: 1},
  select: {width: '100%'},
});
