import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';
import {runtimeId} from './runtime-context';

type Item = {value: string; label: string; disabled?: boolean};
const originalItems: Item[] = [
  {value: 'alpha', label: 'Alpha'},
  {value: 'beta', label: 'Beta'},
  {value: 'gamma', label: 'Gamma'},
  {value: 'locked', label: 'Locked', disabled: true},
];

const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font:18px Arial;margin:0;color:#111}button,input{font:18px Arial;box-sizing:border-box;width:100%;padding:14px;margin:0;border:1px solid #cbd5e1;background:white}#options[hidden]{display:none}button[disabled]{color:#aaa}#option-list{max-height:260px;overflow:auto}</style></head>
<body><main><button id="summary" aria-label="Choose an item">Choose an item</button>
<section id="options" hidden><input id="search" type="search" placeholder="Choose an item" aria-label="Choose an item" />
<div id="option-list"></div></section></main><script>
const send=(type,data)=>window.ReactNativeWebView.postMessage(JSON.stringify({type,data}));
let items=${JSON.stringify(originalItems)}, disabled=false, multiple=false, selected=[];
const options=document.getElementById('options'), list=document.getElementById('option-list'), search=document.getElementById('search');
function render(){list.replaceChildren(...items.filter(item=>item.label.toLowerCase().includes(search.value.toLowerCase())).map(item=>{const b=document.createElement('button');b.textContent=item.label;b.disabled=disabled||item.disabled;b.setAttribute('aria-label',item.label);b.onclick=()=>send('SELECT',item.value);return b;}));document.getElementById('summary').textContent=selected.length?selected.join(', '):'Choose an item';}
document.getElementById('summary').onclick=()=>send('OPEN');
search.oninput=()=>{for(const option of list.querySelectorAll('button')) option.hidden=!option.textContent.toLowerCase().includes(search.value.toLowerCase());send('SEARCH',search.value);};
window.addEventListener('message',event=>{let m;try{m=JSON.parse(event.data)}catch{return}switch(m.type){case 'OPEN':options.hidden=false;break;case 'CLOSE':options.hidden=true;break;case 'CLEAR_SEARCH':search.value='';render();break;case 'STATE':disabled=m.disabled;multiple=m.multiple;selected=m.labels;render();break;case 'ITEMS':items=m.items;search.value='';render();break;}});
render();
</script></body></html>`;

export default function ControlApp() {
  const web = useRef<WebView>(null);
  const [items, setItems] = useState<Item[]>(originalItems);
  const [value, setValue] = useState<string | string[]>('alpha');
  const [disabled, setDisabled] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [mounted, setMounted] = useState(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labels = useMemo(() => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map(v => items.find(item => item.value === v)?.label ?? v);
  }, [items, value]);

  const postToWeb = (message: unknown) => {
    web.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(message))}})); true;`,
    );
  };

  const report = useCallback((event: string, payload?: unknown) => {
    console.log(`SMILODON_CONTROL:${runtimeId}:${event}${payload === undefined ? '' : ` ${JSON.stringify(payload)}`}`);
  }, []);
  useEffect(() => {
    report('APP_MOUNTED');
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      report('APP_UNMOUNTED');
    };
  }, []);

  const postState = () => postToWeb({type: 'STATE', data: {disabled, multiple, labels}});
  const button = (id: string, label: string, onPress: () => void) => (
    <Pressable key={id} accessibilityRole="button" accessibilityLabel={`runtime-${id}`} onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  const handleMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as {type: string; data?: unknown};
    if (message.type === 'OPEN') {
      report('OPEN');
      postToWeb({type: 'OPEN'});
    } else if (message.type === 'SEARCH') {
      report('SEARCH', message.data);
    } else if (message.type === 'SELECT') {
      const selected = items.find(item => item.value === message.data);
      if (!selected || disabled || selected.disabled) return;
      report('SELECT', selected.value);
      const next = multiple
        ? [...new Set([...(Array.isArray(value) ? value : value ? [value] : []), selected.value])]
        : selected.value;
      setValue(next);
      report('CHANGE', {value: next, labels: [...(Array.isArray(next) ? next : [next])].map(v => items.find(item => item.value === v)?.label ?? v)});
      postToWeb({type: 'STATE', data: {disabled, multiple, labels: [...(Array.isArray(next) ? next : [next])].map(v => items.find(item => item.value === v)?.label ?? v)}});
      if (!multiple) postToWeb({type: 'CLOSE'});
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>React Native WebView control</Text>
      <Text accessibilityLabel="runtime-state" style={styles.state}>
        value={JSON.stringify(value)} · {disabled ? 'disabled' : 'enabled'} · {multiple ? 'multiple' : 'single'} · {mounted ? 'mounted' : 'unmounted'}
      </Text>
      <View style={styles.controls}>
        {button('open', 'Open', () => { report('OPEN'); postToWeb({type: 'OPEN'}); })}
        {button('close', 'Close', () => { report('CLOSE'); postToWeb({type: 'CLOSE'}); })}
        {button('clear', 'Clear', () => { setValue(multiple ? [] : ''); report('CHANGE', {value: multiple ? [] : '', labels: []}); postState(); })}
        {button('clear-search', 'Clear search', () => { postToWeb({type: 'CLEAR_SEARCH'}); report('CLEAR_SEARCH'); })}
        {button('set-items', 'Set items', () => { const next = [{value:'delta',label:'Delta'},{value:'epsilon',label:'Epsilon'},{value:'locked',label:'Locked',disabled:true}]; setItems(next); setValue([]); postToWeb({type:'ITEMS',data:{items:next}}); report('SET_ITEMS'); })}
        {button('set-value', 'Set value', () => { const next = multiple ? ['delta','epsilon'] : 'delta'; setValue(next); report('SET_VALUE', next); postState(); })}
        {button('toggle-disabled', 'Toggle disabled', () => { const next = !disabled; setDisabled(next); report('DISABLED_TOGGLED', next); setTimeout(postState, 0); })}
        {button('toggle-multiple', 'Toggle multiple', () => { const next = !multiple; setMultiple(next); setValue([]); report('MULTIPLE_TOGGLED', next); setTimeout(postState, 0); })}
        {button('reconnect', 'Reconnect', () => { setMounted(false); report('SELECT_UNMOUNTED'); reconnectTimer.current = setTimeout(() => { setMounted(true); report('SELECT_MOUNTED'); }, 1_800); })}
      </View>
      <ScrollView style={styles.webRegion} contentContainerStyle={styles.webContent}>
        {mounted ? <WebView ref={web} source={{html: page}} onMessage={handleMessage} onLoadEnd={() => { postState(); report('WEBVIEW_READY'); }} style={styles.web} /> : <Text>Select is unmounted</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#fff', paddingHorizontal: 12},
  title: {fontSize: 18, fontWeight: '700', marginVertical: 8, color: '#111827'},
  state: {fontSize: 13, minHeight: 24, color: '#374151'},
  controls: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  button: {minWidth: '31%', minHeight: 42, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dbeafe', borderRadius: 4},
  buttonText: {fontSize: 12, color: '#111827'},
  webRegion: {flex: 1, marginTop: 4},
  webContent: {flexGrow: 1},
  web: {flex: 1, minHeight: 360},
});
