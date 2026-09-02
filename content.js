(function () {
  const credentials = window.TONGJI_AUTH;
  if (!credentials?.username || !credentials?.password) return;

  const USER_SELECTORS = [
    'input[name="username"]',
    'input[name="uid"]',
    'input[id="username"]',
    'input[id="uid"]',
    'input[name*="user" i]',
    'input[id*="user" i]',
    'input[type="email"]'
  ];
  const CAPTCHA_SELECTORS = [
    'input[name*="captcha" i]',
    'input[id*="captcha" i]',
    'input[name="verifyCode"]'
  ];
  const LOGIN_BUTTON_SELECTORS = [
    'button.j-submit:not([disabled])',
    'button.login:not([disabled])',
    'button[type="submit"]:not([disabled])',
    'input[type="submit"]:not([disabled])'
  ];
  // Unicode escapes keep the Chinese labels stable across Windows encodings.
  const LOGIN_TEXT = /\u767b\s*\u5f55|\u767b\s*\u9304|\u7edf\u4e00\u8ba4\u8bc1|\u7d71\u4e00\u8a8d\u8b49|sign\s*in|log\s*in/i;

  let submitted = false;
  let scanTimer;

  const isVisible = (element) => Boolean(
    element &&
    element.getClientRects().length &&
    getComputedStyle(element).visibility !== 'hidden'
  );

  const findVisible = (root, selectors) => {
    for (const selector of selectors) {
      const element = Array.from(root.querySelectorAll(selector)).find(isVisible);
      if (element) return element;
    }
    return null;
  };

  const setInputValue = (input, value) => {
    if (input.value === value) return;

    const prototype = input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter ? setter.call(input, value) : (input.value = value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const stop = () => {
    observer.disconnect();
    clearTimeout(scanTimer);
  };

  const fillAndSubmit = () => {
    if (submitted) return;

    const password = findVisible(document, ['input[type="password"]']);
    if (!password) return;

    const form = password.form;
    const root = form || document;
    const username = findVisible(root, USER_SELECTORS);
    if (!username) return;

    setInputValue(username, credentials.username);
    setInputValue(password, credentials.password);

    // A visible captcha requires user interaction; only fill credentials.
    if (findVisible(root, CAPTCHA_SELECTORS)) return;

    const loginButton = findVisible(root, LOGIN_BUTTON_SELECTORS);
    const buttonText = loginButton?.innerText || loginButton?.value || '';

    // Use the site's click handler so its SSO tokens/signatures are generated.
    // Never bypass that handler with form.submit() or requestSubmit().
    if (loginButton && LOGIN_TEXT.test(buttonText.trim())) {
      submitted = true;
      stop();
      loginButton.click();
    }
  };

  const scheduleScan = () => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(fillAndSubmit, 100);
  };

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  fillAndSubmit();
})();
