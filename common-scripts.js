/* Settings flags */
const settingsFlagsKey = '?';
const settingsFlagsEnum = {
  allowCategoryEditing: 1,
};

function loadSettings(data) {
  const settings = {};
  const flags = data[settingsFlagsKey];
  settings.allowCategoryEditing = Boolean(settingsFlagsEnum.allowCategoryEditing & flags);
  return settings;
}
function saveSettings(settings) {
  let flags = 0;
  for (const [settingName, isEnabled] of Object.entries(settings)) {
    if (isEnabled) {
      flags |= settingsFlagsEnum[settingName];
    }
  }
  return flags;
}

/* Saving and loading */
const uncategorizedKey = '#';
const reservedKeys = [
  settingsFlagsKey,
  uncategorizedKey,
];
const regexRemoveBasenameFromUrl = /\/[^\/]*?$/;

async function uint8ArrayToBase64(data) {
  const base64url = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(new Blob([data]));
  });
  return base64url.split(',', 2)[1];
}
async function base64ToUint8Array(base64string) {
  const response = await fetch('data:;base64,' + base64string);
  const blob = await response.blob();
  return new Uint8Array(await blob.arrayBuffer());
}
async function saveToString(data) {
  const jsonString = JSON.stringify(data);
  const compressedData = pako.deflate(new TextEncoder().encode(jsonString));
  const base64String = await uint8ArrayToBase64(compressedData);
  const webSafeBase64String = base64String.replaceAll('+', '-').replaceAll('/', '_');
  return webSafeBase64String;
}
async function loadFromString(webSafeBase64String) {
  const base64String = webSafeBase64String.replaceAll('-', '+').replaceAll('_', '/');
  const compressedData = await base64ToUint8Array(base64String);
  const jsonString = new TextDecoder('utf8').decode(pako.inflate(compressedData));
  const data = JSON.parse(jsonString);
  return data;
}

/* Utilities */
function debounce(func, wait, immediate) {
  let timeout;
  return function debouncedFunc() {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if ( ! immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && ! timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}