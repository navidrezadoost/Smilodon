# Android runtime certification fixture

This minimal React Native `0.76.9` application exists only for the 178-F Android emulator workflow. The workflow builds Core and React Native from the checked-out commit, packs both workspaces, installs those tarballs into this app with the committed lockfile, builds the Android APK, and runs it on Android API 35.

The screen drives `@smilodon/react-native` through its actual native `WebView`. The host-side runner uses Android UI accessibility nodes to operate controls and select visible options, then checks native callback logs for initialization, open/close, search, single and multiple selection, disabled state, controlled updates, imperative methods, and teardown/reconnect behavior.

`artifacts/` is populated with package tarballs only while the workflow runs. No browser or JSDOM execution counts as native runtime evidence.
