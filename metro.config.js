const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

const ZUSTAND_DIR = path.join(__dirname, 'node_modules', 'zustand');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react-native-maps is native-only — it imports React Native internals that
  // don't exist on web. Expo Router's require.context still pulls
  // app/(tabs)/index.tsx into the web bundle even though app/(tabs)/index.web.tsx
  // is the route that renders, so the import has to be stubbed rather than
  // avoided. Web gets its map from @react-google-maps/api instead.
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'empty' };
  }

  // zustand's export map serves ./esm/*.mjs under the "import" condition, and
  // zustand/middleware's devtools helper uses `import.meta.env`. Metro emits a
  // classic <script> for web, where `import.meta` is a SyntaxError that kills
  // the entire bundle before any of it runs — the app then only ever shows the
  // statically pre-rendered HTML. Native resolves the "react-native" condition
  // to the CJS build instead, which is why this only breaks on web.
  // The root CJS files are equivalent, so point web at them directly.
  if (platform === 'web' && /^zustand(\/|$)/.test(moduleName)) {
    const subpath = moduleName.slice('zustand'.length).replace(/^\//, '');
    const target = path.join(ZUSTAND_DIR, `${subpath || 'index'}.js`);
    if (fs.existsSync(target)) {
      return { type: 'sourceFile', filePath: target };
    }
  }

  return (originalResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform
  );
};

module.exports = config;
