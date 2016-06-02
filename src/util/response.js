import R from 'ramda';

// Is the argument a message? It's a message if it's an Array, nested Arrays, or
// a value comprised solely of String, Number, null, undefined or false values.
export const isMessage = R.pipe(
  arg => [arg],
  R.flatten,
  R.reject(s => R.isNil(s) || s === false || typeof s === 'string' || typeof s === 'number'),
  R.length,
  R.equals(0)
);

// Is the argument an array of messages?
export function isArrayOfMessages(messages) {
  return Array.isArray(messages) && messages.every(isMessage);
}

// Flatten message array and remove null, undefined or false items, then join
// on newline.
export const normalizeMessage = R.pipe(
  arg => [arg],
  R.flatten,
  R.reject(s => R.isNil(s) || s === false),
  R.join('\n')
);

// Normalize an array of messages, removing null, undefined or false items.
export const normalizeMessages = R.pipe(
  R.reject(s => R.isNil(s) || s === false),
  R.map(normalizeMessage)
);
