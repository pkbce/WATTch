# TODO: Update Consumption Label on Inactive Status

## Completed Tasks
- [x] Add state for tracking last consumption map and timers
- [x] Implement useEffect to handle 3-second timer when socket becomes inactive
- [x] Update CardDescription to display "Last Consumption" after 3 seconds of inactivity
- [x] Fix duplicate currentSocket declaration
- [x] Test the implementation to ensure it works as expected

## Pending Tasks
- [ ] Verify that the label changes correctly when switching between sockets
- [ ] Ensure timers are properly cleaned up to avoid memory leaks

## APK Conversion Tasks
- [ ] Install cross-env for Windows compatibility
- [ ] Update build script in package.json to use cross-env
- [ ] Configure Next.js for static export in next.config.ts
- [ ] Update capacitor.config.ts webDir to 'out'
- [ ] Run npm run build
- [ ] Run npx cap copy
- [ ] Run npx cap add android
- [ ] Run npx cap open android
- [ ] Build APK in Android Studio
