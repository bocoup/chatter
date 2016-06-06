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

// Normalize response into an array of 0 or more text messages. For each
// "message", flatten all arrays, remove any false, null or undefined values,
// and join the resulting flattened and filtered array on newline.
export function normalizeResponse(response = {}) {
  if (isMessage(response)) {
    return [normalizeMessage(response)];
  }
  else if (isArrayOfMessages(response.messages)) {
    return normalizeMessages(response.messages);
  }
  else if ('message' in response && isMessage(response.message)) {
    return [normalizeMessage(response.message)];
  }
  return false;
}
