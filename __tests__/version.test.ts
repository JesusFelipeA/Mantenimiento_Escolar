/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { APP_BUILD, APP_VERSION } from '../src/version';

const raiz = path.join(__dirname, '..');

test('la versión coincide en package.json, build.gradle y src/version.ts', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'),
  );
  const gradle = fs.readFileSync(
    path.join(raiz, 'android/app/build.gradle'),
    'utf8',
  );
  expect(pkg.version).toBe(APP_VERSION);
  expect(gradle).toContain(`versionName "${APP_VERSION}"`);
  expect(gradle).toMatch(new RegExp(`versionCode ${APP_BUILD}\\b`));
});
