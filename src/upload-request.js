import { getBaseURL, httpHeaderSafeJson } from './utils';

function parseBodyToType(res) {
  const clone = res.clone();
  return new Promise((resolve) => {
    res.json()
      .then(data => resolve(data))
      .catch(() => clone.text().then(data => resolve(data)));
  }).then(data => [res, data]);
}

export function uploadRequest(path, args, auth, host, accessToken, selectUser) {
  if (auth !== 'user') {
    throw new Error(`Unexpected auth type: ${auth}`);
  }

  const { contents } = args;
  delete args.contents;

  const options = {
    body: contents,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': httpHeaderSafeJson(args),
    },
  };

  if (selectUser) {
    options.headers['Dropbox-API-Select-User'] = selectUser;
  }

  return fetch(getBaseURL(host) + path, options)
    .then(res => parseBodyToType(res))
    .then(([res, data]) => {
      // maintaining existing API for error codes not equal to 200 range
      if (!res.ok) {
        // eslint-disable-next-line no-throw-literal
        throw {
          error: data,
          response: res,
          status: res.status,
        };
      }

      return data;
    });
}
