
export function overrideProperties(target, source, overrides = []) {
  overrides.forEach(name => {
    if (source[name]) {
      target[name] = source[name];
    }
  });
}
